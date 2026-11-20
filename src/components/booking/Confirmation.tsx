"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, CalendarPlus, CircleCheck, CloudSun, Download, Loader2, MapPin, Package, Receipt, TriangleAlert } from "lucide-react";
import type { PublicBooking } from "@/lib/bookings";
import { formatUSD } from "@/lib/settings";
import { googleCalendarUrl } from "@/lib/ics";
import { track } from "@/lib/analytics";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric", year: "numeric" });
const fmtTime = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });

export function Confirmation({ initial, reference, token }: { initial: PublicBooking | null; reference: string; token: string }) {
  const [b, setB] = useState(initial);
  const [timedOut, setTimedOut] = useState(false);
  const paid = b?.depositStatus === "paid";

  // Poll while Square's webhook finalizes a pending payment
  useEffect(() => {
    if (!b || paid || !["pending_payment"].includes(b.status)) return;
    let n = 0;
    const id = window.setInterval(async () => {
      n++;
      const res = await fetch(`/api/bookings/${encodeURIComponent(reference)}?t=${encodeURIComponent(token)}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setB(data.booking);
        if (data.booking.depositStatus === "paid" || data.booking.depositStatus === "failed") window.clearInterval(id);
      }
      if (n > 30) {
        window.clearInterval(id);
        setTimedOut(true);
      }
    }, 2000);
    return () => window.clearInterval(id);
  }, [b, paid, reference, token]);

  // Meta Purchase — only after server-verified deposit; value = deposit actually collected.
  useEffect(() => {
    if (!b || !paid) return;
    const key = `cl_purchase_${b.id}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {}
    track("Purchase", { value: b.depositCents / 100, currency: "USD", content_ids: [b.packageKey], content_name: b.packageName, content_type: "product" }, `purchase_${b.id}`);
  }, [b, paid]);

  if (!b) {
    return (
      <div className="container-x max-w-xl py-10 text-center">
        <TriangleAlert className="mx-auto size-10 text-warn" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">We couldn&apos;t find that booking</h1>
        <p className="mt-2 text-mist">Check the link in your confirmation email, or contact us and we&apos;ll help.</p>
        <Link href="/" className="btn btn-primary mt-6">
          Back to home
        </Link>
      </div>
    );
  }

  if (!paid) {
    const failed = b.depositStatus === "failed";
    return (
      <div className="container-x max-w-xl py-10 text-center">
        {failed ? <TriangleAlert className="mx-auto size-10 text-danger" aria-hidden /> : <Loader2 className="mx-auto size-10 animate-spin text-accent" aria-hidden />}
        <h1 className="mt-4 text-2xl font-bold">{failed ? "Your payment didn't go through" : timedOut ? "Still confirming your payment…" : "Confirming your payment…"}</h1>
        <p className="mt-2 text-mist">
          {failed
            ? "Your booking isn't confirmed and you haven't been charged. Please try booking again."
            : timedOut
              ? `This is taking longer than usual. We'll email ${b.email} as soon as Square confirms your deposit — no need to pay again.`
              : "This usually takes just a few seconds. Please don't close this page."}
        </p>
        {failed && (
          <Link href={`/book?package=${b.packageKey}`} className="btn btn-primary mt-6">
            Try again
          </Link>
        )}
      </div>
    );
  }

  const needsReschedule = b.status === "needs_rescheduling";
  const cal =
    b.scheduledStart && b.scheduledEnd
      ? {
          uid: b.id,
          title: `Cloudline Media — ${b.packageName}`,
          description: `Booking ${b.reference}. Subject to weather, location suitability and airspace authorization.`,
          location: b.address ?? "",
          start: new Date(b.scheduledStart),
          end: new Date(b.scheduledEnd),
        }
      : null;

  return (
    <div className="container-x max-w-3xl">
      <div className="text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-success/10 ring-8 ring-success/5">
          <CircleCheck className="size-11 text-success" aria-hidden />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight md:text-5xl">
          {needsReschedule ? "Deposit received — let's find a new time." : (
            <>
              You&apos;re Booked! <span className="text-accent">Let&apos;s Elevate Your Project.</span>
            </>
          )}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-mist">
          {needsReschedule
            ? "Your deposit went through, but your reserved time was released before it completed. We'll contact you shortly to confirm a new time — your deposit is safe."
            : `Thanks, ${b.customerName.split(" ")[0]}! ${
                b.emailStatus === "sent"
                  ? `A confirmation has been sent to ${b.email}.`
                  : b.emailStatus === "pending"
                    ? `Your confirmation email to ${b.email} is on its way.`
                    : `Please save your booking reference below — we'll follow up at ${b.email}.`
              }`}
        </p>
      </div>

      <div className="card mt-10 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-ink/40 px-6 py-4">
          <p className="text-sm text-mist">Booking reference</p>
          <p className="font-mono text-lg font-bold tracking-wider text-accent">{b.reference}</p>
        </div>
        <dl className="grid gap-6 p-6 sm:grid-cols-2">
          <Item Icon={Package} label="Service" value={b.packageName} />
          <Item Icon={CircleCheck} label="Customer" value={b.customerName} />
          <Item Icon={CalendarDays} label="Shoot date & time" value={b.scheduledStart && !needsReschedule ? `${fmtDate(b.scheduledStart)} at ${fmtTime(b.scheduledStart)} ET` : "To be confirmed"} />
          <Item Icon={MapPin} label="Shoot address" value={b.address ?? ""} />
        </dl>
        <dl className="grid grid-cols-3 divide-x divide-line border-t border-line text-center">
          <div className="p-4">
            <dt className="text-xs text-mist">Service price</dt>
            <dd className="mt-1 font-bold">{formatUSD(b.quotedTotalCents ?? 0)}</dd>
          </div>
          <div className="bg-success/5 p-4">
            <dt className="text-xs text-mist">Deposit paid</dt>
            <dd className="mt-1 font-bold text-success">{formatUSD(b.depositCents)}</dd>
          </div>
          <div className="p-4">
            <dt className="text-xs text-mist">Remaining balance</dt>
            <dd className="mt-1 font-bold">{formatUSD(b.remainingCents)}</dd>
          </div>
        </dl>
      </div>

      {cal && !needsReschedule && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a href={googleCalendarUrl(cal)} target="_blank" rel="noopener noreferrer" className="btn btn-primary flex-1">
            <CalendarPlus className="size-4" aria-hidden /> Add to Google Calendar
          </a>
          <a href={`/api/bookings/${encodeURIComponent(b.reference)}/ics?t=${encodeURIComponent(token)}`} className="btn btn-ghost flex-1">
            <Download className="size-4" aria-hidden /> Apple / Outlook (.ics)
          </a>
          {b.receiptUrl && (
            <a href={b.receiptUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost flex-1">
              <Receipt className="size-4" aria-hidden /> Receipt
            </a>
          )}
        </div>
      )}

      <div className="mt-8 flex gap-3 rounded-2xl border border-line bg-ink/40 p-5 text-sm leading-relaxed text-mist">
        <CloudSun className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
        <p>
          Your booking is subject to weather, location suitability, and any necessary flight authorizations. We check the forecast and airspace before every
          shoot — if conditions aren&apos;t safe or a location can&apos;t be flown, we&apos;ll contact you to reschedule and your deposit carries over.
        </p>
      </div>

      <div className="mt-10 text-center">
        <Link href="/" className="text-sm font-semibold text-accent hover:underline">
          Back to Cloudline Media
        </Link>
      </div>
    </div>
  );
}

function Item({ Icon, label, value }: { Icon: typeof Package; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
      <div>
        <dt className="text-xs text-mist">{label}</dt>
        <dd className="font-semibold">{value}</dd>
      </div>
    </div>
  );
}
