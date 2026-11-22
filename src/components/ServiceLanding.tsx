import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { MobileBookBar } from "./MobileBookBar";
import { Reveal } from "./Reveal";
import { ServiceFeature, TimelapseFrame, EstateFrame } from "./Services";
import { Process, FinalCta } from "./Studio";
import { Faq } from "./Faq";
import { ViewContentTracker } from "./ViewContentTracker";
import { faq, landing, packages } from "@/content/site";
import { formatUSD, type Settings } from "@/lib/settings";

type Key = "timelapse" | "realestate";

/**
 * Focused landing page for paid social traffic: service, price and the booking CTA are all
 * above the fold; full package details follow. UTM capture and Pixel run site-wide (Tracking).
 */
export function ServiceLanding({ pkg, settings }: { pkg: Key; settings: Settings }) {
  const p = packages[pkg];
  const l = landing[pkg];
  const price = settings.services[pkg].priceCents;
  const deposit = formatUSD(settings.depositCents);
  const bookHref = `/book?package=${pkg}`;
  const [t1, t2] = p.displayTitle;

  return (
    <>
      <Nav bookHref={bookHref} />
      <main id="main">
        {/* Above the fold */}
        <ViewContentTracker id={pkg} name={p.title} value={price ?? 0}>
          <section className="grain relative isolate overflow-hidden bg-[radial-gradient(90%_70%_at_75%_30%,#10273a_0%,#06111b_45%,#03080d_100%)] pb-20 pt-28 md:pb-28 md:pt-40">
            <div className="container-x grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-6">
                <p className="kicker animate-fade-up [animation-delay:100ms]">{l.audience}</p>
                <h1 className="display mt-6 text-[clamp(2.4rem,7vw,5.6rem)]">
                  <span className="line-mask">
                    <span className="line [--d:200ms]">{t1}</span>
                  </span>
                  <span className="line-mask">
                    <span className="line [--d:330ms]">
                      {t2}
                      <span className="text-accent">.</span>
                    </span>
                  </span>
                </h1>
                <p className="mt-6 animate-fade-up text-2xl font-semibold leading-snug tracking-tight [animation-delay:600ms] md:text-[1.7rem]">
                  {p.tagline.split(/(?<=\.)\s+/).map((part) => (
                    <span key={part} className="block">
                      {part}
                    </span>
                  ))}
                </p>
                <p className="mt-4 max-w-lg animate-fade-up text-lg leading-relaxed text-mist [animation-delay:700ms]">{l.heroLine}</p>

                <div className="mt-9 flex animate-fade-up flex-wrap items-end gap-x-8 gap-y-6 [animation-delay:850ms]">
                  <div>
                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.28em] text-white/50">Starting at</p>
                    <p className="display mt-2 text-6xl tracking-[-0.03em] md:text-7xl">{price != null ? formatUSD(price) : "Quote"}</p>
                  </div>
                  <Link href={bookHref} className="btn btn-primary min-h-14 px-8 text-base">
                    {p.cta} <ArrowRight className="size-5" aria-hidden />
                  </Link>
                </div>
                <ul className="mt-7 flex animate-fade-up flex-wrap gap-x-6 gap-y-2 text-sm text-white/70 [animation-delay:950ms]">
                  {[`${deposit} deposit holds your date`, "Credited to your total", "Real-time availability"].map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <Check className="size-4 text-accent" aria-hidden /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <Reveal className="lg:col-span-6">{pkg === "timelapse" ? <TimelapseFrame /> : <EstateFrame />}</Reveal>
            </div>
          </section>
        </ViewContentTracker>

        {/* Benefits */}
        <section aria-label="Why it works" className="border-y border-line bg-void py-20 md:py-28">
          <div className="container-x grid gap-px overflow-hidden rounded-[1.25rem] border border-line bg-line md:grid-cols-3">
            {l.benefits.map((b, i) => (
              <Reveal key={b.title} delay={i * 100} className="bg-void p-7 md:p-10">
                <p className="font-display text-sm font-bold tabular-nums text-accent">0{i + 1}</p>
                <h2 className="mt-4 text-2xl font-bold tracking-tight">{b.title}</h2>
                <p className="mt-3 leading-relaxed text-mist">{b.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Full package details */}
        <div id="details" className="bg-void">
          <ServiceFeature pkg={pkg} index={pkg === "timelapse" ? "01" : "02"} settings={settings} showPageLink={false} detailsOpen />
        </div>

        <Process />
        <Faq items={faq.filter((f) => l.faq.includes(f.q))} />
        <FinalCta email={settings.contact.email} phone={settings.contact.phone} />
      </main>
      <Footer email={settings.contact.email} phone={settings.contact.phone} areaLabel={settings.serviceArea.label} />
      <MobileBookBar href={bookHref} label={p.cta} note={price != null ? `From ${formatUSD(price)} · ${deposit} today` : undefined} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: p.title,
            serviceType: pkg === "timelapse" ? "Aerial construction time-lapse video" : "Real estate drone video",
            areaServed: ["Queens, NY", "Nassau County, NY", "Suffolk County, NY"],
            provider: { "@type": "ProfessionalService", name: "Cloudline Media" },
            ...(price != null && { offers: { "@type": "Offer", priceCurrency: "USD", price: (price / 100).toFixed(2), priceSpecification: { "@type": "PriceSpecification", minPrice: price / 100, priceCurrency: "USD" } } }),
          }),
        }}
      />
    </>
  );
}
