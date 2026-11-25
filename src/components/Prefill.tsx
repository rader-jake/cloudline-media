"use client";

import type { ReactNode } from "react";

/** Fired when a tile/CTA wants the inquiry form prefilled. The form also reads ?industry=&package= on load. */
export const PREFILL_EVENT = "cloudline:prefill";
export type PrefillDetail = { industry?: string; package?: string };

/** Link that scrolls to the inquiry form (#contact) and prefills industry + package. */
export function PrefillLink({
  industry,
  pkg,
  className,
  children,
  "aria-label": ariaLabel,
}: {
  industry?: string;
  pkg?: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  const qs = new URLSearchParams({ ...(industry && { industry }), ...(pkg && { package: pkg }) }).toString();
  return (
    <a
      href={`/?${qs}#contact`}
      aria-label={ariaLabel}
      className={className}
      onClick={(e) => {
        const form = document.getElementById("contact");
        if (!form) return; // not on a page with the form — follow the link to the homepage form
        e.preventDefault();
        window.dispatchEvent(new CustomEvent<PrefillDetail>(PREFILL_EVENT, { detail: { industry, package: pkg } }));
        form.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        history.replaceState(null, "", "#contact");
      }}
    >
      {children}
    </a>
  );
}
