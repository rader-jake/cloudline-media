import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { loadSettings } from "@/lib/settings-server";
import { formatUSD } from "@/lib/settings";

export const metadata: Metadata = { title: "Booking & Deposit Policy", alternates: { canonical: "/policies" } };
export const revalidate = 60;

export default async function Policies() {
  const { settings } = await loadSettings();
  return (
    <>
      <Nav solid />
      <main id="main" className="container-x max-w-3xl pb-20 pt-32">
        <h1 className="text-4xl font-extrabold tracking-tight">Booking &amp; Deposit Policy</h1>
        <div className="mt-8 space-y-6 leading-relaxed text-white/85 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white">
          <h2>Deposit</h2>
          <p>
            A {formatUSD(settings.depositCents)} deposit is required to confirm a booking. It is credited toward your final service price — it is not an
            additional fee.
          </p>
          <h2>Deposit, rescheduling &amp; cancellation terms</h2>
          <p className="whitespace-pre-line">{settings.policy.text}</p>
          <h2>Weather, airspace &amp; safety</h2>
          <p>
            All flights are subject to weather, location suitability, and any required FAA or airspace authorizations. We won&apos;t fly when conditions
            are unsafe or when a location can&apos;t be flown legally. In those cases we&apos;ll contact you to reschedule.
          </p>
          <h2>Delivery</h2>
          <p>Edited videos are typically delivered digitally within 48 hours after the shoot, subject to the agreed scope.</p>
        </div>
      </main>
      <Footer email={settings.contact.email} phone={settings.contact.phone} areaLabel={settings.serviceArea.label} />
    </>
  );
}
