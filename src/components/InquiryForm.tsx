"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { CircleCheck, Loader2, Send } from "lucide-react";
import { fieldErrors, INQUIRY_PACKAGES, inquiryRequestSchema } from "@/lib/validation";
import { getAttribution, track } from "@/lib/analytics";
import { inquiry } from "@/content/site";
import { PREFILL_EVENT, type PrefillDetail } from "./Prefill";
import { ProjectFields } from "./booking/ProjectFields";
import { ErrorText, Input, Label } from "./booking/fields";
import { emptyProject, type ProjectDetails } from "./booking/types";

const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void };
  }
}

const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

/**
 * Inquiry form (no payment). Saves an inquiry to admin → Quotes, where it's priced and the customer
 * gets a booking link. Prefilled from industry tiles / package CTAs / ?industry=&package=.
 * Spam protection: honeypot, time-trap, rate limit, optional Turnstile.
 */
export function InquiryForm() {
  const [contact, setContact] = useState({ name: "", email: "", phone: "", businessName: "" });
  const [pkg, setPkg] = useState("");
  const [city, setCity] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [project, setProject] = useState<ProjectDetails>(emptyProject);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const startedAt = useRef(Date.now());
  const honeypot = useRef<HTMLInputElement>(null);
  const tsRef = useRef<HTMLDivElement>(null);
  const tsToken = useRef<string>("");

  useEffect(() => {
    startedAt.current = Date.now();
    const valid = (list: readonly { value: string }[], v?: string | null) => (v && list.some((o) => o.value === v) ? v : undefined);
    const apply = (d: PrefillDetail) => {
      const ind = valid(inquiry.filming, d.industry);
      const p = valid(inquiry.packages, d.package);
      if (ind) setProject((pr) => ({ ...pr, industry: ind }));
      if (p) setPkg(p);
    };
    const sp = new URLSearchParams(window.location.search);
    if (sp.has("industry") || sp.has("package")) apply({ industry: sp.get("industry") ?? undefined, package: sp.get("package") ?? undefined });
    const onPrefill = (e: Event) => apply((e as CustomEvent<PrefillDetail>).detail ?? {});
    window.addEventListener(PREFILL_EVENT, onPrefill);
    return () => window.removeEventListener(PREFILL_EVENT, onPrefill);
  }, []);

  const renderTurnstile = () => {
    if (TURNSTILE_KEY && tsRef.current && window.turnstile && !tsRef.current.hasChildNodes()) {
      window.turnstile.render(tsRef.current, { sitekey: TURNSTILE_KEY, theme: "dark", callback: (t: string) => (tsToken.current = t) });
    }
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = {
      contact,
      package: pkg,
      location: { city, state: "NY" },
      preferredDate,
      project,
      attribution: getAttribution(),
      website: honeypot.current?.value ?? "",
      startedAt: startedAt.current,
      turnstileToken: tsToken.current || undefined,
    };
    const parsed = inquiryRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }
    setErrors({});
    setState("sending");
    try {
      const res = await fetch("/api/bookings/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.fields ?? {});
        setMessage(data.error ?? "Something went wrong.");
        setState("error");
        return;
      }
      track("Lead", { content_name: pkg, content_category: project.industry });
      setReference(data.reference ?? "");
      setState("sent");
    } catch {
      setMessage("Network error — please try again.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="flex flex-col items-center py-10 text-center" role="status">
        <CircleCheck className="size-12 text-success" aria-hidden />
        <p className="mt-4 text-2xl font-bold">Inquiry sent!</p>
        <p className="mt-2 text-mist">
          We&apos;ll reply with a plan and a quote, usually within one business day. No payment has been taken.
          {reference && <span className="mt-2 block font-mono text-sm text-white/70">Reference {reference}</span>}
        </p>
      </div>
    );
  }

  const setC = (patch: Partial<typeof contact>) => setContact((c) => ({ ...c, ...patch }));
  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Name" id="contact.name" required autoComplete="name" value={contact.name} onChange={(v) => setC({ name: v })} error={errors["contact.name"]} />
        <Input label="Email" id="contact.email" type="email" required autoComplete="email" inputMode="email" value={contact.email} onChange={(v) => setC({ email: v })} error={errors["contact.email"]} />
        <Input label="Phone" id="contact.phone" type="tel" required autoComplete="tel" inputMode="tel" value={contact.phone} onChange={(v) => setC({ phone: v })} error={errors["contact.phone"]} />
        <Input label="Business or brand name" id="contact.businessName" optional autoComplete="organization" value={contact.businessName} onChange={(v) => setC({ businessName: v })} />
        <div className="sm:col-span-2">
          <Label htmlFor="package" required>
            Package
          </Label>
          <select
            id="package"
            className="field"
            value={pkg}
            onChange={(e) => setPkg(e.target.value)}
            aria-invalid={Boolean(errors.package)}
            aria-describedby={errors.package ? "package-err" : undefined}
          >
            <option value="">Select…</option>
            {inquiry.packages
              .filter((o) => (INQUIRY_PACKAGES as readonly string[]).includes(o.value))
              .map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
          </select>
          <ErrorText id="package" error={errors.package} />
        </div>
        <Input label="City or town" id="location.city" required autoComplete="address-level2" value={city} onChange={setCity} error={errors["location.city"]} />
        <Input label="Preferred date" id="preferredDate" type="date" required min={todayISO()} value={preferredDate} onChange={setPreferredDate} error={errors.preferredDate} />
      </div>

      <ProjectFields value={project} onChange={(patch) => setProject((p) => ({ ...p, ...patch }))} errors={errors} />

      {/* Honeypot — hidden from people, tempting for bots */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {TURNSTILE_KEY && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" onLoad={renderTurnstile} />
          <div ref={tsRef} />
        </>
      )}
      {state === "error" && (
        <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger" role="alert">
          {message}
        </p>
      )}
      <button type="submit" className="btn btn-ghost min-h-13 w-full text-base" disabled={state === "sending"}>
        {state === "sending" ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        {state === "sending" ? "Sending…" : "Send inquiry"}
      </button>
      <p className="text-center text-xs text-mist">No payment today. We&apos;ll reply with a plan and a quote.</p>
    </form>
  );
}
