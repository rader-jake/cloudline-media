"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

/** Discreet thumb-reach booking pill on phones, shown after the hero and hidden near the final CTA. */
export function MobileBookBar({ label, href = "/book", note }: { label?: string; href?: string; note?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const nearBottom = window.innerHeight + window.scrollY > document.body.scrollHeight - 700;
        setShow(window.scrollY > window.innerHeight * 0.6 && !nearBottom);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return (
    <div
      className={`fixed inset-x-3 bottom-3 z-40 pb-[env(safe-area-inset-bottom)] transition-[transform,opacity] duration-500 ease-[var(--ease-cine)] md:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[130%] opacity-0"
      }`}
      aria-hidden={!show}
    >
      <Link
        href={href}
        tabIndex={show ? 0 : -1}
        className="flex min-h-14 items-center justify-between gap-3 rounded-full border border-white/10 bg-void/80 py-2 pl-5 pr-2 shadow-[0_20px_40px_-12px_rgb(0_0_0/0.8)] backdrop-blur-xl"
      >
        <span className="min-w-0 truncate text-sm text-white/75">{note ?? "Pick a date · $20 deposit"}</span>
        <span className="btn btn-primary min-h-11 shrink-0 px-5 text-sm">
          {label ?? "Book a Shoot"} <ArrowRight className="size-4" aria-hidden />
        </span>
      </Link>
    </div>
  );
}
