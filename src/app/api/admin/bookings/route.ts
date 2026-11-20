import { NextRequest } from "next/server";
import { z } from "zod";
import { guard } from "@/lib/admin-guard";
import { requireDb } from "@/lib/supabase/admin";
import { handleError, json } from "@/lib/request";
import { loadSettings } from "@/lib/settings-server";
import { busyRangeFor, isSlotAvailable } from "@/lib/availability";
import type { BookingRow, BookingStatus } from "@/lib/bookings";
import { cancelledEmail, needsReschedulingEmail, quoteReadyEmail, rescheduledEmail, sendEmail } from "@/lib/email";
import { deleteCalendarEvent, upsertCalendarEvent } from "@/lib/google-calendar";
import { SITE_URL } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { deny } = await guard();
  if (deny) return deny;
  const scope = req.nextUrl.searchParams.get("scope") ?? "upcoming";
  try {
    const sb = requireDb();
    let q = sb.from("bookings").select("*");
    const now = new Date().toISOString();
    if (scope === "upcoming") q = q.in("status", ["confirmed", "needs_rescheduling"]).or(`scheduled_start.gte.${now},status.eq.needs_rescheduling`).order("scheduled_start", { ascending: true, nullsFirst: true });
    else if (scope === "quotes") q = q.in("status", ["quote_requested", "quote_sent"]).order("created_at", { ascending: false });
    else if (scope === "pending") q = q.in("status", ["pending_payment"]).order("created_at", { ascending: false });
    else if (scope === "past") q = q.in("status", ["confirmed", "completed"]).lt("scheduled_start", now).order("scheduled_start", { ascending: false });
    else q = q.order("created_at", { ascending: false });
    const { data, error } = await q.limit(500);
    if (error) throw new Error(error.message);
    return json({ bookings: data });
  } catch (e) {
    return handleError(e, "admin.bookings.get");
  }
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("status"),
    id: z.string().uuid(),
    status: z.enum(["confirmed", "needs_rescheduling", "completed", "cancelled"]),
    reason: z.string().max(500).optional(),
    notify: z.boolean().default(true),
  }),
  z.object({ action: z.literal("reschedule"), id: z.string().uuid(), start: z.string().datetime(), notify: z.boolean().default(true), force: z.boolean().default(false) }),
  z.object({ action: z.literal("notes"), id: z.string().uuid(), notes: z.string().max(5000) }),
  z.object({
    action: z.literal("quote"),
    id: z.string().uuid(),
    quotedTotalCents: z.number().int().min(100).max(10_000_000),
    durationMinutes: z.number().int().min(15).max(720),
    send: z.boolean().default(true),
  }),
]);

export async function PATCH(req: Request) {
  const { deny } = await guard();
  if (deny) return deny;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid request" }, 400);
  const input = parsed.data;

  try {
    const sb = requireDb();
    const { data: b } = await sb.from("bookings").select("*").eq("id", input.id).maybeSingle<BookingRow>();
    if (!b) return json({ error: "Not found" }, 404);
    let emailSent: boolean | null = null;

    if (input.action === "notes") {
      await sb.from("bookings").update({ admin_notes: input.notes }).eq("id", b.id);
    }

    if (input.action === "status") {
      const patch: Partial<BookingRow> = { status: input.status as BookingStatus };
      if (input.status === "cancelled" || input.status === "needs_rescheduling") {
        // free the slot
        patch.busy_start = null;
        patch.busy_end = null;
        if (input.status === "cancelled") patch.cancelled_reason = input.reason ?? null;
      }
      if (input.status === "confirmed") {
        if (b.deposit_status !== "paid") return json({ error: "Only bookings with a verified deposit can be confirmed." }, 400);
        if (!b.scheduled_start) return json({ error: "Reschedule this booking to a time first." }, 400);
      }
      const { error } = await sb.from("bookings").update(patch).eq("id", b.id);
      if (error) return json({ error: error.code === "23P01" ? "That time now overlaps another booking." : error.message }, 409);
      const updated = { ...b, ...patch };
      if (input.status === "cancelled" && b.calendar_event_id) await deleteCalendarEvent(b.calendar_event_id);
      if (input.notify) {
        if (input.status === "cancelled") emailSent = (await sendEmail(cancelledEmail(updated, input.reason))).sent;
        if (input.status === "needs_rescheduling") emailSent = (await sendEmail(needsReschedulingEmail(updated))).sent;
      }
    }

    if (input.action === "reschedule") {
      if (b.deposit_status !== "paid") return json({ error: "Only paid bookings can be rescheduled here." }, 400);
      const { settings } = await loadSettings();
      const duration = b.duration_minutes ?? settings.services[b.package].durationMinutes;
      const start = new Date(input.start);
      if (!input.force) {
        const ok = await isSlotAvailable({ settings, service: b.package, start, durationMinutes: duration, excludeBookingId: b.id, ignoreNotice: true });
        if (!ok) return json({ error: "That time isn't available (outside hours, blocked, or overlapping another booking).", code: "slot_unavailable" }, 409);
      }
      const { busyStart, busyEnd, end } = busyRangeFor(start, duration, settings);
      const patch = {
        status: "confirmed" as const,
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
        busy_start: busyStart.toISOString(),
        busy_end: busyEnd.toISOString(),
        reminder_sent_at: null,
      };
      const { error } = await sb.from("bookings").update(patch).eq("id", b.id);
      if (error) return json({ error: error.code === "23P01" ? "That time overlaps another booking." : error.message }, 409);
      const updated = { ...b, ...patch } as BookingRow;
      const calId = await upsertCalendarEvent(
        {
          summary: `${b.package_name} — ${b.customer_name}`,
          description: `Ref ${b.reference}\n${b.phone} · ${b.email}\n\nAdmin: ${SITE_URL}/admin`,
          location: b.address_formatted ?? "",
          start,
          end,
          bookingId: b.id,
        },
        b.calendar_event_id
      ).catch(() => null);
      if (calId && calId !== b.calendar_event_id) await sb.from("bookings").update({ calendar_event_id: calId }).eq("id", b.id);
      if (input.notify) emailSent = (await sendEmail(rescheduledEmail(updated))).sent;
    }

    if (input.action === "quote") {
      if (b.package !== "fpv" || !["quote_requested", "quote_sent"].includes(b.status)) return json({ error: "Only open FPV quote requests can be priced." }, 400);
      const patch = { quoted_total_cents: input.quotedTotalCents, duration_minutes: input.durationMinutes, status: "quote_sent" as const };
      await sb.from("bookings").update(patch).eq("id", b.id);
      if (input.send) emailSent = (await sendEmail(quoteReadyEmail({ ...b, ...patch }))).sent;
      const link = `${SITE_URL}/book?quote=${b.reference}&t=${b.access_token}`;
      const { data } = await sb.from("bookings").select("*").eq("id", b.id).single();
      return json({ booking: data, emailSent, link });
    }

    const { data } = await sb.from("bookings").select("*").eq("id", b.id).single();
    return json({ booking: data, emailSent });
  } catch (e) {
    return handleError(e, "admin.bookings.patch");
  }
}
