import { NextRequest } from "next/server";
import { configured } from "@/lib/env";
import { loadSettings } from "@/lib/settings-server";
import { monthAvailability } from "@/lib/availability";
import { handleError, json } from "@/lib/request";
import { SERVICE_KEYS, type ServiceKey } from "@/lib/settings";
import { db } from "@/lib/supabase/admin";
import { safeEqual } from "@/lib/tokens";

export const dynamic = "force-dynamic";

/**
 * GET /api/availability?service=timelapse&month=2026-12[&quote=CL-XXXX&t=token]
 * Returns real availability computed from admin working hours, blocks, existing bookings
 * and (optionally) Google Calendar. Never fabricates slots: if setup is incomplete it says so.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const service = sp.get("service") as ServiceKey;
  const month = sp.get("month") ?? "";
  if (!SERVICE_KEYS.includes(service) || !/^\d{4}-\d{2}$/.test(month)) return json({ error: "Invalid request" }, 400);

  if (!configured.database()) {
    return json({ setupRequired: true, message: "Online scheduling is being set up. Please contact us to book your shoot." });
  }

  try {
    const { settings, hoursConfigured } = await loadSettings();
    if (!hoursConfigured) {
      return json({ setupRequired: true, message: "Online scheduling is being set up. Please contact us to book your shoot." });
    }

    let durationMinutes: number | undefined;
    const ref = sp.get("quote");
    const token = sp.get("t");
    if (ref && token) {
      // Priced inquiry/quote link: availability uses the quoted duration.
      const { data } = await db()!.from("bookings").select("access_token, status, duration_minutes, package").eq("reference", ref).maybeSingle();
      if (!data || !safeEqual(data.access_token, token) || !["quote_sent", "pending_payment"].includes(data.status) || data.package !== service)
        return json({ error: "This quote link is invalid or has expired." }, 403);
      durationMinutes = data.duration_minutes ?? undefined;
    } else if (!settings.services[service].active || !settings.services[service].selfBookable) {
      return json({ error: "This package is planned with you first. Send us an inquiry and we'll reply with a quote." }, 400);
    }

    const days = await monthAvailability({ settings, service, month, durationMinutes });
    return json({ timezone: settings.timezone, days });
  } catch (e) {
    return handleError(e, "availability");
  }
}
