"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/** Fades/slides children in when scrolled into view. Respects reduced motion via CSS. */
export function Reveal({ children, delay = 0, className = "", as: Tag = "div" }: { children: ReactNode; delay?: number; className?: string; as?: ElementType }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}>
      {children}
    </Tag>
  );
}
