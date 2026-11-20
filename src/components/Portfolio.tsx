"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { portfolio, type PortfolioItem } from "@/content/site";
import { Reveal } from "./Reveal";

const TABS = [
  { key: "all", label: "All" },
  { key: "timelapse", label: "Job Time-Lapses" },
  { key: "realestate", label: "Real Estate Tours" },
] as const;

const categoryLabel = { timelapse: "Job Time-Lapse", realestate: "Real Estate Tour" };

export function Portfolio() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [active, setActive] = useState<PortfolioItem | null>(null);
  const items = portfolio.filter((p) => tab === "all" || p.category === tab);
  const hasPlaceholders = portfolio.some((p) => p.placeholder);

  return (
    <section id="work" className="scroll-mt-20 bg-gradient-to-b from-ink via-ink-2 to-ink py-20 md:py-28">
      <div className="container-x">
        <Reveal className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Our Work</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">See the Difference From Above.</h2>
          </div>
          <div role="tablist" aria-label="Filter portfolio" className="flex w-full gap-1 overflow-x-auto rounded-xl border border-line bg-panel/60 p-1 md:w-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition ${tab === t.key ? "bg-accent text-ink" : "text-white/75 hover:text-white"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 90}>
              <button
                type="button"
                onClick={() => setActive(p)}
                className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line text-left"
                aria-label={`${p.placeholder ? "Sample: " : "Play: "}${p.title}`}
              >
                <Image
                  src={p.thumbnail}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ objectPosition: p.thumbnailPosition }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white/80 bg-ink/30 backdrop-blur-sm transition group-hover:scale-110 group-hover:border-accent group-hover:bg-accent/20">
                  <Play className="ml-1 size-6 fill-white text-white" aria-hidden />
                </span>
                {p.placeholder && (
                  <span className="absolute right-3 top-3 rounded-full bg-ink/75 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-mist backdrop-blur">
                    Sample
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{categoryLabel[p.category]}</p>
                  <p className="mt-1 text-lg font-bold">{p.title}</p>
                  {p.location && <p className="text-sm text-mist">{p.location}</p>}
                </div>
              </button>
            </Reveal>
          ))}
        </div>
        {hasPlaceholders && (
          <p className="mt-6 text-center text-sm text-mist">Sample previews shown — our latest client projects are being added soon.</p>
        )}
      </div>
      {active && <VideoModal item={active} onClose={() => setActive(null)} />}
    </section>
  );
}

function VideoModal({ item, onClose }: { item: PortfolioItem; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [onClose]);

  const v = item.video;
  return (
    <div role="dialog" aria-modal="true" aria-label={item.title} className="fixed inset-0 z-[60] grid place-items-center bg-ink/90 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} onClick={onClose} className="absolute -top-12 right-0 grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close video">
          <X className="size-5" />
        </button>
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-black">
          {!v || item.placeholder ? (
            <div className="absolute inset-0">
              <Image src={item.thumbnail} alt="" fill className="object-cover opacity-40" style={{ objectPosition: item.thumbnailPosition }} sizes="100vw" />
              <div className="absolute inset-0 grid place-items-center p-6 text-center">
                <div>
                  <p className="eyebrow">Sample preview</p>
                  <p className="mt-2 text-2xl font-bold">{item.title}</p>
                  <p className="mt-2 text-mist">Full video coming soon. Book a shoot to see your own project from above.</p>
                </div>
              </div>
            </div>
          ) : v.type === "youtube" ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={item.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : v.type === "vimeo" ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://player.vimeo.com/video/${v.id}?autoplay=1&dnt=1`}
              title={item.title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video className="absolute inset-0 h-full w-full" src={v.src} controls autoPlay playsInline poster={item.thumbnail} />
          )}
        </div>
        <p className="mt-4 text-lg font-bold">{item.title}</p>
        <p className="text-sm text-accent">{categoryLabel[item.category]}</p>
      </div>
    </div>
  );
}
