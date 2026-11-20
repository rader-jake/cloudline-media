import { configured } from "@/lib/env";
import { requireDb } from "@/lib/supabase/admin";
import { confirmDeposit } from "@/lib/bookings";
import { getPayment, verifyWebhookSignature } from "@/lib/square";
import { json } from "@/lib/request";

export const dynamic = "force-dynamic";

/**
 * Square webhook — subscribe to payment.created and payment.updated.
 * Signature is verified, then the payment is re-fetched from Square's API before acting,
 * so the webhook body itself is never trusted as proof of payment.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-square-hmacsha256-signature"))) {
    return json({ error: "invalid signature" }, 401);
  }
  if (!configured.square() || !configured.database()) return json({ ok: true });

  let event: { event_id: string; type: string; data?: { id?: string; object?: { payment?: { id: string } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: "bad json" }, 400);
  }

  const sb = requireDb();
  const { data: seen } = await sb.from("webhook_events").select("event_id").eq("event_id", event.event_id).maybeSingle();
  if (seen) return json({ ok: true, duplicate: true });

  try {
    if (event.type === "payment.created" || event.type === "payment.updated") {
      const paymentId = event.data?.object?.payment?.id ?? event.data?.id;
      if (paymentId) {
        const payment = await getPayment(paymentId); // authoritative status
        const ref = payment.reference_id;
        if (ref) {
          if (payment.status === "COMPLETED") {
            await confirmDeposit(ref, payment);
          } else if (payment.status === "FAILED" || payment.status === "CANCELED") {
            await sb.from("bookings").update({ deposit_status: "failed" }).eq("reference", ref).eq("deposit_status", "processing");
          }
        }
      }
    }
    await sb.from("webhook_events").insert({ event_id: event.event_id, type: event.type });
    return json({ ok: true });
  } catch (e) {
    console.error("[square-webhook]", e);
    // non-2xx → Square retries later
    return json({ error: "processing failed" }, 500);
  }
}
