import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, HardHat, House, Info, Sparkles } from "lucide-react";
import { packages } from "@/content/site";
import { formatUSD, type Settings } from "@/lib/settings";
import { Reveal } from "./Reveal";
import { ViewContentTracker } from "./ViewContentTracker";
import { PreviewLoop } from "./PreviewLoop";

export function Packages({ settings }: { settings: Settings }) {
  const cards = [
    { ...packages.timelapse, Icon: HardHat, price: settings.services.timelapse.priceCents, deposit: settings.depositCents },
    { ...packages.realestate, Icon: House, price: settings.services.realestate.priceCents, deposit: settings.depositCents },
  ];

  return (
    <section id="services" className="relative scroll-mt-20 py-20 md:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-ink to-transparent" />
      <div className="container-x relative">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Our Services</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Two Simple Packages</h2>
          <p className="mt-3 text-lg text-mist">Professional aerial video, made easy.</p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {cards.map((c, i) => (
            <Reveal key={c.key} delay={i * 120} className="h-full">
              <ViewContentTracker id={c.key} name={c.title} value={c.price ?? 0}>
                <article className="card group flex h-full flex-col overflow-hidden" aria-labelledby={`pkg-${c.key}`}>
                  <Link href="#work" aria-label={`See sample ${c.title} videos`} className="relative block aspect-[16/8] overflow-hidden">
                    <Image
                      src={c.image}
                      alt={c.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 580px, 100vw"
                      className="object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-[1.06]"
                    />
                    {c.previewVideo && <PreviewLoop src={c.previewVideo} />}
                    <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent backdrop-blur">
                      {c.eyebrow}
                    </span>
                  </Link>

                  <div className="flex flex-1 flex-col p-6 md:p-8">
                    <div className="flex items-start gap-4">
                      <c.Icon className="mt-1 size-9 shrink-0 text-accent" strokeWidth={1.5} aria-hidden />
                      <div>
                        <h3 id={`pkg-${c.key}`} className="text-2xl font-extrabold tracking-tight md:text-[1.7rem]">
                          {c.title}
                        </h3>
                        <p className="mt-1 font-semibold text-accent-soft">{c.headline}</p>
                      </div>
                    </div>
                    <p className="mt-4 leading-relaxed text-mist">{c.description}</p>

                    <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-white/60">Ideal for</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {c.idealFor.map((t) => (
                        <li key={t} className="rounded-full border border-line bg-ink/40 px-3 py-1 text-sm text-white/85">
                          {t}
                        </li>
                      ))}
                    </ul>

                    <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                      {c.key === "realestate" ? "Base aerial package includes" : "Package includes"}
                    </p>
                    <ul className="mt-3 space-y-2.5">
                      {c.includes.map((t) => (
                        <li key={t} className="flex gap-3 text-[0.95rem] leading-snug text-white/90">
                          <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /> {t}
                        </li>
                      ))}
                    </ul>

                    {"disclaimer" in c && (
                      <p className="mt-4 flex gap-2.5 rounded-xl bg-ink/50 p-3 text-sm leading-relaxed text-mist">
                        <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /> {c.disclaimer}
                      </p>
                    )}

                    {"upgrade" in c && (
                      <div className="mt-4 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-4">
                        <p className="flex items-center gap-2 font-bold">
                          <Sparkles className="size-4 text-accent" aria-hidden /> {c.upgrade.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-mist">{c.upgrade.body}</p>
                        <Link href="/book?package=fpv" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-accent hover:underline">
                          {c.upgrade.cta} <ArrowRight className="size-3.5" aria-hidden />
                        </Link>
                      </div>
                    )}

                    <div className="mt-auto pt-7">
                      <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">{c.pricePrefix}</p>
                          <p className="text-5xl font-extrabold tracking-tight">{c.price != null ? formatUSD(c.price) : "Quote"}</p>
                          <p className="mt-1 text-sm text-mist">{formatUSD(c.deposit)} deposit today · credited to your total</p>
                        </div>
                        <Link href={`/book?package=${c.key}`} className="btn btn-primary min-h-13 px-6 text-base">
                          {c.cta} <ArrowRight className="size-4" aria-hidden />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </ViewContentTracker>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
