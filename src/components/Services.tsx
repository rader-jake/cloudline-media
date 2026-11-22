import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Plus, Sparkles } from "lucide-react";
import { packages } from "@/content/site";
import { formatUSD, type Settings } from "@/lib/settings";
import { Reveal } from "./Reveal";
import { ViewContentTracker } from "./ViewContentTracker";
import roofImg from "../../public/media/roof-clean.webp";
import estateImg from "../../public/media/estate-frame.webp";

type PkgKey = "timelapse" | "realestate";

const pages: Record<PkgKey, string> = { timelapse: "/time-lapse", realestate: "/real-estate" };

export function Services({ settings }: { settings: Settings }) {
  return (
    <section id="services" aria-label="Services" className="relative scroll-mt-20 bg-void">
      <ServiceFeature pkg="timelapse" index="01" settings={settings} />
      <div className="container-x">
        <div className="hairline" />
      </div>
      <ServiceFeature pkg="realestate" index="02" settings={settings} flip />
    </section>
  );
}

/** One editorial service block: oversized title, framed visual, concise copy, price, CTA, expandable details. */
export function ServiceFeature({
  pkg,
  index,
  settings,
  flip = false,
  showPageLink = true,
  detailsOpen = false,
}: {
  pkg: PkgKey;
  index: string;
  settings: Settings;
  flip?: boolean;
  showPageLink?: boolean;
  detailsOpen?: boolean;
}) {
  const p = packages[pkg];
  const price = settings.services[pkg].priceCents;
  const [t1, t2] = p.displayTitle;

  return (
    <ViewContentTracker id={pkg} name={p.title} value={price ?? 0}>
      <article id={pkg} aria-labelledby={`svc-${pkg}`} className="container-x scroll-mt-24 py-24 md:py-36">
        {/* Title row */}
        <Reveal className={`flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${flip ? "md:flex-row-reverse md:text-right" : ""}`}>
          <div>
            <p className={`kicker ${flip ? "md:flex-row-reverse md:before:hidden" : ""}`}>
              {index} — {pkg === "timelapse" ? "For contractors & service pros" : "For agents, brokers & owners"}
            </p>
            <h2 id={`svc-${pkg}`} className="display mt-6 text-[clamp(2.3rem,7.4vw,6.2rem)]">
              <span className="block">{t1}</span>
              <span className="block text-outline">{t2}</span>
            </h2>
          </div>
          <p className={`text-xl font-semibold leading-snug text-white md:text-2xl ${flip ? "md:text-left" : "md:text-right"}`}>
            {p.tagline.split(/(?<=\.)\s+/).map((part) => (
              <span key={part} className="block md:whitespace-nowrap">
                {part}
              </span>
            ))}
          </p>
        </Reveal>

        <div className={`mt-12 grid items-start gap-10 md:mt-16 lg:grid-cols-12 lg:gap-14 ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}>
          {/* Visual */}
          <Reveal className="lg:col-span-7">{pkg === "timelapse" ? <TimelapseFrame /> : <EstateFrame />}</Reveal>

          {/* Copy */}
          <Reveal delay={120} className="lg:col-span-5">
            <p className="text-lg leading-relaxed text-mist">{p.description}</p>

            <p className="mt-6 text-sm leading-relaxed text-white/80">
              <span className="mr-2 text-xs font-bold uppercase tracking-[0.24em] text-white/45">Ideal for</span>
              {p.idealFor.join(" · ")}
            </p>

            <div className="mt-10 flex items-end gap-5 border-t border-line pt-8">
              <div>
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.28em] text-white/50">Starting at</p>
                <p className="display mt-2 text-6xl tracking-[-0.03em] md:text-7xl">{price != null ? formatUSD(price) : "Quote"}</p>
              </div>
              <p className="mb-1.5 text-sm leading-snug text-mist">
                {formatUSD(settings.depositCents)} deposit to book.
                <br />
                Credited to your total.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <Link href={`/book?package=${pkg}`} className="btn btn-primary min-h-14 px-8 text-base">
                {p.cta} <ArrowRight className="size-5" aria-hidden />
              </Link>
              {showPageLink && (
                <Link href={pages[pkg]} className="link-line self-start text-sm text-white/85 hover:text-white sm:self-auto">
                  Full details <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              )}
            </div>

            {"upgrade" in p && (
              <div className="mt-8 flex gap-4 rounded-2xl border border-accent/25 bg-accent/[0.04] p-5">
                <Sparkles className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="font-bold">{p.upgrade.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-mist">{p.upgrade.body}</p>
                  <Link href="/book?package=fpv" className="link-line mt-3 text-sm text-accent">
                    {p.upgrade.cta} <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            )}

            <details className="group mt-8 border-y border-line" open={detailsOpen}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-bold [&::-webkit-details-marker]:hidden">
                {pkg === "realestate" ? "What's included in the base aerial package" : "What's included"}
                <Plus className="size-5 shrink-0 text-accent transition-transform duration-300 group-open:rotate-45" aria-hidden />
              </summary>
              <ul className="space-y-3 pb-6">
                {p.includes.map((t) => (
                  <li key={t} className="flex gap-3 text-[0.95rem] leading-snug text-white/85">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /> {t}
                  </li>
                ))}
              </ul>
              {"disclaimer" in p && <p className="-mt-2 pb-6 text-sm leading-relaxed text-mist">{p.disclaimer}</p>}
            </details>
          </Reveal>
        </div>
      </article>
    </ViewContentTracker>
  );
}

/* ── Visual frames ─────────────────────────────────────────── */

function Brackets() {
  const c = "absolute size-5 border-white/70";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-4 md:inset-5">
      <span className={`${c} left-0 top-0 border-l border-t`} />
      <span className={`${c} right-0 top-0 border-r border-t`} />
      <span className={`${c} bottom-0 left-0 border-b border-l`} />
      <span className={`${c} bottom-0 right-0 border-b border-r`} />
    </div>
  );
}

function MediaNote() {
  return (
    <span className="absolute bottom-3 right-4 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-white/45 md:bottom-4 md:right-5">
      Illustrative imagery
    </span>
  );
}

/** Roofing crew, framed like a drone monitor; the timecode compresses 2 hours into 30 seconds. */
export function TimelapseFrame() {
  return (
    <figure className="img-wipe relative overflow-hidden rounded-[1.25rem] bg-panel">
      <div className="relative aspect-[16/10] md:aspect-[16/9]">
        <Image src={roofImg} alt={packages.timelapse.imageAlt} fill sizes="(min-width: 1024px) 700px, 100vw" placeholder="blur" className="img-settle object-cover object-[50%_45%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-void/85 via-void/10 to-void/40" />
        <div className="absolute inset-0 bg-[#06111b]/20 mix-blend-multiply" />
      </div>
      <Brackets />
      {/* HUD */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-6 text-[0.62rem] font-bold uppercase tracking-[0.26em] text-white/80 md:p-8">
        <span className="flex items-center gap-2">
          <span className="size-1.5 animate-blink rounded-full bg-accent" aria-hidden /> Interval capture
        </span>
        <span>Time-lapse</span>
      </div>
      <figcaption className="absolute inset-x-0 bottom-0 p-6 md:p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.26em] text-white/60">On site → on screen</p>
            <p className="timecode mt-1 font-display text-3xl font-bold tracking-tight md:text-5xl" aria-label="Two hours on site becomes about thirty seconds on screen" />
          </div>
        </div>
        <div className="mt-4 h-px w-full bg-white/15">
          <div className="tl-progress h-px origin-left bg-accent" />
        </div>
      </figcaption>
      <MediaNote />
    </figure>
  );
}

export function EstateFrame() {
  return (
    <figure className="img-wipe relative overflow-hidden rounded-[1.25rem] bg-panel">
      <div className="relative aspect-[4/3] md:aspect-[3/2]">
        <Image src={estateImg} alt={packages.realestate.imageAlt} fill sizes="(min-width: 1024px) 700px, 100vw" placeholder="blur" className="img-settle object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-void/30" />
      </div>
      <Brackets />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-6 text-[0.62rem] font-bold uppercase tracking-[0.26em] text-white/80 md:p-8">
        <span>Exterior aerial</span>
        <span>Listing-ready</span>
      </div>
      <figcaption className="absolute bottom-0 left-0 p-6 md:p-8">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.26em] text-white/60">The home · the lot · the setting</p>
        <p className="mt-1 font-display text-2xl font-bold tracking-tight md:text-3xl">The full picture, from above.</p>
      </figcaption>
      <MediaNote />
    </figure>
  );
}
