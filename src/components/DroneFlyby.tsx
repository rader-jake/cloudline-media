"use client";

import { useEffect, useState } from "react";

/**
 * A small stylised drone that flies right → left once per visit as the services section
 * enters view. Pointer-events: none, hidden on small screens and for reduced-motion users.
 */
export function DroneFlyby({ targetId = "services" }: { targetId?: string }) {
  const [flying, setFlying] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(max-width: 767px)").matches) return;
    try {
      if (sessionStorage.getItem("cl_flyby")) return;
    } catch {}

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && window.scrollY > 80) {
          io.disconnect();
          try {
            sessionStorage.setItem("cl_flyby", "1");
          } catch {}
          setFlying(true);
          window.setTimeout(() => setFlying(false), 3000);
        }
      },
      { threshold: 0.12 }
    );
    io.observe(target);
    return () => io.disconnect();
  }, [targetId]);

  if (!flying) return null;
  return (
    <div className="drone-flyby" aria-hidden>
      <div className="drone-flyby__craft">
        <div className="drone-flyby__trail" />
        <svg viewBox="0 0 160 70" className="relative w-full" fill="none">
          {/* rotors */}
          <ellipse className="drone-flyby__rotor" cx="28" cy="12" rx="24" ry="2.6" fill="#E6F6FF" opacity="0.9" />
          <ellipse className="drone-flyby__rotor" cx="132" cy="12" rx="24" ry="2.6" fill="#E6F6FF" opacity="0.9" />
          <rect x="26" y="12" width="4" height="8" rx="1.5" fill="#fff" />
          <rect x="130" y="12" width="4" height="8" rx="1.5" fill="#fff" />
          {/* arms */}
          <path d="M28 21 H62 L70 27 H90 L98 21 H132" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="20" y="17" width="16" height="9" rx="3" fill="#fff" />
          <rect x="124" y="17" width="16" height="9" rx="3" fill="#fff" />
          {/* body */}
          <path d="M60 24 Q80 14 100 24 L96 36 Q80 42 64 36 Z" fill="#fff" />
          <circle cx="80" cy="28" r="2.2" fill="#20B8FF" />
          {/* legs */}
          <path d="M68 36 Q60 46 64 56 M92 36 Q100 46 96 56" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          {/* gimbal camera */}
          <rect x="73" y="38" width="14" height="11" rx="3" fill="#fff" />
          <circle cx="80" cy="43.5" r="3.2" fill="#06111B" />
          <circle cx="80" cy="43.5" r="1.4" fill="#20B8FF" />
        </svg>
      </div>
    </div>
  );
}
