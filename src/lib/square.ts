import "server-only";
import crypto from "node:crypto";
import { env } from "@/lib/env";

// Thin wrapper around Square's REST API. Card data never touches our servers:
// the browser tokenizes the card with Square's Web Payments SDK and we only receive a
// single-use token (source_id).

const SQUARE_VERSION = "2025-01-23";
const base = () => (env.squareEnv === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com");

export interface SquarePayment {
  id: string;
  status: "APPROVED" | "PENDING" | "COMPLETED" | "CANCELED" | "FAILED";
  amount_money: { amount: number; currency: string };
  reference_id?: string;
  receipt_url?: string;
  location_id: string;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.squareAccessToken}`,
      "Square-Version": SQUARE_VERSION,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new SquareError(json?.errors?.[0]?.detail ?? `Square request failed (${res.status})`);
    err.code = json?.errors?.[0]?.code;
    err.status = res.status;
    throw err;
  }
  return json as T;
}

export class SquareError extends Error {
  code?: string;
  status?: number;
}

export async function createDepositPayment(input: {
  sourceId: string;
  verificationToken?: string;
  idempotencyKey: string;
  amountCents: number;
  bookingReference: string;
  buyerEmail: string;
  note: string;
}) {
  const body = {
    source_id: input.sourceId,
    verification_token: input.verificationToken,
    idempotency_key: input.idempotencyKey,
    amount_money: { amount: input.amountCents, currency: "USD" },
    location_id: env.squareLocationId,
    reference_id: input.bookingReference,
    buyer_email_address: input.buyerEmail,
    note: input.note.slice(0, 500),
    autocomplete: true,
  };
  const { payment } = await call<{ payment: SquarePayment }>("/v2/payments", { method: "POST", body: JSON.stringify(body) });
  return payment;
}

export async function getPayment(id: string) {
  const { payment } = await call<{ payment: SquarePayment }>(`/v2/payments/${encodeURIComponent(id)}`);
  return payment;
}

/** Verifies Square's webhook signature: base64(HMAC-SHA256(key, notificationUrl + rawBody)). */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!env.squareWebhookKey || !env.squareWebhookUrl || !signature) return false;
  const expected = crypto
    .createHmac("sha256", env.squareWebhookKey)
    .update(env.squareWebhookUrl + rawBody)
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Human-friendly message for common card declines. */
export function friendlyPaymentError(code?: string) {
  switch (code) {
    case "CARD_DECLINED":
    case "GENERIC_DECLINE":
      return "Your card was declined. Please try another card.";
    case "CVV_FAILURE":
      return "The security code (CVV) didn't match. Please check and try again.";
    case "ADDRESS_VERIFICATION_FAILURE":
      return "The billing ZIP code didn't match your card. Please check and try again.";
    case "INSUFFICIENT_FUNDS":
      return "The card has insufficient funds. Please try another card.";
    case "INVALID_EXPIRATION":
    case "EXPIRATION_FAILURE":
      return "The card's expiration date is invalid.";
    case "INVALID_CARD":
    case "INVALID_CARD_DATA":
      return "The card details are invalid. Please check and try again.";
    case "CARD_DECLINED_VERIFICATION_REQUIRED":
      return "Your bank requires additional verification. Please try again.";
    default:
      return "We couldn't process your payment. Your card was not charged. Please try again.";
  }
}
