import { configured } from "@/lib/env";
import { requireDb } from "@/lib/supabase/admin";
import { confirmDeposit, type BookingRow } from "@/lib/bookings";
import { createDepositPayment, friendlyPaymentError, SquareError } from "@/lib/square";
import { clientIp, handleError, json, rateLimit } from "@/lib/request";
import { paymentRequestSchema } from "@/lib/validation";
import { safeEqual } from "@/lib/tokens";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/deposit
 * Charges the $20 deposit with a single-use card token from Square's Web Payments SDK.
 * The booking is confirmed ONLY when Square returns a COMPLETED payment (or later via webhook).
 */
export async function POST(req: Request) {
  if (!configured.square()) return json({ error: "Payments are not configured yet.", code: "setup_required" }, 503);
  const ip = clientIp(req);
  if (!rateLimit(`pay:${ip}`, 8, 10 * 60_000)) return json({ error: "Too many payment attempts. Please wait a few minutes." }, 429);

  const parsed = paymentRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid payment request." }, 400);
  const input = parsed.data;

  try {
    const sb = requireDb();
    const { data: b } = await sb.from("bookings").select("*").eq("reference", input.reference).maybeSingle<BookingRow>();
    if (!b || !safeEqual(b.access_token, input.token)) return json({ error: "Booking not found." }, 404);

    if (b.deposit_status === "paid") return json({ status: b.status, reference: b.reference });
    if (b.status !== "pending_payment") return json({ error: "This booking can no longer be paid. Please start a new booking.", code: "hold_expired" }, 409);
    if (!b.hold_expires_at || new Date(b.hold_expires_at) < new Date()) {
      return json({ error: "Your reserved time expired before payment. Please pick your time again.", code: "hold_expired" }, 409);
    }

    // Atomic lock — prevents two concurrent charges for the same booking.
    const { data: locked } = await sb
      .from("bookings")
      .update({ deposit_status: "processing", payment_attempts: (b.payment_attempts ?? 0) + 1 })
      .eq("id", b.id)
      .in("deposit_status", ["unpaid", "failed"])
      .select("id")
      .maybeSingle();
    if (!locked) return json({ error: "A payment for this booking is already in progress.", code: "in_progress" }, 409);

    let payment;
    try {
      payment = await createDepositPayment({
        sourceId: input.sourceId,
        verificationToken: input.verificationToken,
        // Client generates one key per card token; Square dedupes retries of the same request.
        idempotencyKey: input.idempotencyKey,
        amountCents: b.deposit_cents,
        bookingReference: b.reference,
        buyerEmail: b.email,
        note: `Deposit — ${b.package_name} — ${b.reference}`,
      });
    } catch (e) {
      await sb.from("bookings").update({ deposit_status: "failed" }).eq("id", b.id).eq("deposit_status", "processing");
      if (e instanceof SquareError) {
        console.warn("[deposit] declined", b.reference, e.code);
        return json({ error: friendlyPaymentError(e.code), code: "payment_failed" }, 402);
      }
      throw e;
    }

    if (payment.status === "COMPLETED") {
      const result = await confirmDeposit(b.reference, payment);
      const status = result.booking?.status ?? (result.confirmed ? "confirmed" : "pending_payment");
      return json({ status, reference: b.reference });
    }
    if (payment.status === "FAILED" || payment.status === "CANCELED") {
      await sb.from("bookings").update({ deposit_status: "failed" }).eq("id", b.id);
      return json({ error: friendlyPaymentError(), code: "payment_failed" }, 402);
    }
    // APPROVED / PENDING — the webhook will finalize it.
    await sb.from("bookings").update({ square_payment_id: payment.id }).eq("id", b.id);
    return json({ status: "processing", reference: b.reference });
  } catch (e) {
    return handleError(e, "deposit");
  }
}
