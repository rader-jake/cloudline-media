import { NextRequest } from "next/server";
import { guard } from "@/lib/admin-guard";
import { requireDb } from "@/lib/supabase/admin";
import { loadSettings } from "@/lib/settings-server";
import { monthAvailability } from "@/lib/availability";
import { handleError, json } from "@/lib/request";

export const dynamic = "force-dynamic";

/** Availability for rescheduling a specific booking (ignores min-notice, excludes the booking itself). */
export async function GET(req: NextRequest) {
  const { deny } = await guard();
  if (deny) return deny;
  const id = req.nextUrl.searchParams.get("bookingId");
  const month = req.nextUrl.searchParams.get("month") ?? "";
  if (!id || !/^\d{4}-\d{2}$/.test(month)) return json({ error: "Invalid request" }, 400);
  try {
    const { data: b } = await requireDb().from("bookings").select("id, package, duration_minutes").eq("id", id).single();
    if (!b) return json({ error: "Not found" }, 404);
    const { settings } = await loadSettings();
    const days = await monthAvailability({
      settings,
      service: b.package,
      month,
      durationMinutes: b.duration_minutes ?? undefined,
      excludeBookingId: b.id,
      ignoreNotice: true,
    });
    return json({ days });
  } catch (e) {
    return handleError(e, "admin.availability");
  }
}
