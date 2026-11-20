import "server-only";
import crypto from "node:crypto";
import { env, configured } from "@/lib/env";

// Minimal Google Calendar client using a service account (no googleapis dependency).

let cached: { token: string; exp: number } | null = null;

async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: env.googleSaEmail,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const sig = crypto.createSign("RSA-SHA256").update(unsigned).sign(env.googleSaKey!, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${sig}`,
    }),
  });
  if (!res.ok) throw new Error(`Google auth failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: json.access_token, exp: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

/** Busy intervals on the connected Google Calendar. Returns [] when not configured. */
export async function googleBusy(from: Date, to: Date): Promise<{ start: Date; end: Date }[]> {
  if (!configured.googleCalendar()) return [];
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ timeMin: from.toISOString(), timeMax: to.toISOString(), items: [{ id: env.googleCalendarId }] }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google freeBusy failed: ${res.status}`);
  const json = (await res.json()) as { calendars: Record<string, { busy: { start: string; end: string }[] }> };
  return (json.calendars[env.googleCalendarId!]?.busy ?? []).map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
}

export interface CalendarEventInput {
  summary: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
  /** Private tag so our own events can be filtered out of free/busy. */
  bookingId: string;
}

export async function upsertCalendarEvent(ev: CalendarEventInput, existingId?: string | null): Promise<string | null> {
  if (!configured.googleCalendar()) return null;
  const body = {
    summary: ev.summary,
    description: ev.description,
    location: ev.location,
    start: { dateTime: ev.start.toISOString() },
    end: { dateTime: ev.end.toISOString() },
    extendedProperties: { private: { cloudlineBookingId: ev.bookingId } },
  };
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.googleCalendarId!)}/events`;
  const res = await fetch(existingId ? `${base}/${existingId}` : base, {
    method: existingId ? "PUT" : "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error("[gcal] upsert failed", res.status, await res.text());
    return existingId ?? null;
  }
  return ((await res.json()) as { id: string }).id;
}

export async function deleteCalendarEvent(id: string) {
  if (!configured.googleCalendar()) return;
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.googleCalendarId!)}/events/${id}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${await accessToken()}` } }
  ).catch((e) => console.error("[gcal] delete failed", e));
}
