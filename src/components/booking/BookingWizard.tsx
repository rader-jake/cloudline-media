"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleCheck, Clock, HardHat, House, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { Calendar } from "./Calendar";
import { DetailsForm } from "./DetailsForm";
import { SquarePayment } from "./SquarePayment";
import { Summary } from "./Summary";
import { emptyDetails, type Details, type Hold, type QuoteContext, type SelectedSlot, type WizardConfig } from "./types";
import { addressSchema, contactDetailsSchema, fieldErrors, projectSchema } from "@/lib/validation";
import { formatUSD, type ServiceKey } from "@/lib/settings";
import { getAttribution, track, trackOnce } from "@/lib/analytics";
import { z } from "zod";

type Step = "service" | "schedule" | "details" | "payment" | "quote" | "quote_sent";

const BOOK_STEPS: { key: Step; label: string }[] = [
  { key: "service", label: "Package" },
  { key: "schedule", label: "Date & Time" },
  { key: "details", label: "Details" },
  { key: "payment", label: "Deposit" },
];

const detailsSchema = z.object({ contact: contactDetailsSchema, address: addressSchema, project: projectSchema });

export function BookingWizard({ config }: { config: WizardConfig }) {
  const router = useRouter();
  const { settings } = config;
  const [service, setService] = useState<ServiceKey | null>(config.initialService);
  const [step, setStep] = useState<Step>(() => (config.initialService === "fpv" ? (config.quote ? "schedule" : "quote") : config.initialService ? "schedule" : "service"));
  const [slot, setSlot] = useState<SelectedSlot | null>(null);
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [hold, setHold] = useState<Hold | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [quoteCtx, setQuoteCtx] = useState<QuoteContext | null>(null);
  const [quoteState, setQuoteState] = useState<"loading" | "ok" | "invalid" | null>(config.quote ? "loading" : null);
  const [preferredDates, setPreferredDates] = useState("");
  const topRef = useRef<HTMLDivElement>(null);

  const svc = service ? settings.services[service] : null;
  const totalCents = quoteCtx?.totalCents ?? svc?.priceCents ?? null;

  /* ── Quote links: load the priced quote + prefill ────────────── */
  useEffect(() => {
    if (!config.quote) return;
    (async () => {
      try {
        const res = await fetch(`/api/bookings/${encodeURIComponent(config.quote!.reference)}?t=${encodeURIComponent(config.quote!.token)}`);
        const data = await res.json();
        if (!res.ok) return setQuoteState("invalid");
        if (data.booking.depositStatus === "paid") {
          router.replace(`/book/confirmed?ref=${config.quote!.reference}&t=${config.quote!.token}`);
          return;
        }
        if (!data.booking.quotedTotalCents || !data.prefill) return setQuoteState("invalid");
        setQuoteCtx({ reference: data.booking.reference, token: config.quote!.token, totalCents: data.booking.quotedTotalCents, packageName: data.booking.packageName });
        setDetails((d) => ({ ...d, ...data.prefill, address: { ...d.address, ...data.prefill.address }, project: { ...d.project, ...data.prefill.project } }));
        setQuoteState("ok");
      } catch {
        setQuoteState("invalid");
      }
    })();
  }, [config.quote, router]);

  /* ── Analytics ───────────────────────────────────────────────── */
  useEffect(() => {
    if (service && service !== "fpv") {
      trackOnce("initiate", "InitiateCheckout", { content_ids: [service], content_name: settings.services[service].name, value: settings.depositCents / 100, currency: "USD", num_items: 1 });
    }
  }, [service, settings]);
  useEffect(() => {
    if (step === "payment") trackOnce("addpayment", "AddPaymentInfo", { content_ids: [service], value: settings.depositCents / 100, currency: "USD" });
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step, service, settings.depositCents]);

  /* ── Navigation ──────────────────────────────────────────────── */
  const chooseService = (s: ServiceKey) => {
    setService(s);
    setSlot(null);
    setStep(s === "fpv" ? "quote" : "schedule");
  };

  const validateDetails = useCallback(() => {
    const parsed = detailsSchema.safeParse(details);
    const errs = parsed.success ? {} : fieldErrors(parsed.error);
    if (service === "timelapse" && !details.project.description.trim()) errs["project.description"] = "Briefly describe the work we're filming";
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = document.getElementById(Object.keys(errs)[0]);
      first?.focus();
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return null;
    }
    return parsed.success ? parsed.data : null;
  }, [details, service]);

  async function createHold() {
    if (!service || !slot) return;
    const data = validateDetails();
    if (!data) return;
    if (!policyAccepted) {
      setErrors({ policy: "Please review and agree to the deposit policy to continue." });
      document.getElementById("policy")?.focus();
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service,
          start: slot.start,
          contact: data.contact,
          address: data.address,
          project: data.project,
          policyAccepted: true,
          quote: quoteCtx ? { reference: quoteCtx.reference, token: quoteCtx.token } : undefined,
          replaceHold: hold ? { reference: hold.reference, token: hold.token } : undefined,
          attribution: getAttribution(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.fields) setErrors(json.fields);
        if (json.code === "slot_unavailable") {
          setSlot(null);
          setStep("schedule");
        }
        setBanner(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setHold(json);
      setStep("payment");
    } catch {
      setBanner("Network error — please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitQuote() {
    const data = validateDetails();
    if (!data) return;
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch("/api/bookings/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, preferredDates, attribution: getAttribution() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.fields) setErrors(json.fields);
        setBanner(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      track("Lead", { content_name: "Interior FPV quote" });
      setStep("quote_sent");
    } catch {
      setBanner("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  const onPaymentResult = (r: Parameters<React.ComponentProps<typeof SquarePayment>["onResult"]>[0]) => {
    if (r.status === "expired") {
      setHold(null);
      setSlot(null);
      setStep("schedule");
      setBanner(r.message);
      return;
    }
    router.push(`/book/confirmed?ref=${hold!.reference}&t=${hold!.token}`);
  };

  /* ── Render ──────────────────────────────────────────────────── */
  const stepIndex = BOOK_STEPS.findIndex((s) => s.key === step);
  const isQuoteFlow = step === "quote" || step === "quote_sent";
  const outsideArea = useMemo(() => {
    const zip = details.address.zip.trim();
    return zip.length >= 5 && settings.serviceArea.zipPrefixes.length > 0 && !settings.serviceArea.zipPrefixes.includes(zip.slice(0, 3));
  }, [details.address.zip, settings.serviceArea.zipPrefixes]);

  if (quoteState === "loading") {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="size-8 animate-spin text-accent" aria-label="Loading your quote" />
      </div>
    );
  }
  if (quoteState === "invalid") {
    return (
      <div className="container-x max-w-xl py-16 text-center">
        <TriangleAlert className="mx-auto size-10 text-warn" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">This quote link isn&apos;t valid anymore</h1>
        <p className="mt-2 text-mist">It may have already been used or replaced. Please contact us and we&apos;ll send a fresh link.</p>
        <Link href="/#contact" className="btn btn-primary mt-6">
          Contact us
        </Link>
      </div>
    );
  }

  return (
    <div ref={topRef} className="container-x scroll-mt-24">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 md:mb-8">
          <p className="eyebrow">{isQuoteFlow ? "Request a quote" : "Book a shoot"}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
            {step === "service" && "Choose your package"}
            {step === "schedule" && "Pick a date & time"}
            {step === "details" && "Where & what are we filming?"}
            {step === "payment" && "Secure your booking"}
            {step === "quote" && "Interior FPV fly-through quote"}
            {step === "quote_sent" && "Quote request received"}
          </h1>
          {!isQuoteFlow && (
            <ol className="mt-5 grid grid-cols-4 gap-2" aria-label="Booking progress">
              {BOOK_STEPS.map((s, i) => (
                <li key={s.key} aria-current={i === stepIndex ? "step" : undefined}>
                  <div className={`h-1.5 rounded-full transition-colors ${i <= stepIndex ? "bg-accent" : "bg-white/10"}`} />
                  <p className={`mt-2 hidden text-xs font-semibold sm:block ${i === stepIndex ? "text-white" : "text-mist"}`}>
                    {i + 1}. {s.label}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </header>

        {banner && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-warn/30 bg-warn/10 p-4 text-sm text-warn" role="alert">
            <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden /> {banner}
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
          <div className="card min-w-0 p-5 md:p-8">
            {step === "service" && <ServiceStep settings={settings} selected={service} onSelect={chooseService} />}

            {step === "schedule" && service && (
              <>
                <Calendar service={service} quote={quoteCtx ? { reference: quoteCtx.reference, token: quoteCtx.token } : null} value={slot} onChange={setSlot} contactEmail={settings.contact.email} />
                <StepNav
                  onBack={quoteCtx ? undefined : () => setStep("service")}
                  backLabel="Change package"
                  onNext={() => slot && setStep("details")}
                  nextLabel={slot ? `Continue with ${slot.label}` : "Select a time to continue"}
                  nextDisabled={!slot}
                />
              </>
            )}

            {step === "details" && service && (
              <>
                <DetailsForm value={details} onChange={setDetails} errors={errors} service={service} googleMapsKey={config.googleMapsKey} />
                {outsideArea && (
                  <p className="mt-6 flex gap-2 rounded-xl border border-warn/30 bg-warn/10 p-4 text-sm text-warn">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {settings.serviceArea.outsideAreaBehavior === "block"
                      ? `This ZIP is outside our online booking area (${settings.serviceArea.label}). Please contact us for a custom quote.`
                      : `This address may be outside our usual service area (${settings.serviceArea.label}). A travel fee may apply — we'll confirm with you.`}
                  </p>
                )}
                <PolicyBox
                  text={settings.policy.text}
                  depositCents={settings.depositCents}
                  checked={policyAccepted}
                  onChange={(v) => {
                    setPolicyAccepted(v);
                    if (v) setErrors(({ policy: _p, ...rest }) => rest);
                  }}
                  error={errors.policy}
                />
                {!config.ready.payments && (
                  <p className="mt-4 rounded-xl border border-warn/30 bg-warn/10 p-4 text-sm text-warn">
                    Online deposits aren&apos;t enabled yet. Please contact us{settings.contact.email ? ` at ${settings.contact.email}` : ""} to book.
                  </p>
                )}
                <StepNav
                  onBack={() => setStep("schedule")}
                  backLabel="Change time"
                  onNext={createHold}
                  nextLabel={`Continue to ${formatUSD(settings.depositCents)} deposit`}
                  busy={busy}
                  nextDisabled={!config.ready.payments}
                />
              </>
            )}

            {step === "payment" && hold && (
              <>
                <HoldTimer expiresAt={hold.holdExpiresAt} onExpire={() => onPaymentResult({ status: "expired", message: "Your reserved time expired. Please choose your time again." })} />
                <div className="mt-6 grid gap-6">
                  <PaymentBreakdown total={hold.totalCents} deposit={hold.depositCents} remaining={hold.remainingCents} />
                  <SquarePayment square={config.square} hold={hold} details={details} onResult={onPaymentResult} />
                </div>
                <div className="mt-6 border-t border-line pt-5">
                  <button type="button" onClick={() => setStep("details")} className="inline-flex items-center gap-2 text-sm font-semibold text-mist hover:text-white">
                    <ArrowLeft className="size-4" aria-hidden /> Edit details
                  </button>
                </div>
              </>
            )}

            {step === "quote" && (
              <>
                <div className="mb-8 rounded-xl border border-accent/25 bg-accent/5 p-4 text-sm leading-relaxed text-white/85">
                  <p className="flex items-center gap-2 font-bold text-white">
                    <Sparkles className="size-4 text-accent" aria-hidden /> How FPV quotes work
                  </p>
                  <p className="mt-1">
                    Interior fly-throughs are priced by property size and layout. Send us the details below — no payment today. We&apos;ll email your quote with a
                    link to pick a date and pay the {formatUSD(settings.depositCents)} deposit, which is credited to your total.
                  </p>
                </div>
                <DetailsForm value={details} onChange={setDetails} errors={errors} service="fpv" googleMapsKey={config.googleMapsKey} />
                <div className="mt-6">
                  <label htmlFor="preferredDates" className="mb-1.5 block text-sm font-semibold">
                    Preferred dates <span className="font-normal text-mist">(optional)</span>
                  </label>
                  <input id="preferredDates" className="field" placeholder="e.g. Weekday mornings the week of Dec 8" value={preferredDates} onChange={(e) => setPreferredDates(e.target.value)} />
                </div>
                <StepNav onBack={() => setStep("service")} backLabel="Change package" onNext={submitQuote} nextLabel="Request my quote" busy={busy} />
              </>
            )}

            {step === "quote_sent" && (
              <div className="py-8 text-center">
                <CircleCheck className="mx-auto size-14 text-success" aria-hidden />
                <p className="mt-4 text-2xl font-bold">Thanks — we&apos;ll be in touch soon.</p>
                <p className="mx-auto mt-2 max-w-md text-mist">
                  We&apos;ll review your property details and email a custom quote to <span className="text-white">{details.contact.email}</span>, usually within
                  one business day. No payment has been taken.
                </p>
                <Link href="/" className="btn btn-ghost mt-8">
                  Back to home
                </Link>
              </div>
            )}
          </div>

          {step !== "service" && step !== "quote_sent" && service && (
            <Summary
              packageName={quoteCtx?.packageName ?? svc?.name ?? ""}
              totalCents={totalCents}
              depositCents={settings.depositCents}
              slot={slot}
              address={details.address}
              quoteFlow={step === "quote"}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Sub-components ─────────────────────────── */

function ServiceStep({ settings, selected, onSelect }: { settings: WizardConfig["settings"]; selected: ServiceKey | null; onSelect: (s: ServiceKey) => void }) {
  const options: { key: ServiceKey; Icon: typeof HardHat; blurb: string }[] = [
    { key: "timelapse", Icon: HardHat, blurb: "Up to 2 hours of on-site coverage, edited into a 20–45s cinematic time-lapse." },
    { key: "realestate", Icon: House, blurb: "Exterior aerial tour with a 30–60s edited video + vertical social cut." },
    { key: "fpv", Icon: Sparkles, blurb: "Immersive indoor drone fly-through. Priced per property — request a quote." },
  ];
  return (
    <div className="grid gap-3" role="radiogroup" aria-label="Packages">
      {options
        .filter((o) => settings.services[o.key].active)
        .map(({ key, Icon, blurb }) => {
          const s = settings.services[key];
          const sel = selected === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={sel}
              onClick={() => onSelect(key)}
              className={`group flex items-center gap-4 rounded-2xl border p-4 text-left sm:p-5 transition ${sel ? "border-accent bg-accent/10" : "border-line bg-ink/30 hover:border-accent/60"}`}
            >
              <span className="grid size-10 shrink-0 place-items-center self-start rounded-xl bg-accent/10 sm:size-12 sm:self-center">
                <Icon className="size-5 text-accent sm:size-6" strokeWidth={1.6} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold leading-snug">{s.name}</span>
                <span className="mt-0.5 block text-sm text-mist">{blurb}</span>
                <span className="mt-2 block sm:hidden">{s.priceCents != null && s.selfBookable ? (
                  <>
                    <span className="text-xs text-mist sm:block">Starting at </span>
                    <span className="text-lg font-extrabold sm:block sm:text-xl">{formatUSD(s.priceCents)}</span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-accent sm:block">Request a Quote</span>
                )}</span>
              </span>
              <span className="hidden shrink-0 text-right sm:block">
                {s.priceCents != null && s.selfBookable ? (
                  <>
                    <span className="text-xs text-mist sm:block">Starting at </span>
                    <span className="text-lg font-extrabold sm:block sm:text-xl">{formatUSD(s.priceCents)}</span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-accent sm:block">Request a Quote</span>
                )}
              </span>
              <ArrowRight className="hidden size-5 shrink-0 text-accent transition group-hover:translate-x-1 sm:block" aria-hidden />
            </button>
          );
        })}
      <p className="mt-2 text-center text-sm text-mist">A {formatUSD(settings.depositCents)} deposit secures your date and is credited toward your total.</p>
    </div>
  );
}

function StepNav({
  onBack,
  backLabel,
  onNext,
  nextLabel,
  nextDisabled,
  busy,
}: {
  onBack?: () => void;
  backLabel: string;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  busy?: boolean;
}) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
      {onBack ? (
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-mist hover:text-white">
          <ArrowLeft className="size-4" aria-hidden /> {backLabel}
        </button>
      ) : (
        <span />
      )}
      <button type="button" onClick={onNext} disabled={nextDisabled || busy} className="btn btn-primary min-h-13 w-full px-6 text-base sm:w-auto">
        {busy && <Loader2 className="size-5 animate-spin" aria-hidden />}
        {nextLabel} {!busy && <ArrowRight className="size-4" aria-hidden />}
      </button>
    </div>
  );
}

function PolicyBox({ text, depositCents, checked, onChange, error }: { text: string; depositCents: number; checked: boolean; onChange: (v: boolean) => void; error?: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-line bg-ink/40 p-5">
      <p className="font-bold">Deposit &amp; cancellation policy</p>
      <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-mist">{text}</p>
      <label className="mt-4 flex cursor-pointer items-start gap-3">
        <input
          id="policy"
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 accent-[#20B8FF]"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "policy-err" : undefined}
        />
        <span className="text-sm">
          I agree to the deposit &amp; cancellation policy and understand my {formatUSD(depositCents)} deposit is credited toward my total. Shoots are subject to
          weather, location suitability and airspace authorization.
        </span>
      </label>
      {error && (
        <p id="policy-err" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function PaymentBreakdown({ total, deposit, remaining }: { total: number; deposit: number; remaining: number }) {
  return (
    <dl className="divide-y divide-line rounded-2xl border border-line bg-ink/40">
      <div className="flex justify-between p-4">
        <dt className="text-mist">Service price</dt>
        <dd className="font-semibold">{formatUSD(total)}</dd>
      </div>
      <div className="flex justify-between bg-accent/5 p-4">
        <dt className="font-bold">Deposit due today</dt>
        <dd className="text-xl font-extrabold text-accent">{formatUSD(deposit)}</dd>
      </div>
      <div className="flex justify-between p-4">
        <dt className="text-mist">Remaining balance (due after shoot)</dt>
        <dd className="font-semibold">{formatUSD(remaining)}</dd>
      </div>
    </dl>
  );
}

function HoldTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [left, setLeft] = useState(() => new Date(expiresAt).getTime() - Date.now());
  const fired = useRef(false);
  const cb = useRef(onExpire);
  cb.current = onExpire;
  useEffect(() => {
    const id = window.setInterval(() => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setLeft(ms);
      if (ms <= 0 && !fired.current) {
        fired.current = true;
        cb.current();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);
  const m = Math.max(0, Math.floor(left / 60000));
  const s = Math.max(0, Math.floor((left % 60000) / 1000));
  return (
    <p className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${left < 120_000 ? "bg-warn/10 text-warn" : "bg-accent/10 text-accent-soft"}`} role="timer" aria-live="off">
      <Clock className="size-4" aria-hidden />
      We&apos;re holding your time for{" "}
      <strong className="tabular-nums">
        {m}:{String(s).padStart(2, "0")}
      </strong>
    </p>
  );
}

