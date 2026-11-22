import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { loadSettings } from "@/lib/settings-server";
import { publicSettings, SERVICE_KEYS, type ServiceKey } from "@/lib/settings";
import { configured, env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Book a Shoot",
  description: "Book your aerial time-lapse or real estate drone video in Queens & Long Island. Pick a date, enter the address, and secure it with a $20 deposit.",
  alternates: { canonical: "/book" },
};
export const dynamic = "force-dynamic";

export default async function BookPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { settings } = await loadSettings();
  const pkg = sp.package as ServiceKey | undefined;
  const quote = sp.quote && sp.t ? { reference: sp.quote, token: sp.t } : null;

  return (
    <>
      <Nav variant="checkout" />
      <main id="main" className="min-h-dvh bg-[radial-gradient(90%_60%_at_50%_0%,#10273a_0%,#06111B_50%,#03080d_100%)] pb-24 pt-28 md:pt-36">
        <BookingWizard
          config={{
            settings: publicSettings(settings),
            initialService: quote ? "fpv" : pkg && SERVICE_KEYS.includes(pkg) ? pkg : null,
            quote,
            ready: { database: configured.database(), payments: configured.square() },
            square: { appId: env.squareAppId ?? "", locationId: env.squareLocationId ?? "", env: env.squareEnv },
            googleMapsKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
          }}
        />
      </main>
    </>
  );
}
