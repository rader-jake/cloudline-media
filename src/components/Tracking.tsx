"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { captureAttribution, getConsent, loadPixel, PIXEL_ID, setConsent } from "@/lib/analytics";

/** Captures UTMs, shows the cookie banner, and loads the Meta Pixel only after consent. */
export function Tracking() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    captureAttribution();
    const c = getConsent();
    if (c === "granted") loadPixel();
    if (c === null && PIXEL_ID) setShowBanner(true);
    const onConsent = (e: Event) => {
      const v = (e as CustomEvent).detail;
      if (v === "granted") {
        loadPixel();
        captureAttribution();
      }
      setShowBanner(false);
    };
    const onOpen = () => setShowBanner(true);
    window.addEventListener("cl-consent", onConsent);
    window.addEventListener("cl-open-cookie-settings", onOpen);
    return () => {
      window.removeEventListener("cl-consent", onConsent);
      window.removeEventListener("cl-open-cookie-settings", onOpen);
    };
  }, []);

  if (!showBanner) return null;
  return (
    <div role="dialog" aria-label="Cookie preferences" className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl rounded-2xl border border-line bg-panel/95 p-5 shadow-card backdrop-blur-xl md:bottom-6">
      <p className="text-sm leading-relaxed text-white/90">
        We use cookies to measure our Facebook &amp; Instagram ads and improve the site. You can accept or decline marketing cookies — the site works
        either way. <Link href="/privacy" className="text-accent underline">Privacy policy</Link>
      </p>
      <div className="mt-4 flex gap-2">
        <button className="btn btn-primary min-h-10 flex-1 text-sm" onClick={() => setConsent("granted")}>
          Accept
        </button>
        <button className="btn btn-ghost min-h-10 flex-1 text-sm" onClick={() => setConsent("denied")}>
          Decline
        </button>
      </div>
    </div>
  );
}

export function CookieSettingsLink() {
  return (
    <button type="button" className="hover:text-white" onClick={() => window.dispatchEvent(new Event("cl-open-cookie-settings"))}>
      Cookie Settings
    </button>
  );
}
