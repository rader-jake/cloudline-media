"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const links = [
  { href: "/#top", label: "Home" },
  { href: "/#services", label: "Services" },
  { href: "/#work", label: "Our Work" },
  { href: "/#how", label: "How It Works" },
  { href: "/#contact", label: "Contact" },
];

export function Nav({ solid = false }: { solid?: boolean }) {
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

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open ? "border-b border-line bg-ink/75 backdrop-blur-xl" : "border-b border-transparent bg-gradient-to-b from-ink/60 to-transparent"
      }`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <nav className="container-x flex h-[68px] items-center justify-between gap-4 md:h-[76px]" aria-label="Main">
        <div className="w-[100px] shrink-0 sm:w-[118px] md:w-[150px]">
          <Logo priority />
        </div>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="rounded-lg px-3.5 py-2 text-[0.95rem] font-medium text-white/85 transition hover:text-white hover:bg-white/5">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link href="/book" className="btn btn-primary min-h-10 px-3.5 text-sm sm:px-4 md:min-h-11 md:px-5">
            Book a Shoot <ArrowRight className="hidden size-4 sm:block" aria-hidden />
          </Link>
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-white lg:hidden"
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
        <div id="mobile-menu" className="h-[calc(100dvh-68px)] overflow-y-auto border-t border-line bg-ink/95 backdrop-blur-xl lg:hidden">
          <ul className="container-x flex flex-col gap-1 py-6">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-4 text-xl font-semibold text-white hover:bg-white/5"
                >
                  {l.label} <ArrowRight className="size-5 text-accent" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <div className="container-x pb-10">
            <Link href="/book" onClick={() => setOpen(false)} className="btn btn-primary w-full text-base">
              Book a Shoot — $20 deposit <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
