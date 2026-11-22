"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Signature interaction: when the frame scrolls into view, a drone crosses the viewport
 * right-to-left and its pass wipes the frame into view. Runs once, never blocks input
 * (pointer-events: none), and is skipped entirely for reduced-motion users (CSS shows the frame).
 */
export function DronePass({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [flying, setFlying] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || flying) return;
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFlying(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setFlying(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [flying]);

  return (
    <div ref={ref} className={`drone-pass ${flying ? "is-flying" : ""} ${className}`}>
      <div className="drone-pass__frame">{children}</div>
      <div className="drone-pass__track" aria-hidden>
        <div className="drone-pass__craft">
          <span className="drone-pass__trail" />
          <DroneTopDown />
        </div>
      </div>
    </div>
  );
}

/** Top-down quadcopter silhouette, nose pointing left (direction of travel). */
function DroneTopDown() {
  const rotors = [
    [26, 24],
    [94, 24],
    [26, 76],
    [94, 76],
  ];
  return (
    <svg viewBox="0 0 120 100" className="relative w-full overflow-visible">
      <defs>
        <radialGradient id="dp-disc" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#dff3ff" stopOpacity="0.28" />
          <stop offset="75%" stopColor="#dff3ff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#dff3ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dp-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f8fb" />
          <stop offset="1" stopColor="#b9c8d4" />
        </linearGradient>
      </defs>
      {/* arms */}
      <g stroke="#c9d6e0" strokeWidth="6" strokeLinecap="round">
        <line x1="44" y1="42" x2="26" y2="24" />
        <line x1="76" y1="42" x2="94" y2="24" />
        <line x1="44" y1="58" x2="26" y2="76" />
        <line x1="76" y1="58" x2="94" y2="76" />
      </g>
      {/* rotor discs + spinning blades */}
      {rotors.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="19" fill="url(#dp-disc)" />
          <g className="drone-pass__rotor">
            <rect x={x - 17} y={y - 1.2} width="34" height="2.4" rx="1.2" fill="#ffffff" opacity="0.7" />
          </g>
          <circle cx={x} cy={y} r="3.4" fill="#e9f0f5" stroke="#8fa3b3" strokeWidth="0.6" />
        </g>
      ))}
      {/* body */}
      <rect x="38" y="35" width="46" height="30" rx="13" fill="url(#dp-body)" />
      <rect x="47" y="41" width="27" height="18" rx="7" fill="#dbe5ec" />
      {/* gimbal camera at the nose (left = direction of travel) */}
      <rect x="29" y="43.5" width="11" height="13" rx="3.5" fill="#1a2734" />
      <circle cx="32.5" cy="50" r="2.6" fill="#20b8ff" />
      {/* nav lights */}
      <circle cx="85" cy="39" r="1.8" fill="#20b8ff" />
      <circle cx="85" cy="61" r="1.8" fill="#ff5a5a" />
    </svg>
  );
}
