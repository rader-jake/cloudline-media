"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { CircleCheck, Loader2, Mail, Phone, Send } from "lucide-react";
import { contactFormSchema, fieldErrors } from "@/lib/validation";
import { track } from "@/lib/analytics";
import { Reveal } from "./Reveal";

const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void };
  }
}

export function ContactSection({ email, phone }: { email: string; phone: string }) {
  return (
    <section id="contact" className="scroll-mt-20 bg-gradient-to-b from-ink to-ink-2 py-20 md:py-28">
      <div className="container-x grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <Reveal>
          <p className="eyebrow">Contact</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Custom Project? Let&apos;s Talk.</h2>
          <p className="mt-4 text-lg leading-relaxed text-mist">
            Multi-day construction coverage, interior FPV, commercial properties or anything else — tell us about it and we&apos;ll reply with
            options and a quote.
          </p>
          <ul className="mt-8 space-y-4">
            {email && (
              <li>
                <a href={`mailto:${email}`} className="flex items-center gap-3 font-semibold hover:text-accent">
                  <span className="grid size-11 place-items-center rounded-xl border border-line bg-panel">
                    <Mail className="size-5 text-accent" aria-hidden />
                  </span>
                  {email}
                </a>
              </li>
            )}
            {phone && (
              <li>
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-3 font-semibold hover:text-accent">
                  <span className="grid size-11 place-items-center rounded-xl border border-line bg-panel">
                    <Phone className="size-5 text-accent" aria-hidden />
                  </span>
                  {phone}
                </a>
              </li>
            )}
          </ul>
        </Reveal>
        <Reveal delay={120}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}

function ContactForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const startedAt = useRef(Date.now());
  const tsRef = useRef<HTMLDivElement>(null);
  const tsToken = useRef<string>("");

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const renderTurnstile = () => {
    if (TURNSTILE_KEY && tsRef.current && window.turnstile && !tsRef.current.hasChildNodes()) {
      window.turnstile.render(tsRef.current, { sitekey: TURNSTILE_KEY, theme: "dark", callback: (t: string) => (tsToken.current = t) });
    }
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      service: String(fd.get("service") ?? ""),
      message: String(fd.get("message") ?? ""),
      website: String(fd.get("website") ?? ""),
      startedAt: startedAt.current,
      turnstileToken: tsToken.current || undefined,
    };
    const parsed = contactFormSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setState("sending");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.fields ?? {});
        setMessage(data.error ?? "Something went wrong.");
        setState("error");
        return;
      }
      track("Contact");
      setState("sent");
    } catch {
      setMessage("Network error — please try again.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="card flex flex-col items-center p-10 text-center" role="status">
        <CircleCheck className="size-12 text-success" aria-hidden />
        <p className="mt-4 text-2xl font-bold">Message sent!</p>
        <p className="mt-2 text-mist">Thanks for reaching out — we&apos;ll get back to you within one business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-4 p-6 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" autoComplete="name" required error={errors.name} />
        <Field label="Email" name="email" type="email" autoComplete="email" required error={errors.email} />
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" error={errors.phone} />
        <div>
          <label htmlFor="service" className="mb-1.5 block text-sm font-semibold">
            Service
          </label>
          <select id="service" name="service" className="field" defaultValue="">
            <option value="">Select a service…</option>
            <option>Aerial Job Time-Lapse</option>
            <option>Real Estate Aerial Tour</option>
            <option>Interior FPV Fly-Through</option>
            <option>Extended / multi-day construction coverage</option>
            <option>Something else</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-semibold">
          Message <span className="text-accent">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          className="field resize-y"
          placeholder="Tell us about your project, location and timeline."
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-err" : undefined}
        />
        {errors.message && (
          <p id="message-err" className="mt-1 text-sm text-danger">
            {errors.message}
          </p>
        )}
      </div>
      {/* Honeypot — hidden from people, tempting for bots */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
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
      <button type="submit" className="btn btn-primary min-h-13 w-full text-base" disabled={state === "sending"}>
        {state === "sending" ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        {state === "sending" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

function Field({ label, name, error, required, ...rest }: { label: string; name: string; error?: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <input id={name} name={name} className="field" aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-err` : undefined} {...rest} />
      {error && (
        <p id={`${name}-err`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
