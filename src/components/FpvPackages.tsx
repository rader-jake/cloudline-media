import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { fpvPackages, moreServices } from "@/content/site";
import { formatUSD, priceDisplay, type Settings } from "@/lib/settings";
import { prettyDate } from "@/lib/time";
import { Reveal } from "./Reveal";
import { Brackets, FeatureBlock, MediaNote } from "./Services";
import { PrefillLink } from "./Prefill";

/** Launch special header + the three FPV packages + "More ways" aerial list + fine print. */
export function FpvPackages({ settings }: { settings: Settings }) {
  const launch = settings.launch;
  return (
    <section id="packages" aria-labelledby="packages-title" className="relative scroll-mt-20 bg-void pt-24 md:pt-36">
      <div className="container-x">
        <Reveal className="max-w-5xl">
          <p className="kicker">{launch.enabled ? fpvPackages.label : "FPV packages"}</p>
          <h2 id="packages-title" className="display mt-6 text-[clamp(2rem,4.8vw,4.3rem)]">
            {launch.enabled ? fpvPackages.headline.replace(/\.$/, "") : "Extraordinary content"}
            <span className="text-accent">.</span>
          </h2>
          {launch.enabled && (
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-mist">
              {fpvPackages.line}
              {launch.endsAt && <span className="text-white"> Launch pricing ends {prettyDate(`${launch.endsAt}T12:00:00Z`)}.</span>}
            </p>
          )}
        </Reveal>
      </div>

      {fpvPackages.items.map((item, i) => {
        const svc = settings.services[item.key];
        if (!svc.active) return null;
        const pd = priceDisplay(settings, item.key);
        const isBook = item.action === "book";
        const includes = svc.turnaround ? [...item.includes, `Delivered within ${svc.turnaround} after the shoot`] : item.includes;
        const ctaClass = "btn btn-primary min-h-14 px-8 text-base";
        return (
          <div key={item.key}>
            {i > 0 && (
              <div className="container-x">
                <div className="hairline" />
              </div>
            )}
            <FeatureBlock
              id={item.key}
              index={item.index}
              kicker={item.eyebrow}
              title={item.displayTitle as [string, string]}
              tagline={item.tagline}
              body={item.body || undefined}
              idealFor={item.idealFor}
              priceKicker={launch.enabled && pd.standard != null ? launch.label : pd.startingAt ? "Starting at" : "Price"}
              price={pd.label ?? "Quote"}
              priceSub={pd.standardLabel ? `Standard rate after launch: ${pd.standardLabel}` : null}
              depositLine={
                isBook ? (
                  <>
                    {formatUSD(settings.depositCents)} deposit to book.
                    <br />
                    Credited to your total.
                  </>
                ) : (
                  "note" in item && item.note
                )
              }
              cta={
                isBook ? (
                  <Link href={`/book?package=${item.key}`} className={ctaClass}>
                    {item.cta} <ArrowRight className="size-5" aria-hidden />
                  </Link>
                ) : (
                  <PrefillLink pkg={item.key} className={ctaClass}>
                    {item.cta} <ArrowRight className="size-5" aria-hidden />
                  </PrefillLink>
                )
              }
              includes={includes}
              visual={<FpvFrame item={item} />}
              flip={i === 1}
              compact={i > 0}
              track={{ id: item.key, name: svc.name, value: pd.price ?? 0 }}
            />
          </div>
        );
      })}

      <div className="container-x pb-6">
        <p className="max-w-3xl text-sm leading-relaxed text-white/50">{fpvPackages.finePrint}</p>
      </div>

      <MoreServices settings={settings} />
    </section>
  );
}

/** Package visual: concept frame + drone-monitor HUD. The flight path is a lightweight animated SVG. */
function FpvFrame({ item }: { item: (typeof fpvPackages.items)[number] }) {
  const hud = "hud" in item ? item.hud : null;
  return (
    <figure className="img-wipe relative overflow-hidden rounded-[1.25rem] bg-panel">
      <div className="relative aspect-[16/10] md:aspect-[16/9]">
        <Image src={item.image} alt={item.imageAlt} fill sizes="(min-width: 1024px) 700px, 100vw" className="img-settle object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-void/85 via-void/5 to-void/40" />
        {hud && (
          <svg aria-hidden className="absolute inset-0 size-full" viewBox="0 0 160 90" preserveAspectRatio="none">
            <path className="pf-route" d="M 80 92 C 78 70, 86 58, 80 44 S 74 30, 80 22" fill="none" stroke="#20b8ff" strokeWidth="0.5" strokeDasharray="1 2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </div>
      <Brackets />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-6 text-[0.62rem] font-bold uppercase tracking-[0.26em] text-white/80 md:p-8">
        <span className="flex items-center gap-2">
          <span className="size-1.5 animate-blink rounded-full bg-accent" aria-hidden /> {hud?.left ?? "FPV"}
        </span>
        <span>{hud?.right ?? item.eyebrow}</span>
      </div>
      {hud && (
        <figcaption className="absolute inset-x-0 bottom-0 p-6 md:p-8">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.26em] text-white/60">{hud.caption}</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums tracking-tight md:text-5xl">{hud.timecode}</p>
        </figcaption>
      )}
      <MediaNote text="Concept visualization" />
    </figure>
  );
}

/** Quieter list of the traditional aerial services (sits under the FPV packages). */
function MoreServices({ settings }: { settings: Settings }) {
  const items = moreServices.items.filter((m) => m.key !== "timelapse" || settings.display.showTimelapse);
  const priceOf = (key: string, fallback?: string) => {
    if (key === "realestate" || key === "timelapse") {
      const pd = priceDisplay(settings, key);
      return pd.price != null ? `From ${formatUSD(pd.price)}` : "Custom quote";
    }
    return fallback ?? "";
  };
  return (
    <div className="container-x pb-24 pt-14 md:pb-32 md:pt-20">
      <Reveal className="grid gap-8 lg:grid-cols-12">
        <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-white/55 lg:col-span-4">{moreServices.label}</h3>
        <ul className="border-t border-line lg:col-span-8">
          {items.map((m) => (
            <li key={m.key} className="border-b border-line">
              <Link href={m.href} className="group flex items-center justify-between gap-4 py-4 text-white/85 transition-colors hover:text-white">
                <span className="font-semibold">{m.title}</span>
                <span className="flex items-center gap-3 text-sm text-mist">
                  {priceOf(m.key, "price" in m ? m.price : undefined)}
                  <ArrowUpRight className="size-4 transition-transform group-hover:rotate-45" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}
