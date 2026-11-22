"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Lock, Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const links = [
  { href: "/time-lapse", label: "Time-Lapse" },
  { href: "/real-estate", label: "Real Estate" },
  { href: "/#possibilities", label: "Possibilities" },
  { href: "/#how", label: "Process" },
  { href: "/#faq", label: "FAQ" },
];

/**
 * variant "site": transparent over the hero, frosted once scrolled.
 * variant "checkout": minimal header for /book — logo, secure badge, exit link. No distractions.
 */
export function Nav({ solid = false, variant = "site", bookHref = "/book" }: { solid?: boolean; variant?: "site" | "checkout"; bookHref?: string }) {
  const [scrolled, setScrolled] = useState(solid);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (solid) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [solid]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (variant === "checkout") {
    return (
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-void/80 backdrop-blur-xl">
        <nav className="container-x flex h-[64px] items-center justify-between gap-4 md:h-[72px]" aria-label="Checkout">
          <div className="w-[104px] shrink-0 md:w-[132px]">
            <Logo priority />
          </div>
          <p className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/60 sm:flex">
            <Lock className="size-3.5 text-accent" aria-hidden /> Secure booking
          </p>
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white">
            <ArrowLeft className="size-4" aria-hidden /> Back to site
          </Link>
        </nav>
      </header>
    );
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled || open ? "border-b border-line bg-void/75 backdrop-blur-xl" : "border-b border-transparent bg-gradient-to-b from-void/70 to-transparent"
      }`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <nav className="container-x flex h-[68px] items-center justify-between gap-4 md:h-[80px]" aria-label="Main">
        <div className="w-[104px] shrink-0 sm:w-[118px] md:w-[140px]">
          <Logo priority />
        </div>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="rounded-full px-4 py-2 text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:text-white">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link href={bookHref} className="btn btn-primary min-h-10 px-4 text-sm md:min-h-11 md:px-5">
            Book a Shoot <ArrowRight className="hidden size-4 sm:block" aria-hidden />
          </Link>
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 text-white lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="h-[calc(100dvh-68px)] overflow-y-auto border-t border-line bg-void/95 backdrop-blur-xl lg:hidden">
          <ul className="container-x flex flex-col py-6">
            {links.map((l, i) => (
              <li key={l.href} className="animate-fade-up border-b border-line" style={{ animationDelay: `${i * 50}ms` }}>
                <Link href={l.href} onClick={() => setOpen(false)} className="display flex items-center justify-between py-5 text-3xl">
                  {l.label} <ArrowRight className="size-5 text-accent" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <div className="container-x pb-10">
            <Link href={bookHref} onClick={() => setOpen(false)} className="btn btn-primary min-h-14 w-full text-base">
              Book a Shoot — $20 deposit <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
