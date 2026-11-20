"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, ExternalLink, Loader2, MapPin, RefreshCw, TriangleAlert, X } from "lucide-react";
import type { BookingRow, BookingStatus } from "@/lib/bookings";
import { formatUSD } from "@/lib/settings";
import { Calendar } from "@/components/booking/Calendar";
import type { SelectedSlot } from "@/components/booking/types";

const SCOPES = [
  { key: "upcoming", label: "Upcoming" },
  { key: "quotes", label: "FPV quotes" },
  { key: "pending", label: "Awaiting payment" },
  { key: "past", label: "Past" },
  { key: "all", label: "All" },
] as const;

export const STATUS_STYLE: Record<BookingStatus, { label: string; cls: string }> = {
  quote_requested: { label: "Quote requested", cls: "bg-purple-500/15 text-purple-300" },
  quote_sent: { label: "Quote sent", cls: "bg-purple-500/15 text-purple-200" },
  pending_payment: { label: "Pending payment", cls: "bg-warn/15 text-warn" },
  confirmed: { label: "Confirmed", cls: "bg-success/15 text-success" },
  needs_rescheduling: { label: "Needs rescheduling", cls: "bg-orange-500/15 text-orange-300" },
  completed: { label: "Completed", cls: "bg-accent/15 text-accent" },
  cancelled: { label: "Cancelled", cls: "bg-danger/15 text-danger" },
  expired: { label: "Expired hold", cls: "bg-white/10 text-white/50" },
};

const dt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

