"use client";

import { useEffect, useState } from "react";

type Sources = { mp4: string; webm?: string; mobileMp4?: string };

/**
 * Muted background loop layered over the poster still. It only loads after the page is interactive,
 * never for reduced-motion users, Data Saver or 2G (they keep the still), and fades in once it can play.
 * Phones get the portrait-cropped 720p file.
 */
export function HeroVideo({ sources, poster, posterMobile }: { sources: Sources; poster: string; posterMobile?: string }) {
  const [pick, setPick] = useState<{ list: { src: string; type: string }[]; poster: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? "")) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const list =
      mobile && sources.mobileMp4
        ? [{ src: sources.mobileMp4, type: "video/mp4" }]
        : [...(sources.webm ? [{ src: sources.webm, type: "video/webm" }] : []), { src: sources.mp4, type: "video/mp4" }];
    const id = window.setTimeout(() => setPick({ list, poster: mobile && posterMobile ? posterMobile : poster }), 250);
    return () => window.clearTimeout(id);
  }, [sources.mp4, sources.webm, sources.mobileMp4, poster, posterMobile]);

  if (!pick) return null;
  return (
    <video
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
      poster={pick.poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden
      onCanPlay={() => setReady(true)}
      onError={() => setPick(null)}
    >
      {pick.list.map((s) => (
        <source key={s.src} src={s.src} type={s.type} />
      ))}
    </video>
  );
}
