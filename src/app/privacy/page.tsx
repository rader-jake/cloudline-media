import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { loadSettings } from "@/lib/settings-server";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };
export const revalidate = 3600;

// NOTE: Template privacy policy — have it reviewed for your business before launch.
export default async function Privacy() {
  const { settings } = await loadSettings();
  return (
    <>
      <Nav solid />
      <main id="main" className="container-x max-w-3xl pb-20 pt-32">
        <h1 className="text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-mist">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        <div className="mt-8 space-y-6 leading-relaxed text-white/85 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white">
          <p>Cloudline Media (&ldquo;we&rdquo;) respects your privacy. This policy explains what we collect when you use this website and how we use it.</p>
          <h2>Information you give us</h2>
          <p>
            When you book a shoot or contact us, we collect your name, email, phone number, optional business name, the shoot address, and project details.
            We use this to schedule and deliver your service, communicate with you, and send booking confirmations and reminders.
          </p>
          <h2>Payments</h2>
          <p>
            Deposits are processed by Square. Your card details are entered into Square&apos;s secure payment form and are never sent to or stored on our
            servers. We receive a payment confirmation and reference ID from Square.
          </p>
          <h2>Cookies &amp; advertising</h2>
          <p>
            With your consent, we use the Meta (Facebook) Pixel and Conversions API to measure the effectiveness of our ads — for example, whether a visit from an
            ad led to a booking. When you consent, hashed (encrypted) contact details from a completed booking may be shared with Meta for this purpose. You can
            change your choice at any time using &ldquo;Cookie Settings&rdquo; in the footer. We also store how you found us (e.g. ad campaign parameters) with your
            booking.
          </p>
          <h2>Service providers</h2>
          <p>
            We use trusted providers to run this site: Supabase (database hosting), Square (payments), Resend (email delivery), Google (address autocomplete and
            calendar), and our hosting provider. They process data only to provide their services to us.
          </p>
          <h2>Retention &amp; your choices</h2>
          <p>
            We keep booking records as needed for business, tax and legal purposes. You can ask us to access, correct or delete your personal information by
            contacting us{settings.contact.email ? ` at ${settings.contact.email}` : ""}.
          </p>
          <h2>Contact</h2>
          <p>Questions about this policy? Contact us{settings.contact.email ? ` at ${settings.contact.email}` : " using the form on our home page"}.</p>
        </div>
      </main>
      <Footer email={settings.contact.email} phone={settings.contact.phone} areaLabel={settings.serviceArea.label} />
    </>
  );
}
