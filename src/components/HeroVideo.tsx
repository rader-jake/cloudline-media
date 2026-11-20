"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Background video that only loads after the page is interactive, skips on Data Saver /
 * slow connections and reduced-motion, and fades in over the poster once it can play.
 */
export function HeroVideo({ src, mobileSrc, poster }: { src: string; mobileSrc?: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? "")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const id = window.setTimeout(() => setSource(isMobile && mobileSrc ? mobileSrc : src), 300);
    return () => window.clearTimeout(id);
  }, [src, mobileSrc]);

  if (!source) return null;
  return (
    <video
      ref={ref}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
      src={source}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden
      onCanPlay={() => setReady(true)}
      onError={() => setSource(null)}
    />
  );
}
