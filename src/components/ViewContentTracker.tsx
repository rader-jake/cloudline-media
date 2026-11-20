"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { trackOnce } from "@/lib/analytics";

/** Fires Meta ViewContent when a package card is at least half visible. */
export function ViewContentTracker({ id, name, value, children }: { id: string; name: string; value: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          trackOnce(`vc:${id}`, "ViewContent", { content_ids: [id], content_name: name, content_type: "product", value: value / 100, currency: "USD" });
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [id, name, value]);
  return (
    <div ref={ref} className="h-full">
      {children}
    </div>
  );
}
