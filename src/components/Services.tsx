import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Check, Plus } from "lucide-react";
import { packages } from "@/content/site";
import { formatUSD, priceDisplay, type Settings } from "@/lib/settings";
import { Reveal } from "./Reveal";
import { ViewContentTracker } from "./ViewContentTracker";
import roofImg from "../../public/media/roof-clean.webp";
import estateImg from "../../public/media/estate-frame.webp";

type PkgKey = "timelapse" | "realestate";

/**
 * The editorial service block — oversized solid + outline title, framed visual, concise copy,
 * big price, CTA, and folded "What's included". Used for the FPV packages and the aerial service pages.
 */
export function FeatureBlock({
  id,
  index,
  kicker,
  title,
  tagline,
  body,
  idealFor,
  priceKicker,
  price,
  priceSub,
  depositLine,
  cta,
  secondary,
  includesTitle = "What's included",
  includes,
  disclaimer,
  visual,
  flip = false,
  compact = false,
  detailsOpen = false,
  track,
}: {
  id: string;
  index: string;
  kicker: string;
  title: [string, string];
  tagline: string;
  body?: string;
  idealFor?: readonly string[];
  priceKicker: string;
  price: string;
  priceSub?: string | null;
  depositLine?: ReactNode;
  cta: ReactNode;
  secondary?: ReactNode;
  includesTitle?: string;
  includes: readonly string[];
  disclaimer?: string;
  visual: ReactNode;
  flip?: boolean;
  compact?: boolean;
  detailsOpen?: boolean;
  track: { id: string; name: string; value: number };
}) {
  const [t1, t2] = title;
  return (
    <ViewContentTracker id={track.id} name={track.name} value={track.value}>
      <article id={id} aria-labelledby={`svc-${id}`} className={`container-x scroll-mt-24 ${compact ? "py-16 md:py-24" : "py-24 md:py-36"}`}>
        {/* Title row */}
        <Reveal className={`flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${flip ? "md:flex-row-reverse md:text-right" : ""}`}>
          <div>
            <p className={`kicker ${flip ? "md:flex-row-reverse md:before:hidden" : ""}`}>
              {index} — {kicker}
            </p>
            <h3 id={`svc-${id}`} className={`display mt-6 ${compact ? "text-[clamp(2rem,5.2vw,4.4rem)]" : "text-[clamp(2.3rem,7.4vw,6.2rem)]"}`}>
              <span className="block">{t1}</span>
              <span className="block text-outline">{t2}</span>
            </h3>
          </div>
          <p className={`max-w-md text-xl font-semibold leading-snug text-white md:text-2xl ${flip ? "md:text-left" : "md:text-right"}`}>
            {tagline.split(/(?<=\.)\s+/).map((part) => (
              <span key={part} className="block">
                {part}
              </span>
            ))}
          </p>
        </Reveal>

        <div className={`grid items-start gap-10 lg:grid-cols-12 lg:gap-14 ${compact ? "mt-10 md:mt-12" : "mt-12 md:mt-16"} ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}>
          {/* Visual */}
          <Reveal className={compact ? "lg:col-span-6" : "lg:col-span-7"}>{visual}</Reveal>

          {/* Copy */}
          <Reveal delay={120} className={compact ? "lg:col-span-6" : "lg:col-span-5"}>
            {body && <p className="text-lg leading-relaxed text-mist">{body}</p>}

            {idealFor && idealFor.length > 0 && (
              <p className="mt-6 text-sm leading-relaxed text-white/80">
                <span className="mr-2 text-xs font-bold uppercase tracking-[0.24em] text-white/45">Ideal for</span>
                {idealFor.join(" · ")}
              </p>
            )}

            <div className={`flex flex-wrap items-end gap-x-5 gap-y-3 ${body || idealFor?.length ? "mt-10 border-t border-line pt-8" : ""}`}>
              <div>
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.28em] text-white/50">{priceKicker}</p>
                <p className={`display mt-2 tracking-[-0.03em] ${compact ? "text-5xl md:text-6xl" : "text-6xl md:text-7xl"}`}>{price}</p>
                {priceSub && <p className="mt-2 text-sm text-white/50">{priceSub}</p>}
              </div>
              {depositLine && <p className="mb-1.5 text-sm leading-snug text-mist">{depositLine}</p>}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              {cta}
              {secondary}
            </div>

            <details className="group mt-8 border-y border-line" open={detailsOpen}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-bold [&::-webkit-details-marker]:hidden">
                {includesTitle}
                <Plus className="size-5 shrink-0 text-accent transition-transform duration-300 group-open:rotate-45" aria-hidden />
              </summary>
              <ul className="space-y-3 pb-6">
                {includes.map((t) => (
                  <li key={t} className="flex gap-3 text-[0.95rem] leading-snug text-white/85">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /> {t}
                  </li>
                ))}
              </ul>
              {disclaimer && <p className="-mt-2 pb-6 text-sm leading-relaxed text-mist">{disclaimer}</p>}
            </details>
          </Reveal>
        </div>
      </article>
    </ViewContentTracker>
  );
}

const pages: Record<PkgKey, string> = { timelapse: "/time-lapse", realestate: "/real-estate" };

/** Aerial service block (time-lapse / real estate), used on their service pages. */
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
  const pd = priceDisplay(settings, pkg);
  return (
    <FeatureBlock
      id={pkg}
      index={index}
      kicker={pkg === "timelapse" ? "For contractors & service pros" : "For agents, brokers & owners"}
      title={p.displayTitle as [string, string]}
      tagline={p.tagline}
      body={p.description}
      idealFor={p.idealFor}
      priceKicker="Starting at"
      price={pd.price != null ? formatUSD(pd.price) : "Quote"}
      depositLine={
        <>
          {formatUSD(settings.depositCents)} deposit to book.
          <br />
          Credited to your total.
        </>
      }
      cta={
        <Link href={`/book?package=${pkg}`} className="btn btn-primary min-h-14 px-8 text-base">
          {p.cta} <ArrowRight className="size-5" aria-hidden />
        </Link>
      }
      secondary={
        showPageLink ? (
          <Link href={pages[pkg]} className="link-line self-start text-sm text-white/85 hover:text-white sm:self-auto">
            Full details <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        ) : null
      }
      includesTitle={pkg === "realestate" ? "What's included in the base aerial package" : "What's included"}
      includes={p.includes}
      disclaimer={"disclaimer" in p ? p.disclaimer : undefined}
      visual={pkg === "timelapse" ? <TimelapseFrame /> : <EstateFrame />}
      flip={flip}
      detailsOpen={detailsOpen}
      track={{ id: pkg, name: p.title, value: pd.price ?? 0 }}
    />
  );
}

/* ── Visual frames ─────────────────────────────────────────── */

export function Brackets() {
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

export function MediaNote({ text = "Illustrative imagery" }: { text?: string }) {
  if (!text) return null;
  return (
    <span className="absolute bottom-3 right-4 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-white/45 md:bottom-4 md:right-5">
      {text}
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
