import { configured } from "@/lib/env";
import { loadSettings } from "@/lib/settings-server";
import { busyRangeFor, isSlotAvailable } from "@/lib/availability";
import { generateAccessToken, generateReference, projectColumns, releaseExpiredHolds, type BookingRow } from "@/lib/bookings";
import { effectivePriceCents, isFpv } from "@/lib/settings";
import { requireDb } from "@/lib/supabase/admin";
import { clientIp, handleError, hashIp, json, rateLimit } from "@/lib/request";
import { fieldErrors, formatAddress, formatPhone, holdRequestSchema } from "@/lib/validation";
import { safeEqual } from "@/lib/tokens";
import { addMinutes } from "@/lib/time";

export const dynamic = "force-dynamic";

/**
 * POST /api/bookings/hold
 * Validates the booking, re-checks the slot, and creates a temporary "pending_payment" hold
 * that expires after `holdMinutes` unless the $20 deposit is verified.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`hold:${ip}`, 12, 10 * 60_000)) return json({ error: "Too many attempts. Please wait a few minutes and try again." }, 429);

  const parsed = holdRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) }, 422);
  const input = parsed.data;

  if (!configured.database()) return json({ error: "Online booking is being set up. Please contact us to book.", code: "setup_required" }, 503);
  if (!configured.square()) return json({ error: "Online deposits are being set up. Please contact us to book.", code: "setup_required" }, 503);

  try {
    const sb = requireDb();
    const { settings, hoursConfigured } = await loadSettings();
    if (!hoursConfigured) return json({ error: "Online scheduling is being set up.", code: "setup_required" }, 503);

    const svc = settings.services[input.service];
    let quoteRow: BookingRow | null = null;
    // Server-side price only — never trust a client-sent amount.
    let total = effectivePriceCents(settings, input.service);
    let duration = svc.durationMinutes;

    if (input.quote) {
      // Booking from a priced inquiry/quote link (any package).
      const { data } = await sb.from("bookings").select("*").eq("reference", input.quote.reference).maybeSingle<BookingRow>();
      if (!data || !safeEqual(data.access_token, input.quote.token) || !["quote_sent", "pending_payment"].includes(data.status) || data.deposit_status === "paid")
        return json({ error: "This quote link is invalid or has already been used." }, 403);
      if (data.package !== input.service) return json({ error: "This quote is for a different package." }, 400);
      if (!data.quoted_total_cents) return json({ error: "This quote hasn't been priced yet." }, 400);
      quoteRow = data;
      total = data.quoted_total_cents;
      duration = data.duration_minutes ?? duration;
    } else if (!svc.active || !svc.selfBookable || total == null) {
      return json({ error: "This package is planned with you first. Please send us an inquiry and we'll reply with a quote.", code: "inquiry_only" }, 400);
    }
    if (isFpv(input.service) && !input.project.industry && !quoteRow?.industry) {
      return json({ error: "Please check the highlighted fields.", fields: { "project.industry": "Tell us what we're filming" } }, 422);
    }

    // Service area
    const zip3 = input.address.zip.slice(0, 3);
    const outside = settings.serviceArea.zipPrefixes.length > 0 && !settings.serviceArea.zipPrefixes.includes(zip3);
    if (outside && settings.serviceArea.outsideAreaBehavior === "block") {
      return json(
        { error: `This address is outside our online booking area (${settings.serviceArea.label}). Contact us for a custom quote.`, fields: { "address.zip": "Outside our service area" } },
        422
      );
    }

    // Release an earlier hold from this same checkout (user went back to change the time)
    if (input.replaceHold) {
      const { data: prev } = await sb.from("bookings").select("id, access_token, status, deposit_status").eq("reference", input.replaceHold.reference).maybeSingle();
      if (prev && safeEqual(prev.access_token, input.replaceHold.token) && prev.status === "pending_payment" && prev.deposit_status !== "paid" && prev.deposit_status !== "processing") {
        if (quoteRow && prev.id === quoteRow.id) {
          await sb.from("bookings").update({ busy_start: null, busy_end: null, hold_expires_at: null }).eq("id", prev.id);
        } else {
          await sb.from("bookings").update({ status: "expired", busy_start: null, busy_end: null }).eq("id", prev.id);
        }
      }
    }

    await releaseExpiredHolds();

    const start = new Date(input.start);
    const available = await isSlotAvailable({ settings, service: input.service, start, durationMinutes: duration, excludeBookingId: quoteRow?.id });
    if (!available) return json({ error: "Sorry — that time was just taken or is no longer available. Please pick another time.", code: "slot_unavailable" }, 409);

    const { busyStart, busyEnd, end } = busyRangeFor(start, duration, settings);
    const a = input.address;
    const record = {
      status: "pending_payment" as const,
      package: input.service,
      package_name: quoteRow?.package_name ?? svc.name,
      customer_name: input.contact.name,
      email: input.contact.email,
      phone: formatPhone(input.contact.phone),
      business_name: input.contact.businessName ?? null,
      address_line1: a.line1,
      address_line2: a.line2 ?? null,
      city: a.city,
      state: a.state,
      zip: a.zip,
      address_formatted: formatAddress(a),
      address_place_id: a.placeId ?? null,
      address_lat: a.lat ?? null,
      address_lng: a.lng ?? null,
      address_verified: Boolean(a.placeId),
      outside_service_area: outside,
      ...projectColumns({ ...input.project, description: input.project.description ?? quoteRow?.project_description ?? undefined, industry: input.project.industry ?? quoteRow?.industry ?? undefined }),
      quoted_total_cents: total,
      // Snapshot of the pricing shown at booking time (launch vs standard).
      standard_price_cents: quoteRow ? quoteRow.standard_price_cents : (svc.standardPriceCents ?? null),
      launch_pricing: quoteRow ? quoteRow.launch_pricing : Boolean(settings.launch.enabled && svc.standardPriceCents != null),
      location_review: svc.requiresLocationReview ? ("pending" as const) : null,
      deposit_cents: settings.depositCents,
      deposit_status: "unpaid" as const,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      duration_minutes: duration,
      busy_start: busyStart.toISOString(),
      busy_end: busyEnd.toISOString(),
      hold_expires_at: addMinutes(new Date(), settings.holdMinutes).toISOString(),
      policy_accepted_at: new Date().toISOString(),
      policy_text: settings.policy.text,
      utm: input.attribution?.utm ?? quoteRow?.utm ?? {},
      fbp: input.attribution?.fbp ?? null,
      fbc: input.attribution?.fbc ?? null,
      marketing_consent: input.attribution?.consent ?? false,
      ip_hash: hashIp(ip),
      user_agent: req.headers.get("user-agent")?.slice(0, 400) ?? null,
    };

    const result = quoteRow
      ? await sb.from("bookings").update(record).eq("id", quoteRow.id).select("id, reference, access_token, hold_expires_at").single()
      : await sb
          .from("bookings")
          .insert({ ...record, reference: generateReference(), access_token: generateAccessToken() })
          .select("id, reference, access_token, hold_expires_at")
          .single();

    if (result.error) {
      if (result.error.code === "23P01") {
        return json({ error: "Sorry — that time was just taken. Please pick another time.", code: "slot_unavailable" }, 409);
      }
      throw new Error(result.error.message);
    }

    return json({
      bookingId: result.data.id,
      reference: result.data.reference,
      token: result.data.access_token,
      holdExpiresAt: result.data.hold_expires_at,
      totalCents: total,
      depositCents: settings.depositCents,
      remainingCents: Math.max(0, (total ?? 0) - settings.depositCents),
      outsideServiceArea: outside,
    });
  } catch (e) {
    return handleError(e, "hold");
  }
}
