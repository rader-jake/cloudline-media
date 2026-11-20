import { configured } from "@/lib/env";
import { loadSettings } from "@/lib/settings-server";
import { generateAccessToken, generateReference, type BookingRow } from "@/lib/bookings";
import { requireDb } from "@/lib/supabase/admin";
import { clientIp, handleError, hashIp, json, rateLimit } from "@/lib/request";
import { fieldErrors, formatAddress, formatPhone, quoteRequestSchema } from "@/lib/validation";
import { quoteReceivedEmail, sendEmail, teamNotificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/** POST /api/bookings/quote — Interior FPV quote request (no payment collected). */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`quote:${ip}`, 5, 10 * 60_000)) return json({ error: "Too many requests. Please try again later." }, 429);

  const parsed = quoteRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) }, 422);
  if (!configured.database()) return json({ error: "Quote requests are being set up. Please use the contact form.", code: "setup_required" }, 503);

  try {
    const { settings } = await loadSettings();
    const { contact, address: a, project, preferredDates, attribution } = parsed.data;
    const zip3 = a.zip.slice(0, 3);
    const { data, error } = await requireDb()
      .from("bookings")
      .insert({
        reference: generateReference(),
        access_token: generateAccessToken(),
        status: "quote_requested",
        package: "fpv",
        package_name: settings.services.fpv.name,
        customer_name: contact.name,
        email: contact.email,
        phone: formatPhone(contact.phone),
        business_name: contact.businessName ?? null,
        address_line1: a.line1,
        address_line2: a.line2 ?? null,
        city: a.city,
        state: a.state,
        zip: a.zip,
        address_formatted: formatAddress(a),
        address_place_id: a.placeId ?? null,
        address_verified: Boolean(a.placeId),
        outside_service_area: settings.serviceArea.zipPrefixes.length > 0 && !settings.serviceArea.zipPrefixes.includes(zip3),
        property_type: project.propertyType ?? null,
        project_description: project.description ?? null,
        filming_requirements: project.filmingRequirements ?? null,
        special_instructions: project.specialInstructions ?? null,
        access_notes: project.accessNotes ?? null,
        preferred_dates: preferredDates ?? null,
        deposit_cents: settings.depositCents,
        duration_minutes: settings.services.fpv.durationMinutes,
        utm: attribution?.utm ?? {},
        fbp: attribution?.fbp ?? null,
        fbc: attribution?.fbc ?? null,
        marketing_consent: attribution?.consent ?? false,
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
