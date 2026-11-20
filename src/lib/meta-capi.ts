import "server-only";
import crypto from "node:crypto";
import { env, configured, SITE_URL } from "@/lib/env";
import type { BookingRow } from "@/lib/bookings";

const sha256 = (v: string) => crypto.createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

/**
 * Server-side Purchase via Meta Conversions API — sent ONLY after Square verifies the deposit.
 * Uses the same event_id as the browser Pixel ("purchase_<bookingId>") so Meta deduplicates.
 * Reports the deposit actually collected ($20), not the full service price.
 */
export async function sendPurchaseEvent(b: BookingRow) {
  if (!configured.metaCapi() || !b.marketing_consent) return;
  const phone = b.phone.replace(/\D/g, "");
  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `purchase_${b.id}`,
        action_source: "website",
        event_source_url: `${SITE_URL}/book`,
        user_data: {
          em: [sha256(b.email)],
          ph: phone ? [sha256(phone.length === 10 ? `1${phone}` : phone)] : undefined,
          fn: [sha256(b.customer_name.split(" ")[0] ?? "")],
          ln: b.customer_name.includes(" ") ? [sha256(b.customer_name.split(" ").slice(-1)[0])] : undefined,
          ct: b.city ? [sha256(b.city.replace(/\s/g, ""))] : undefined,
          st: b.state ? [sha256(b.state)] : undefined,
          zp: b.zip ? [sha256(b.zip.slice(0, 5))] : undefined,
          country: [sha256("us")],
          fbp: b.fbp ?? undefined,
          fbc: b.fbc ?? undefined,
          client_user_agent: b.user_agent ?? undefined,
        },
        custom_data: {
          currency: "USD",
          value: b.deposit_cents / 100,
          content_name: b.package_name,
          content_ids: [b.package],
          content_type: "product",
          order_id: b.reference,
        },
      },
    ],
    test_event_code: env.metaTestCode,
  };
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${env.metaPixelId}/events?access_token=${env.metaCapiToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.error("[meta-capi] failed", res.status, await res.text());
  } catch (e) {
    console.error("[meta-capi] error", e);
  }
}
