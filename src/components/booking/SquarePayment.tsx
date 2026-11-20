"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import { formatUSD } from "@/lib/settings";
import type { Details, Hold } from "./types";

// Square Web Payments SDK. Card fields are rendered in Square-hosted iframes —
// raw card numbers never touch our page's JS or our servers.

const SDK = { sandbox: "https://sandbox.web.squarecdn.com/v1/square.js", production: "https://web.squarecdn.com/v1/square.js" };

let sdkPromise: Promise<void> | null = null;
function loadSdk(env: "sandbox" | "production") {
  if ((window as any).Square) return Promise.resolve();
  sdkPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SDK[env];
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      sdkPromise = null;
      reject(new Error("Square failed to load"));
    };
    document.head.appendChild(s);
  });
  return sdkPromise;
}

export function SquarePayment({
  square,
  hold,
  details,
  onResult,
}: {
  square: { appId: string; locationId: string; env: "sandbox" | "production" };
  hold: Hold;
  details: Details;
  onResult: (r: { status: "confirmed" | "processing" | "needs_rescheduling" } | { status: "expired"; message: string }) => void;
}) {
  const cardRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerId = "sq-card-container";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadSdk(square.env);
        const payments = (window as any).Square.payments(square.appId, square.locationId);
        const card = await payments.card({
          style: {
            // Square draws the card field on white, so use dark text.
            input: { color: "#06111B", fontSize: "16px", fontFamily: "helvetica neue, sans-serif" },
            "input::placeholder": { color: "#5B6F80" },
            ".input-container": { borderColor: "#2a4257", borderRadius: "12px" },
            ".input-container.is-focus": { borderColor: "#20B8FF" },
            ".input-container.is-error": { borderColor: "#ff6b6b" },
            ".message-text": { color: "#A9BAC8" },
            ".message-icon": { color: "#A9BAC8" },
            ".message-text.is-error": { color: "#ff6b6b" },
          },
        });
        if (cancelled) return card.destroy();
        await card.attach(`#${containerId}`);
        cardRef.current = card;
        setReady(true);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("We couldn't load the secure payment form. Please refresh the page and try again.");
      }
    })();
    return () => {
      cancelled = true;
      cardRef.current?.destroy?.();
      cardRef.current = null;
    };
  }, [square.appId, square.locationId, square.env]);

  async function pay() {
    if (!cardRef.current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const [given, ...rest] = details.contact.name.trim().split(/\s+/);
      const result = await cardRef.current.tokenize({
        amount: (hold.depositCents / 100).toFixed(2),
        currencyCode: "USD",
        intent: "CHARGE",
        customerInitiated: true,
        sellerKeyedIn: false,
        billingContact: {
          givenName: given,
          familyName: rest.join(" "),
          email: details.contact.email,
          phone: details.contact.phone.replace(/\D/g, ""),
          countryCode: "US",
        },
      });
      if (result.status !== "OK") {
        setError(result.errors?.[0]?.message ?? "Please check your card details.");
        setBusy(false);
        return;
      }
      const res = await fetch("/api/payments/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: hold.reference,
          token: hold.token,
          sourceId: result.token,
          verificationToken: result.verificationToken,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onResult({ status: data.status === "confirmed" ? "confirmed" : data.status === "needs_rescheduling" ? "needs_rescheduling" : "processing" });
        return;
      }
      if (data.code === "hold_expired") {
        onResult({ status: "expired", message: data.error });
        return;
      }
      setError(data.error ?? "Payment failed. Your card was not charged.");
    } catch (e) {
      console.error(e);
      setError("Something went wrong while processing your payment. If you were charged, we'll confirm by email — otherwise please try again.");
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 font-bold">
          <CreditCard className="size-5 text-accent" aria-hidden /> Card details
        </p>
        <p className="flex items-center gap-1.5 text-xs text-mist">
          <Lock className="size-3.5" aria-hidden /> Secured by Square
        </p>
      </div>
      {square.env === "sandbox" && (
        <p className="mb-3 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">
          Test mode (Square sandbox) — use test card 4111 1111 1111 1111. No real charge is made.
        </p>
      )}
      <div className="min-h-[96px] rounded-xl bg-ink/40 p-1">
        <div id={containerId} />
        {!ready && !error && (
          <div className="flex h-[90px] items-center justify-center text-mist">
            <Loader2 className="size-5 animate-spin" aria-label="Loading secure payment form" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-3 rounded-lg bg-danger/10 p-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <button type="button" onClick={pay} disabled={!ready || busy} className="btn btn-primary mt-5 min-h-14 w-full text-base">
        {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Lock className="size-4" aria-hidden />}
        {busy ? "Processing securely…" : `Pay ${formatUSD(hold.depositCents)} deposit & confirm`}
      </button>
      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-mist">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        Your card is processed by Square and never stored on our servers. Your booking is confirmed only after the deposit is approved.
      </p>
    </div>
  );
}
