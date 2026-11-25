import "server-only";
import crypto from "node:crypto";
import { requireDb } from "@/lib/supabase/admin";
import { confirmationEmail, sendEmail, teamNotificationEmail } from "@/lib/email";
import { sendPurchaseEvent } from "@/lib/meta-capi";
import { upsertCalendarEvent } from "@/lib/google-calendar";
import type { SquarePayment } from "@/lib/square";
import type { ServiceKey } from "@/lib/settings";
import type { ProjectInput } from "@/lib/validation";
import { SITE_URL, configured } from "@/lib/env";

export type BookingStatus =
  | "quote_requested"
  | "quote_sent"
  | "pending_payment"
  | "confirmed"
  | "needs_rescheduling"
  | "completed"
  | "cancelled"
  | "expired";

export type PaymentStatus = "unpaid" | "processing" | "paid" | "failed" | "refunded";

export interface BookingRow {
  id: string;
  reference: string;
  access_token: string;
  status: BookingStatus;
  package: ServiceKey;
  package_name: string;
  customer_name: string;
  email: string;
  phone: string;
  business_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  address_formatted: string | null;
  address_verified: boolean;
  address_lat: number | null;
  address_lng: number | null;
  outside_service_area: boolean;
  property_type: string | null;
  project_description: string | null;
  filming_requirements: string | null;
  special_instructions: string | null;
  access_notes: string | null;
  fpv_interest: boolean;
  preferred_dates: string | null;
  quoted_total_cents: number | null;
  deposit_cents: number;
  deposit_status: PaymentStatus;
  square_payment_id: string | null;
  square_receipt_url: string | null;
  payment_attempts: number;
  scheduled_start: string | null;
  scheduled_end: string | null;
  busy_start: string | null;
  busy_end: string | null;
  duration_minutes: number | null;
  hold_expires_at: string | null;
  policy_accepted_at: string | null;
  policy_text: string | null;
  utm: Record<string, string> | null;
  fbp: string | null;
  fbc: string | null;
  marketing_consent: boolean;
  user_agent: string | null;
  confirmation_email_sent_at: string | null;
  team_email_sent_at: string | null;
  reminder_sent_at: string | null;
  calendar_event_id: string | null;
  admin_notes: string | null;
  cancelled_reason: string | null;
  // FPV / inquiry fields (migration 20261124_fpv_packages)
  is_inquiry: boolean;
  industry: string | null;
  indoor_outdoor: string | null;
  space_size: string | null;
  intended_use: string[] | null;
  social_handle: string | null;
  is_wedding_videographer: boolean;
  event_date: string | null;
  expected_attendance: string | null;
  location_review: "pending" | "approved" | "declined" | null;
  standard_price_cents: number | null;
  launch_pricing: boolean;
  created_at: string;
  updated_at: string;
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function generateReference() {
  const bytes = crypto.randomBytes(6);
  return "CL-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
export const generateAccessToken = () => crypto.randomBytes(24).toString("base64url");

/** Mark expired unpaid holds so their slots are released (DB constraint ignores them afterwards). */
export async function releaseExpiredHolds() {
  const sb = requireDb();
  const now = new Date().toISOString();
  // Bookings that started as an inquiry go back to "quote_sent" so the customer's quote link keeps working.
  await sb
    .from("bookings")
    .update({ status: "quote_sent", busy_start: null, busy_end: null, scheduled_start: null, scheduled_end: null, hold_expires_at: null })
    .eq("status", "pending_payment")
    .eq("is_inquiry", true)
    .not("deposit_status", "in", "(processing,paid)")
    .lt("hold_expires_at", now);
  const { data, error } = await sb
    .from("bookings")
    .update({ status: "expired", busy_start: null, busy_end: null })
    .eq("status", "pending_payment")
    .not("deposit_status", "in", "(processing,paid)")
    .lt("hold_expires_at", now)
    .select("id");
  if (error) console.error("[holds] release failed", error.message);
  return data?.length ?? 0;
}

/**
 * Called after Square reports a COMPLETED payment (from the payment API response OR the webhook).
 * Idempotent: only the first caller flips the booking to confirmed and sends notifications.
 */
export async function confirmDeposit(bookingRef: string, payment: SquarePayment) {
  const sb = requireDb();
  if (payment.status !== "COMPLETED") return { confirmed: false as const, reason: "not_completed" };

  const { data: existing } = await sb.from("bookings").select("*").eq("reference", bookingRef).maybeSingle<BookingRow>();
  if (!existing) return { confirmed: false as const, reason: "not_found" };
  if (payment.amount_money.amount !== existing.deposit_cents || payment.amount_money.currency !== "USD") {
    console.error("[confirm] amount mismatch", bookingRef, payment.amount_money);
    return { confirmed: false as const, reason: "amount_mismatch" };
  }

  // Atomic transition: only succeeds once.
  const { data: updated, error } = await sb
    .from("bookings")
    .update({
      status: existing.status === "expired" ? "needs_rescheduling" : "confirmed",
      deposit_status: "paid",
      square_payment_id: payment.id,
      square_receipt_url: payment.receipt_url ?? null,
      hold_expires_at: null,
    })
    .eq("id", existing.id)
    .neq("deposit_status", "paid")
    .select("*")
    .maybeSingle<BookingRow>();

  if (error) {
    // A paid hold that expired and whose slot was taken can violate the overlap constraint.
    console.error("[confirm] update failed", error.message);
    await sb
      .from("bookings")
      .update({ status: "needs_rescheduling", deposit_status: "paid", square_payment_id: payment.id, busy_start: null, busy_end: null })
      .eq("id", existing.id)
      .neq("deposit_status", "paid");
    const { data: b } = await sb.from("bookings").select("*").eq("id", existing.id).single<BookingRow>();
    if (b) await notifyAfterPayment(b);
    return { confirmed: false as const, reason: "needs_rescheduling", booking: b };
  }
  if (!updated) {
    // Someone else already confirmed it.
    const { data: b } = await sb.from("bookings").select("*").eq("id", existing.id).single<BookingRow>();
    return { confirmed: b?.status === "confirmed", reason: "already_processed", booking: b };
  }

  await notifyAfterPayment(updated);
  return { confirmed: updated.status === "confirmed", booking: updated };
}

async function notifyAfterPayment(b: BookingRow) {
  const sb = requireDb();
  const tasks: Promise<unknown>[] = [];
  const patch: Partial<BookingRow> = {};

  tasks.push(
    sendEmail(confirmationEmail(b)).then((r) => {
      if (r.sent) patch.confirmation_email_sent_at = new Date().toISOString();
    })
  );
  tasks.push(
    sendEmail(teamNotificationEmail(b, "new_booking")).then((r) => {
      if (r.sent) patch.team_email_sent_at = new Date().toISOString();
    })
  );
  tasks.push(sendPurchaseEvent(b));
  if (b.scheduled_start && b.scheduled_end && b.status === "confirmed") {
    tasks.push(
      upsertCalendarEvent({
        summary: `${b.package_name} — ${b.customer_name}`,
        description: `Ref ${b.reference}\n${b.phone} · ${b.email}\n${b.project_description ?? ""}\n\nAdmin: ${SITE_URL}/admin`,
        location: b.address_formatted ?? "",
        start: new Date(b.scheduled_start),
        end: new Date(b.scheduled_end),
        bookingId: b.id,
      })
        .then((id) => {
          if (id) patch.calendar_event_id = id;
        })
        .catch((e) => console.error("[gcal]", e))
    );
  }
  await Promise.allSettled(tasks);
  if (Object.keys(patch).length) await sb.from("bookings").update(patch).eq("id", b.id);
}

/** Fields safe to show the customer on the confirmation page. */
/** Maps validated project fields to their booking columns (shared by holds and inquiries). */
export function projectColumns(p: ProjectInput) {
  return {
    industry: p.industry ?? null,
    property_type: p.industry && p.industry !== "real-estate" && p.industry !== "realestate" ? null : (p.propertyType ?? null),
    project_description: p.description ?? null,
    filming_requirements: p.filmingRequirements ?? null,
    special_instructions: p.specialInstructions ?? null,
    access_notes: p.accessNotes ?? null,
    fpv_interest: p.fpvInterest ?? false,
    indoor_outdoor: p.indoorOutdoor ?? null,
    space_size: p.spaceSize ?? null,
    intended_use: p.intendedUse ?? [],
    social_handle: p.socialHandle ?? null,
    is_wedding_videographer: p.isVideographer ?? false,
    event_date: p.eventDate ?? null,
    expected_attendance: p.expectedAttendance ?? null,
  };
}

export function publicBookingView(b: BookingRow) {
  return {
    id: b.id,
    reference: b.reference,
    status: b.status,
    depositStatus: b.deposit_status,
    packageKey: b.package,
    packageName: b.package_name,
    customerName: b.customer_name,
    email: b.email,
    scheduledStart: b.scheduled_start,
    scheduledEnd: b.scheduled_end,
    address: b.address_formatted,
    quotedTotalCents: b.quoted_total_cents,
    depositCents: b.deposit_cents,
    remainingCents: Math.max(0, (b.quoted_total_cents ?? 0) - b.deposit_cents),
    receiptUrl: b.square_receipt_url,
    /** "pending" = booking request awaiting our location review (safety, permissions). */
    locationReview: b.location_review,
    // Only claim an email was delivered when Resend actually accepted it.
    emailStatus: (b.confirmation_email_sent_at ? "sent" : configured.email() ? "pending" : "not_configured") as
      | "sent"
      | "pending"
      | "not_configured",
  };
}
export type PublicBooking = ReturnType<typeof publicBookingView>;
