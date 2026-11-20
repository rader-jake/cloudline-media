"use client";

import { useEffect, useRef, useState } from "react";

/** Short muted preview loop that only loads/plays while on screen. */
export function PreviewLoop({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setLoad(true);
        el.play().catch(() => {});
      } else el.pause();
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} src={load ? src : undefined} muted loop playsInline preload="none" aria-hidden className="absolute inset-0 h-full w-full object-cover" />;
}
