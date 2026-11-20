"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown, MapPin, Package } from "lucide-react";
import { formatUSD } from "@/lib/settings";
import { longDate } from "./Calendar";
import type { Details, SelectedSlot } from "./types";

export function Summary({
  packageName,
  totalCents,
  depositCents,
  slot,
  address,
  quoteFlow,
}: {
  packageName: string;
  totalCents: number | null;
  depositCents: number;
  slot: SelectedSlot | null;
  address: Details["address"];
  quoteFlow?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const hasAddress = address.line1 && address.city && address.zip;
  const remaining = totalCents != null ? Math.max(0, totalCents - depositCents) : null;

  const body = (
    <div className="space-y-4 text-sm">
      <Row Icon={Package} label="Package" value={packageName} />
      {!quoteFlow && <Row Icon={CalendarDays} label="Date & time" value={slot ? `${longDate(slot.date)} · ${slot.label} ET` : "Not selected yet"} muted={!slot} />}
      <Row
        Icon={MapPin}
        label="Shoot address"
        value={hasAddress ? `${address.line1}${address.line2 ? `, ${address.line2}` : ""}, ${address.city}, ${address.state} ${address.zip}` : "Not entered yet"}
        muted={!hasAddress}
      />
      {!quoteFlow && totalCents != null && (
        <dl className="space-y-2 border-t border-line pt-4">
          <div className="flex justify-between">
            <dt className="text-mist">Service price</dt>
            <dd className="font-semibold">{formatUSD(totalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-bold">Deposit due today</dt>
            <dd className="font-extrabold text-accent">{formatUSD(depositCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-mist">Remaining balance</dt>
            <dd className="font-semibold">{formatUSD(remaining ?? 0)}</dd>
          </div>
          <p className="pt-1 text-xs text-mist">Deposit is credited toward your total — not an extra fee.</p>
        </dl>
      )}
      {quoteFlow && <p className="border-t border-line pt-4 text-xs text-mist">No payment today. You&apos;ll receive a quote before any deposit is collected.</p>}
    </div>
  );

  return (
    <aside className="order-first lg:sticky lg:top-28 lg:order-none" aria-label="Booking summary">
      {/* Mobile: collapsible */}
      <div className="card overflow-hidden lg:hidden">
        <button type="button" className="flex w-full items-center justify-between p-4 text-left" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span>
            <span className="block text-xs font-bold uppercase tracking-[0.18em] text-mist">Your booking</span>
            <span className="block font-bold">
              {packageName}
              {!quoteFlow && totalCents != null && <span className="text-accent"> · {formatUSD(depositCents)} today</span>}
            </span>
          </span>
          <ChevronDown className={`size-5 text-accent transition ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
        {open && <div className="border-t border-line p-4">{body}</div>}
      </div>
      {/* Desktop */}
      <div className="card hidden p-6 lg:block">
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-mist">Booking summary</p>
        {body}
      </div>
    </aside>
  );
}

function Row({ Icon, label, value, muted }: { Icon: typeof Package; label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-mist">{label}</p>
        <p className={`font-semibold ${muted ? "text-white/40" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
