import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Confirmation } from "@/components/booking/Confirmation";
import { db } from "@/lib/supabase/admin";
import { publicBookingView, type BookingRow } from "@/lib/bookings";
import { safeEqual } from "@/lib/tokens";

export const metadata: Metadata = { title: "Booking Confirmation", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ConfirmedPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { ref, t } = await searchParams;
  let booking = null;
  const client = db();
  if (client && ref && t) {
    const { data } = await client.from("bookings").select("*").eq("reference", ref).maybeSingle<BookingRow>();
    if (data && safeEqual(data.access_token, t)) booking = publicBookingView(data);
  }
  return (
    <>
      <Nav solid />
      <main id="main" className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_#10273a_0%,_#06111B_55%)] pb-24 pt-28 md:pt-32">
        <Confirmation initial={booking} reference={ref ?? ""} token={t ?? ""} />
      </main>
    </>
  );
}