export function AdminBookings() {
  const [scope, setScope] = useState<(typeof SCOPES)[number]["key"]>("upcoming");
  const [rows, setRows] = useState<BookingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BookingRow | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    setError(null);
    const res = await fetch(`/api/admin/bookings?scope=${scope}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? "Failed to load bookings");
    setRows(data.bookings);
  }, [scope]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-extrabold">Bookings</h1>
        <div className="flex gap-2">
          <button onClick={load} className="btn btn-ghost min-h-10 text-sm">
            <RefreshCw className="size-4" /> Refresh
          </button>
          <a href="/api/admin/export" className="btn btn-primary min-h-10 text-sm">
            <Download className="size-4" /> Export CSV
          </a>
        </div>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-line bg-panel/60 p-1" role="tablist">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={scope === s.key}
            onClick={() => setScope(s.key)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${scope === s.key ? "bg-accent text-ink" : "text-white/70 hover:text-white"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {error ? (
          <p className="rounded-xl bg-danger/10 p-4 text-danger">{error}</p>
        ) : !rows ? (
          <div className="grid h-40 place-items-center">
            <Loader2 className="size-6 animate-spin text-accent" />
          </div>
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-line p-10 text-center text-mist">Nothing here yet.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="hidden bg-panel text-xs uppercase tracking-wider text-mist md:table-header-group">
                <tr>
                  <th className="p-3">When (ET)</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Package</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Deposit</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((b) => (
                  <tr key={b.id} onClick={() => setSelected(b)} className="block cursor-pointer p-3 hover:bg-white/5 md:table-row md:p-0">
                    <td className="block font-semibold md:table-cell md:p-3">{b.scheduled_start ? dt(b.scheduled_start) : <span className="text-mist">Not scheduled</span>}</td>
                    <td className="block md:table-cell md:p-3">
                      {b.customer_name}
                      <span className="block text-xs text-mist">{b.reference}</span>
                    </td>
                    <td className="block md:table-cell md:p-3">{b.package_name}</td>
                    <td className="block text-mist md:table-cell md:max-w-[220px] md:truncate md:p-3">
                      {b.outside_service_area && <TriangleAlert className="mr-1 inline size-3.5 text-warn" aria-label="Outside service area" />}
                      {b.city}, {b.state}
                    </td>
                    <td className="block md:table-cell md:p-3">
                      <span className={b.deposit_status === "paid" ? "text-success" : "text-mist"}>
                        {b.deposit_status === "paid" ? `${formatUSD(b.deposit_cents)} paid` : b.deposit_status}
                      </span>
                    </td>
                    <td className="block pt-2 md:table-cell md:p-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <BookingDrawer
          booking={selected}
          onClose={() => setSelected(null)}
          onUpdated={(b) => {
            setSelected(b);
            setRows((r) => r?.map((x) => (x.id === b.id ? b : x)) ?? null);
          }}
        />
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const s = STATUS_STYLE[status];
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>;
}

function BookingDrawer({ booking: b, onClose, onUpdated }: { booking: BookingRow; onClose: () => void; onUpdated: (b: BookingRow) => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [notes, setNotes] = useState(b.admin_notes ?? "");
  const [rescheduling, setRescheduling] = useState(false);
  const [newSlot, setNewSlot] = useState<SelectedSlot | null>(null);
  const [quote, setQuote] = useState({ total: b.quoted_total_cents ? String(b.quoted_total_cents / 100) : "", duration: String(b.duration_minutes ?? 120) });
  const [quoteLink, setQuoteLink] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function patch(body: Record<string, unknown>, success: string) {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/bookings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id, ...body }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error ?? "Update failed" });
    onUpdated(data.booking);
    if (data.link) setQuoteLink(data.link);
    const emailNote = data.emailSent === true ? " Customer emailed." : data.emailSent === false ? " ⚠ Email NOT sent (check Resend setup)." : "";
    setMsg({ ok: true, text: success + emailNote });
    return data;
  }

  const paid = b.deposit_status === "paid";
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address_formatted ?? "")}`;
  const coords = b.address_lat != null && b.address_lng != null ? `${b.address_lat.toFixed(5)}, ${b.address_lng.toFixed(5)}` : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <aside
        className="h-full w-full max-w-xl overflow-y-auto border-l border-line bg-ink-2 p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Booking ${b.reference}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-sm text-accent">{b.reference}</p>
            <h2 className="text-2xl font-bold">{b.customer_name}</h2>
            <div className="mt-2">
              <StatusBadge status={b.status} />
            </div>
          </div>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-lg border border-line" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        {msg && <p className={`mt-4 rounded-lg p-3 text-sm ${msg.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>{msg.text}</p>}

        <Section title="Shoot">
          <Field k="Package" v={b.package_name} />
          <Field k="Date & time (ET)" v={dt(b.scheduled_start)} />
          <Field k="Duration" v={b.duration_minutes ? `${b.duration_minutes} min` : "—"} />
          {b.preferred_dates && <Field k="Preferred dates" v={b.preferred_dates} />}
          <Field k="Address" v={b.address_formatted ?? "—"} />
          <div className="flex flex-wrap gap-3 text-sm">
            <a href={maps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
              <MapPin className="size-3.5" /> Open in Maps
            </a>
            {coords && (
              <button type="button" onClick={() => navigator.clipboard?.writeText(coords)} className="inline-flex items-center gap-1 text-accent hover:underline" title="Copy coordinates for your airspace app (B4UFLY / Aloft)">
                <ExternalLink className="size-3.5" /> Copy coords for airspace check
              </button>
            )}
            <span className={b.address_verified ? "text-success" : "text-mist"}>{b.address_verified ? "✓ Google-verified" : "Manually entered"}</span>
            {b.outside_service_area && <span className="text-warn">⚠ Outside service area</span>}
          </div>
        </Section>

        <Section title="Customer">
          <Field k="Email" v={<a className="text-accent" href={`mailto:${b.email}`}>{b.email}</a>} />
          <Field k="Phone" v={<a className="text-accent" href={`tel:${b.phone.replace(/\D/g, "")}`}>{b.phone}</a>} />
          <Field k="Business" v={b.business_name ?? "—"} />
        </Section>

        <Section title="Project">
          <Field k="Property type" v={b.property_type ?? "—"} />
          <Field k="Description" v={b.project_description ?? "—"} />
          <Field k="Filming requirements" v={b.filming_requirements ?? "—"} />
          <Field k="Special instructions" v={b.special_instructions ?? "—"} />
          <Field k="Access notes" v={b.access_notes ?? "—"} />
          {b.fpv_interest && <Field k="FPV add-on" v="Customer is interested — follow up with a quote" />}
        </Section>

        <Section title="Payment">
          <Field k="Quoted total" v={b.quoted_total_cents != null ? formatUSD(b.quoted_total_cents) : "—"} />
          <Field k="Deposit" v={`${formatUSD(b.deposit_cents)} · ${b.deposit_status}`} />
          <Field k="Remaining" v={b.quoted_total_cents != null ? formatUSD(Math.max(0, b.quoted_total_cents - b.deposit_cents)) : "—"} />
          <Field k="Square payment ID" v={b.square_payment_id ?? "—"} />
          {b.square_receipt_url && (
            <a href={b.square_receipt_url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline">
              View Square receipt
            </a>
          )}
        </Section>

        <Section title="Attribution">
          <Field k="Source" v={[b.utm?.utm_source, b.utm?.utm_medium, b.utm?.utm_campaign].filter(Boolean).join(" / ") || "Direct / unknown"} />
          {b.utm?.utm_content && <Field k="Ad" v={b.utm.utm_content} />}
          <Field k="Created" v={dt(b.created_at)} />
        </Section>

        {/* FPV quote pricing */}
        {b.package === "fpv" && ["quote_requested", "quote_sent"].includes(b.status) && (
          <Section title="Send quote">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Quoted total ($)
                <input className="field mt-1" inputMode="decimal" value={quote.total} onChange={(e) => setQuote({ ...quote, total: e.target.value })} />
              </label>
              <label className="text-sm">
                Shoot duration (min)
                <input className="field mt-1" inputMode="numeric" value={quote.duration} onChange={(e) => setQuote({ ...quote, duration: e.target.value })} />
              </label>
            </div>
            <button
              disabled={busy || !Number(quote.total)}
              className="btn btn-primary mt-3 w-full"
              onClick={() =>
                patch({ action: "quote", quotedTotalCents: Math.round(Number(quote.total) * 100), durationMinutes: Number(quote.duration), send: true }, "Quote saved and booking link sent.")
              }
            >
              {b.status === "quote_sent" ? "Update & resend quote" : "Send quote to customer"}
            </button>
            {quoteLink && <p className="mt-2 break-all text-xs text-mist">Booking link: {quoteLink}</p>}
          </Section>
        )}

        {/* Reschedule */}
        {paid && b.status !== "cancelled" && b.status !== "completed" && (
          <Section title="Reschedule">
            {!rescheduling ? (
              <button className="btn btn-ghost w-full" onClick={() => setRescheduling(true)}>
                Pick a new date & time
              </button>
            ) : (
              <div>
                <Calendar
                  service={b.package}
                  value={newSlot}
                  onChange={setNewSlot}
                  maxMonthsAhead={6}
                  fetchUrl={(m) => `/api/admin/availability?bookingId=${b.id}&month=${m}`}
                />
                <div className="mt-4 flex gap-2">
                  <button className="btn btn-ghost flex-1" onClick={() => setRescheduling(false)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary flex-1"
                    disabled={!newSlot || busy}
                    onClick={async () => {
                      const r = await patch({ action: "reschedule", start: newSlot!.start, notify: true }, "Rescheduled.");
                      if (r) setRescheduling(false);
                    }}
                  >
                    Confirm new time
                  </button>
                </div>
              </div>
            )}
          </Section>
        )}

        <Section title="Status">
          <div className="grid grid-cols-2 gap-2">
            {paid && b.status !== "confirmed" && b.scheduled_start && (
              <button disabled={busy} className="btn btn-ghost min-h-10 text-sm" onClick={() => patch({ action: "status", status: "confirmed", notify: false }, "Marked confirmed.")}>
                Mark confirmed
              </button>
            )}
            {b.status === "confirmed" && (
              <button disabled={busy} className="btn btn-ghost min-h-10 text-sm" onClick={() => patch({ action: "status", status: "completed", notify: false }, "Marked completed.")}>
                Mark completed
              </button>
            )}
            {b.status === "confirmed" && (
              <button
                disabled={busy}
                className="btn btn-ghost min-h-10 text-sm"
                onClick={() => confirm("Mark as needing rescheduling and email the customer?") && patch({ action: "status", status: "needs_rescheduling", notify: true }, "Marked needs rescheduling.")}
              >
                Needs rescheduling
              </button>
            )}
            {b.status !== "cancelled" && b.status !== "expired" && (
              <button
                disabled={busy}
                className="btn min-h-10 border border-danger/40 text-sm text-danger hover:bg-danger/10"
                onClick={() => {
                  const reason = prompt("Cancel this booking? Optional note for the customer:");
                  if (reason !== null) patch({ action: "status", status: "cancelled", reason: reason || undefined, notify: true }, "Cancelled.");
                }}
              >
                Cancel booking
              </button>
            )}
          </div>
          {paid && <p className="mt-2 text-xs text-mist">Refunds are issued from your Square Dashboard — cancelling here doesn&apos;t refund automatically.</p>}
        </Section>

        <Section title="Internal notes">
          <textarea className="field" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button disabled={busy} className="btn btn-ghost mt-2 min-h-10 text-sm" onClick={() => patch({ action: "notes", notes }, "Notes saved.")}>
            Save notes
          </button>
        </Section>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 border-t border-line pt-5">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-mist">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
function Field({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 text-sm">
      <span className="text-mist">{k}</span>
      <span className="whitespace-pre-line break-words">{v}</span>
    </div>
  );
}
