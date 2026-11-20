import "server-only";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { SetupError } from "@/lib/supabase/admin";

export function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "0.0.0.0").trim();
}
export const hashIp = (ip: string) => crypto.createHash("sha256").update(env.ipSalt + ip).digest("hex").slice(0, 32);

// Simple in-memory sliding window. Per serverless instance — paired with DB-backed checks
// where abuse matters (contact form). Good enough to stop bursts / double submits.
const buckets = new Map<string, number[]>();
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) buckets.clear();
  return true;
}

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export function handleError(e: unknown, where: string) {
  if (e instanceof SetupError) return json({ error: e.message, code: "setup_required" }, 503);
  if (e instanceof Error && e.message === "calendar_unavailable")
    return json({ error: "Our calendar is temporarily unavailable. Please try again in a few minutes.", code: "calendar_unavailable" }, 503);
  console.error(`[${where}]`, e);
  return json({ error: "Something went wrong. Please try again." }, 500);
}

export async function verifyTurnstile(token: string | undefined, ip: string) {
  if (!env.turnstileSecret) return true; // not configured — rely on honeypot + rate limits
  if (!token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret: env.turnstileSecret, response: token, remoteip: ip }),
  });
  const data = (await res.json()) as { success: boolean };
  return data.success;
}
