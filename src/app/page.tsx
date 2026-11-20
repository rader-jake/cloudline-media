import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Packages } from "@/components/Packages";
import { DroneFlyby } from "@/components/DroneFlyby";
import { Portfolio } from "@/components/Portfolio";
import { FinalCta, HowItWorks, WhyUs } from "@/components/Sections";
import { Faq } from "@/components/Faq";
import { ContactSection } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";
import { MobileBookBar } from "@/components/MobileBookBar";
import { loadSettings } from "@/lib/settings-server";
import { formatUSD } from "@/lib/settings";

// Prices come from admin settings; refresh at most every minute (and on settings save).
export const revalidate = 60;

export default async function Home() {
  const { settings } = await loadSettings();
  const prices = [settings.services.timelapse.priceCents, settings.services.realestate.priceCents].filter((p): p is number => p != null);
  const fromPrice = prices.length ? formatUSD(Math.min(...prices)) : "";

  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Packages settings={settings} />
        <WhyUs />
        <Portfolio />
        <HowItWorks />
        <Faq />
        <ContactSection email={settings.contact.email} phone={settings.contact.phone} />
        <FinalCta />
      </main>
      <Footer email={settings.contact.email} phone={settings.contact.phone} areaLabel={settings.serviceArea.label} />
      <DroneFlyby />
      <MobileBookBar fromPrice={fromPrice} />
    </>
  );
}
