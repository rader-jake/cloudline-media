import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Possibilities } from "@/components/Possibilities";
import { FinalCta, Intro, Process } from "@/components/Studio";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { MobileBookBar } from "@/components/MobileBookBar";
import { faq } from "@/content/site";
import { loadSettings } from "@/lib/settings-server";
import { formatUSD } from "@/lib/settings";

// Prices come from admin settings; refresh at most every minute (and on settings save).
export const revalidate = 60;

/** Compact homepage FAQ: the questions that most often block a booking. */
const HOME_FAQ = [
  "Is the $20 deposit applied to the total?",
  "What happens if it rains?",
  "How long does filming take?",
  "Can I reschedule my shoot?",
  "Is every location flyable?",
  "Do you travel outside Queens and Long Island?",
];

export default async function Home() {
  const { settings } = await loadSettings();
  const tl = settings.services.timelapse.priceCents;
  const re = settings.services.realestate.priceCents;
  const priceLine = [tl != null && `Time-lapse from ${formatUSD(tl)}`, re != null && `Aerial films from ${formatUSD(re)}`].filter(Boolean).join("  ·  ");

  return (
    <>
      <Nav />
      <main id="main">
        <Hero priceLine={priceLine} />
        <Intro />
        <Services settings={settings} />
        <Possibilities settings={settings} />
        <Process />
        <Faq items={faq.filter((f) => HOME_FAQ.includes(f.q))} />
        <FinalCta email={settings.contact.email} phone={settings.contact.phone} />
      </main>
      <Footer email={settings.contact.email} phone={settings.contact.phone} areaLabel={settings.serviceArea.label} />
      <MobileBookBar note={priceLine.split("  ·  ")[0]} />
    </>
  );
}
