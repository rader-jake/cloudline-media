import { configured } from "@/lib/env";
import { loadSettings } from "@/lib/settings-server";
import { generateAccessToken, generateReference, projectColumns, type BookingRow } from "@/lib/bookings";
import { requireDb } from "@/lib/supabase/admin";
import { clientIp, handleError, hashIp, json, rateLimit, verifyTurnstile } from "@/lib/request";
import { fieldErrors, formatPhone, inquiryRequestSchema } from "@/lib/validation";
import { quoteReceivedEmail, sendEmail, teamNotificationEmail } from "@/lib/email";
import { SERVICE_KEYS, type ServiceKey } from "@/lib/settings";
import { prettyDate } from "@/lib/time";

export const dynamic = "force-dynamic";

/**
 * POST /api/bookings/quote — an inquiry / quote request (no payment). Stored as a booking with
 * status "quote_requested" so it shows under Quotes in admin, where it can be priced and a booking
 * link sent. Used by the homepage inquiry form (Production, Wedding-Day FPV, custom, any package).
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`quote:${ip}`, 5, 10 * 60_000)) return json({ error: "Too many requests. Please try again later." }, 429);

  const parsed = inquiryRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return json({ ok: true }); // honeypot
    return json({ error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) }, 422);
  }
  const m = parsed.data;
  if (m.startedAt && Date.now() - m.startedAt < 2500) return json({ ok: true }); // too fast → bot
  if (!(await verifyTurnstile(m.turnstileToken, ip))) return json({ error: "Spam check failed. Please try again." }, 400);
  if (!configured.database()) return json({ error: "Inquiries are being set up. Please email or call us directly.", code: "setup_required" }, 503);

  try {
    const { settings } = await loadSettings();
    const pkg = m.package as ServiceKey | "custom";
    const known = (SERVICE_KEYS as string[]).includes(pkg) ? settings.services[pkg as ServiceKey] : null;
    const svcLaunch = known && settings.launch.enabled && known.standardPriceCents != null;
    const event = m.project.eventDate ? `Event ${prettyDate(`${m.project.eventDate}T12:00:00Z`)}` : null;
    const { data, error } = await requireDb()
      .from("bookings")
      .insert({
        reference: generateReference(),
        access_token: generateAccessToken(),
        status: "quote_requested",
        is_inquiry: true,
        package: pkg,
        package_name: known?.name ?? "Custom project",
        customer_name: m.contact.name,
        email: m.contact.email,
        phone: formatPhone(m.contact.phone),
        business_name: m.contact.businessName ?? null,
        city: m.location.city,
        state: m.location.state,
        address_formatted: `${m.location.city}, ${m.location.state}`,
        address_verified: false,
        ...projectColumns(m.project),
        preferred_dates: [prettyDate(`${m.preferredDate}T12:00:00Z`), event].filter(Boolean).join(" · "),
        deposit_cents: settings.depositCents,
        duration_minutes: known?.durationMinutes ?? 120,
        standard_price_cents: known?.standardPriceCents ?? null,
        launch_pricing: Boolean(svcLaunch),
        location_review: known?.requiresLocationReview ? "pending" : null,
        utm: m.attribution?.utm ?? {},
        fbp: m.attribution?.fbp ?? null,
        fbc: m.attribution?.fbc ?? null,
        marketing_consent: m.attribution?.consent ?? false,
        ip_hash: hashIp(ip),
        user_agent: req.headers.get("user-agent")?.slice(0, 400) ?? null,
      })
      .select("*")
      .single<BookingRow>();
    if (error) throw new Error(error.message);

    const [customer, team] = await Promise.all([sendEmail(quoteReceivedEmail(data)), sendEmail(teamNotificationEmail(data, "quote_request"))]);
    return json({ reference: data.reference, emailSent: customer.sent, teamNotified: team.sent });
  } catch (e) {
    return handleError(e, "quote");
  }
}
