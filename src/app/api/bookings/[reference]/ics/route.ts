import { NextRequest } from "next/server";
import { db } from "@/lib/supabase/admin";
import type { BookingRow } from "@/lib/bookings";
import { buildIcs } from "@/lib/ics";
import { safeEqual } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ reference: string }> }) {
  const { reference } = await ctx.params;
  const token = req.nextUrl.searchParams.get("t");
  const client = db();
  if (!client) return new Response("Not available", { status: 503 });
  const { data: b } = await client.from("bookings").select("*").eq("reference", reference).maybeSingle<BookingRow>();
  if (!b || !safeEqual(b.access_token, token) || b.status !== "confirmed" || !b.scheduled_start || !b.scheduled_end)
    return new Response("Not found", { status: 404 });

  const ics = buildIcs({
    uid: b.id,
    title: `Cloudline Media — ${b.package_name}`,
    description: `Booking ${b.reference}. Subject to weather, location suitability and airspace authorization.`,
    location: b.address_formatted ?? "",
    start: new Date(b.scheduled_start),
    end: new Date(b.scheduled_end),
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="cloudline-${b.reference}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
