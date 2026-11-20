import "server-only";
import { env, configured, SITE_URL } from "@/lib/env";
import { formatUSD } from "@/lib/settings";
import { prettyDateTime } from "@/lib/time";
import type { BookingRow } from "@/lib/bookings";

// Transactional email via Resend's REST API. If Resend isn't configured we log and
// return { sent: false } — we never pretend an email was delivered.

export async function sendEmail(msg: { to: string | string[]; subject: string; html: string; text: string; replyTo?: string }) {
  if (!configured.email()) {
    console.warn(`[email] Resend not configured — NOT sent: "${msg.subject}"`);
    return { sent: false as const, reason: "not_configured" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.emailFrom,
      to: Array.isArray(msg.to) ? msg.to : [msg.to],
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      reply_to: msg.replyTo ?? env.emailReplyTo,
    }),
  });
  if (!res.ok) {
    console.error("[email] send failed", res.status, await res.text());
    return { sent: false as const, reason: "provider_error" };
  }
  return { sent: true as const };
}

/* ─────────────── Branded layout ─────────────── */

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(opts: { preheader: string; heading: string; intro: string; rows?: [string, string][]; cta?: { label: string; href: string }; footnote?: string }) {
  const rows = (opts.rows ?? [])
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 0;color:#5b6b7a;font-size:13px;width:42%;vertical-align:top;border-bottom:1px solid #eef2f6">${esc(k)}</td><td style="padding:10px 0;color:#06111B;font-size:14px;font-weight:600;border-bottom:1px solid #eef2f6">${esc(v)}</td></tr>`
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#eef3f8;font-family:Manrope,Segoe UI,Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3f8;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#06111B;padding:28px;text-align:center"><img src="${SITE_URL}/brand/logo-light.png" alt="Cloudline Media" width="170" style="display:inline-block;max-width:170px;height:auto"></td></tr>
<tr><td style="padding:32px 32px 8px">
<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#06111B">${esc(opts.heading)}</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#33475b">${esc(opts.intro)}</p>
${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>` : ""}
${opts.cta ? `<p style="margin:28px 0 8px"><a href="${esc(opts.cta.href)}" style="display:inline-block;background:#20B8FF;color:#06111B;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:10px">${esc(opts.cta.label)}</a></p>` : ""}
${opts.footnote ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#6b7c8c">${esc(opts.footnote)}</p>` : ""}
</td></tr>
<tr><td style="padding:24px 32px 32px;font-size:12px;color:#8696a5">Cloudline Media · Aerial video for Queens, Long Island &amp; surrounding areas<br><a href="${SITE_URL}" style="color:#0E9BE0">${SITE_URL.replace(/^https?:\/\//, "")}</a></td></tr>
</table></td></tr></table></body></html>`;
}

const textOf = (heading: string, intro: string, rows: [string, string][] = [], extra = "") =>
  [heading, "", intro, "", ...rows.map(([k, v]) => `${k}: ${v}`), extra ? `\n${extra}` : ""].join("\n");

const WEATHER_NOTE =
  "All shoots are subject to weather, location suitability, and any required FAA/airspace authorizations. If conditions aren't safe to fly, we'll contact you to reschedule at no charge.";

function bookingRows(b: BookingRow): [string, string][] {
  const remaining = (b.quoted_total_cents ?? 0) - b.deposit_cents;
  return [
    ["Booking reference", b.reference],
    ["Package", b.package_name],
    ["Date & time", b.scheduled_start ? prettyDateTime(b.scheduled_start) : "To be scheduled"],
    ["Shoot address", b.address_formatted ?? ""],
    ["Deposit paid", formatUSD(b.deposit_cents)],
    ["Remaining balance", formatUSD(Math.max(0, remaining))],
  ];
}

const manageUrl = (b: BookingRow) => `${SITE_URL}/book/confirmed?ref=${b.reference}&t=${b.access_token}`;

/* ─────────────── Messages ─────────────── */

export function confirmationEmail(b: BookingRow) {
  const heading = "You're booked! Let's elevate your project.";
  const intro = `Hi ${b.customer_name.split(" ")[0]}, your $${b.deposit_cents / 100} deposit was received and your shoot is confirmed. Here are the details:`;
  const rows = bookingRows(b);
  return {
    to: b.email,
    subject: `Booking confirmed — ${b.package_name} (${b.reference})`,
    html: layout({ preheader: "Your Cloudline Media shoot is confirmed.", heading, intro, rows, cta: { label: "View booking & add to calendar", href: manageUrl(b) }, footnote: WEATHER_NOTE }),
    text: textOf(heading, intro, rows, `${WEATHER_NOTE}\n\nView booking: ${manageUrl(b)}`),
  };
}

export function reminderEmail(b: BookingRow) {
  const heading = "Your shoot is coming up";
  const intro = `Hi ${b.customer_name.split(" ")[0]}, a quick reminder that your Cloudline Media shoot is coming up. Please make sure the site is accessible and let us know about anything we should be aware of.`;
  const rows = bookingRows(b);
  return {
    to: b.email,
    subject: `Reminder: your shoot is tomorrow (${b.reference})`,
    html: layout({ preheader: "Your aerial shoot is tomorrow.", heading, intro, rows, cta: { label: "View booking", href: manageUrl(b) }, footnote: WEATHER_NOTE }),
    text: textOf(heading, intro, rows, WEATHER_NOTE),
  };
}

export function rescheduledEmail(b: BookingRow) {
  const heading = "Your shoot has been rescheduled";
  const intro = `Hi ${b.customer_name.split(" ")[0]}, your booking has a new date and time. Your deposit carries over automatically.`;
  const rows = bookingRows(b);
  return {
    to: b.email,
    subject: `Rescheduled: ${b.package_name} (${b.reference})`,
    html: layout({ preheader: "Your shoot has a new date.", heading, intro, rows, cta: { label: "View updated booking", href: manageUrl(b) }, footnote: WEATHER_NOTE }),
    text: textOf(heading, intro, rows),
  };
}

export function needsReschedulingEmail(b: BookingRow) {
  const heading = "We need to reschedule your shoot";
  const intro = `Hi ${b.customer_name.split(" ")[0]}, conditions or scheduling require us to move your shoot. We'll reach out shortly to find a new time — your deposit stays credited to your booking.`;
  const rows = bookingRows(b);
  return {
    to: b.email,
    subject: `Action needed: rescheduling your shoot (${b.reference})`,
    html: layout({ preheader: "We'll help you pick a new time.", heading, intro, rows }),
    text: textOf(heading, intro, rows),
  };
}

export function cancelledEmail(b: BookingRow, reason?: string | null) {
  const heading = "Your booking has been cancelled";
  const intro = `Hi ${b.customer_name.split(" ")[0]}, your booking ${b.reference} has been cancelled.${reason ? ` Note: ${reason}` : ""} If you have questions about your deposit, just reply to this email.`;
  const rows: [string, string][] = [
    ["Booking reference", b.reference],
    ["Package", b.package_name],
    ["Original date", b.scheduled_start ? prettyDateTime(b.scheduled_start) : "—"],
  ];
  return {
    to: b.email,
    subject: `Booking cancelled (${b.reference})`,
    html: layout({ preheader: "Your booking was cancelled.", heading, intro, rows }),
    text: textOf(heading, intro, rows),
  };
}

export function quoteReadyEmail(b: BookingRow) {
  const heading = "Your custom quote is ready";
  const intro = `Hi ${b.customer_name.split(" ")[0]}, thanks for your interest in an interior FPV fly-through. Here's your quote. To lock it in, choose a date and pay the $${b.deposit_cents / 100} deposit — it's credited toward your total.`;
  const rows: [string, string][] = [
    ["Package", b.package_name],
    ["Quoted total", formatUSD(b.quoted_total_cents ?? 0)],
    ["Deposit due at booking", formatUSD(b.deposit_cents)],
    ["Remaining after deposit", formatUSD(Math.max(0, (b.quoted_total_cents ?? 0) - b.deposit_cents))],
    ["Property", b.address_formatted ?? ""],
  ];
  const href = `${SITE_URL}/book?quote=${b.reference}&t=${b.access_token}`;
  return {
    to: b.email,
    subject: `Your Cloudline Media quote (${b.reference})`,
    html: layout({ preheader: "Pick a date to lock in your quote.", heading, intro, rows, cta: { label: "Choose a date & book", href } }),
    text: textOf(heading, intro, rows, `Book: ${href}`),
  };
}

export function quoteReceivedEmail(b: BookingRow) {
  const heading = "We got your quote request";
  const intro = `Hi ${b.customer_name.split(" ")[0]}, thanks for reaching out about an interior FPV fly-through. We'll review your property details and send a custom quote, usually within one business day. No payment has been taken.`;
  const rows: [string, string][] = [["Reference", b.reference], ["Property", b.address_formatted ?? ""]];
  return { to: b.email, subject: `Quote request received (${b.reference})`, html: layout({ preheader: "We'll send your quote soon.", heading, intro, rows }), text: textOf(heading, intro, rows) };
}

export function teamNotificationEmail(b: BookingRow, kind: "new_booking" | "quote_request") {
  const heading = kind === "new_booking" ? `New booking: ${b.package_name}` : `New FPV quote request`;
  const intro = kind === "new_booking" ? `Deposit verified by Square (payment ${b.square_payment_id}).` : "A customer requested an interior FPV quote. Set a price in the admin dashboard to send them a booking link.";
  const rows: [string, string][] = [
    ["Reference", b.reference],
    ["Customer", b.customer_name],
    ["Email", b.email],
    ["Phone", b.phone],
    ["Business", b.business_name ?? "—"],
    ["Package", b.package_name],
    ["When", b.scheduled_start ? prettyDateTime(b.scheduled_start) : b.preferred_dates ?? "—"],
    ["Address", b.address_formatted ?? ""],
    ...(b.outside_service_area ? ([["⚠ Service area", "Outside configured service area"]] as [string, string][]) : []),
    ["Property type", b.property_type ?? "—"],
    ["Project", b.project_description ?? "—"],
    ["Filming requirements", b.filming_requirements ?? "—"],
    ["Special instructions", b.special_instructions ?? "—"],
    ["Access notes", b.access_notes ?? "—"],
    ["FPV add-on interest", b.fpv_interest ? "Yes" : "No"],
    ["Quoted total", b.quoted_total_cents ? formatUSD(b.quoted_total_cents) : "—"],
    ["Deposit", kind === "new_booking" ? `${formatUSD(b.deposit_cents)} paid` : "—"],
    ["Source", [b.utm?.utm_source, b.utm?.utm_campaign].filter(Boolean).join(" / ") || "direct"],
  ];
  return {
    to: env.teamEmails,
    subject: `${kind === "new_booking" ? "✅ New booking" : "📝 Quote request"} — ${b.customer_name} (${b.reference})`,
    html: layout({ preheader: heading, heading, intro, rows, cta: { label: "Open admin dashboard", href: `${SITE_URL}/admin` } }),
    text: textOf(heading, intro, rows),
    replyTo: b.email,
  };
}

export function contactNotificationEmail(m: { name: string; email: string; phone?: string | null; service?: string | null; message: string }) {
  const heading = `New inquiry from ${m.name}`;
  const rows: [string, string][] = [
    ["Name", m.name],
    ["Email", m.email],
    ["Phone", m.phone || "—"],
    ["Service", m.service || "—"],
    ["Message", m.message],
  ];
  return { to: env.teamEmails, subject: `Website inquiry — ${m.name}`, html: layout({ preheader: heading, heading, intro: "Submitted via the website contact form.", rows }), text: textOf(heading, "", rows), replyTo: m.email };
}
