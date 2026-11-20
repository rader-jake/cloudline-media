"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

/** Persistent thumb-reach booking button on phones, shown after scrolling past the hero. */
export function MobileBookBar({ fromPrice }: { fromPrice: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY > document.body.scrollHeight - 520;
      setShow(window.scrollY > window.innerHeight * 0.7 && !nearBottom);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/85 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl transition-transform duration-300 md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!show}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-xs text-mist">Aerial videos from</p>
          <p className="text-lg font-extrabold">{fromPrice}</p>
        </div>
        <Link href="/book" tabIndex={show ? 0 : -1} className="btn btn-primary min-h-12 flex-[1.4] text-base">
          Book a Shoot <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
