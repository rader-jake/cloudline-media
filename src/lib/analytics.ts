"use client";

// Meta Pixel + attribution helpers (browser only).
// The Pixel only loads after the visitor accepts marketing cookies.

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
    _fbq?: unknown;
  }
}

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
const CONSENT_KEY = "cl_consent_v1";
const ATTR_KEY = "cl_attribution_v1";

export type Consent = "granted" | "denied" | null;

export function getConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}
export function setConsent(v: "granted" | "denied") {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {}
  window.dispatchEvent(new CustomEvent("cl-consent", { detail: v }));
}

export function loadPixel() {
  if (!PIXEL_ID || typeof window === "undefined" || window.fbq) return;
  /* eslint-disable */
  (function (f: any, b: Document, e: string, v: string) {
    const n: any = (f.fbq = function (...args: unknown[]) {
      n.callMethod ? n.callMethod(...args) : n.queue.push(args);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode!.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  window.fbq!("init", PIXEL_ID);
  window.fbq!("track", "PageView");
}

type MetaEvent = "ViewContent" | "InitiateCheckout" | "AddPaymentInfo" | "Purchase" | "Lead" | "Contact";

/** Fire a Pixel event (no-op without consent / Pixel ID). */
export function track(event: MetaEvent, params?: Record<string, unknown>, eventId?: string) {
  if (getConsent() !== "granted" || !window.fbq) return;
  window.fbq("track", event, params ?? {}, eventId ? { eventID: eventId } : undefined);
}

/** Track once per page view per key. */
const fired = new Set<string>();
export function trackOnce(key: string, event: MetaEvent, params?: Record<string, unknown>, eventId?: string) {
  if (fired.has(key)) return;
  fired.add(key);
  track(event, params, eventId);
}

/* ── UTM / click-id capture (first touch, 30 days) ─────────────── */

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"];

export function captureAttribution() {
  try {
    const params = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    UTM_KEYS.forEach((k) => {
      const v = params.get(k);
      if (v) found[k] = v.slice(0, 300);
    });
    const existing = JSON.parse(localStorage.getItem(ATTR_KEY) ?? "null") as { at: number; data: Record<string, string> } | null;
    const fresh = existing && Date.now() - existing.at < 30 * 86400_000;
    if (Object.keys(found).length && !fresh) {
      found.landing_page = window.location.pathname;
      if (document.referrer) found.referrer = document.referrer.slice(0, 300);
      localStorage.setItem(ATTR_KEY, JSON.stringify({ at: Date.now(), data: found }));
    }
    // fbc cookie from fbclid (Meta format) when consent is granted
    if (found.fbclid && getConsent() === "granted" && !readCookie("_fbc")) {
      document.cookie = `_fbc=fb.1.${Date.now()}.${found.fbclid}; path=/; max-age=${90 * 86400}; SameSite=Lax`;
    }
  } catch {}
}

export function getAttribution() {
  let utm: Record<string, string> = {};
  try {
    utm = (JSON.parse(localStorage.getItem(ATTR_KEY) ?? "null")?.data as Record<string, string>) ?? {};
  } catch {}
  const consent = getConsent() === "granted";
  return {
    utm,
    fbp: consent ? readCookie("_fbp") ?? undefined : undefined,
    fbc: consent ? readCookie("_fbc") ?? undefined : undefined,
    consent,
  };
}

function readCookie(name: string) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}
