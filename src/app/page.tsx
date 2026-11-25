import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Industries } from "@/components/Industries";
import { FpvPackages } from "@/components/FpvPackages";
import { Possibilities } from "@/components/Possibilities";
import { FinalCta, Intro, Process } from "@/components/Studio";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { MobileBookBar } from "@/components/MobileBookBar";
import { HOME_FAQ, faq } from "@/content/site";
import { loadSettings } from "@/lib/settings-server";
import { priceDisplay } from "@/lib/settings";
import { localBusinessJsonLd } from "@/lib/structured-data";

// Prices come from admin settings; refresh at most every minute (and on settings save).
export const revalidate = 60;

/**
 * Homepage — 8 sections, each answering one visitor question:
 * what is this (Hero, Intro) · is it for me (Industries) · what does it cost (Packages) ·
 * what could it look like (Possibilities) · how do I book (Process, FAQ, Inquiry).
 */
export default async function Home() {
  const { settings } = await loadSettings();
  const ft = priceDisplay(settings, "flythrough");
  const fromLine = ft.price != null ? `FPV fly-throughs from ${ft.label}` : "";
  const priceLine = [fromLine, settings.launch.enabled && ft.standard != null ? settings.launch.label : ""].filter(Boolean).join(" · ");

  return (
    <>
      <Nav />
      <main id="main">
        <Hero priceLine={priceLine} />
        <Intro />
        <Industries />
        <FpvPackages settings={settings} />
        <Possibilities />
        <Process />
        <Faq items={faq.filter((f) => HOME_FAQ.includes(f.q))} />
        <FinalCta email={settings.contact.email} phone={settings.contact.phone} />
      </main>
      <Footer email={settings.contact.email} phone={settings.contact.phone} areaLabel={settings.serviceArea.label} showTimelapse={settings.display.showTimelapse} />
      <MobileBookBar note={fromLine || undefined} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd(settings)) }} />
    </>
  );
}
