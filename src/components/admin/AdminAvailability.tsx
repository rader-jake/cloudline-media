"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleCheck, Loader2, Trash2, TriangleAlert } from "lucide-react";
import { useSettings } from "./useSettings";
import type { Settings } from "@/lib/settings";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Block {
  id: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  reason: string | null;
}

export function AdminAvailability() {
  const { data, draft, setDraft, error, saving, saved, save } = useSettings();

  if (!draft || !data) return <Loading error={error} />;
  const set = (patch: Partial<Settings>) => setDraft({ ...draft, ...patch });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">Availability</h1>
        <p className="mt-1 text-mist">All times are Eastern (America/New_York). Customers only see slots that fit inside these hours.</p>
      </div>

      <section className={`card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between ${draft.onlineBookingEnabled ? "" : "!border-warn/40"}`}>
        <div>
          <h2 className="text-lg font-bold">Online booking</h2>
          <p className="mt-1 text-sm text-mist">
            {data.hoursConfigured
              ? "Customers can see open slots and pay deposits."
              : "OFF — customers see a “scheduling is being set up” message instead of slots. Review your hours below, switch this on, then save."}
          </p>
          {!data.integrations.square && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-warn">
              <TriangleAlert className="size-4" /> Square isn&apos;t configured, so deposits can&apos;t be collected yet.
            </p>
          )}
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-3 font-semibold">
          <input type="checkbox" className="size-5 accent-[#20B8FF]" checked={draft.onlineBookingEnabled} onChange={(e) => set({ onlineBookingEnabled: e.target.checked })} />
          Accept online bookings
        </label>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold">Working hours</h2>
        <div className="mt-4 space-y-2">
          {DAYS.map((name, i) => {
            const wh = draft.workingHours[String(i)];
            return (
              <div key={name} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-ink/40 p-3">
                <label className="flex w-36 items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    className="size-4 accent-[#20B8FF]"
                    checked={wh.enabled}
                    onChange={(e) => set({ workingHours: { ...draft.workingHours, [i]: { ...wh, enabled: e.target.checked } } })}
                  />
                  {name}
                </label>
                {wh.enabled ? (
                  <div className="flex items-center gap-2">
                    <input type="time" className="field !min-h-10 w-32" value={wh.start} onChange={(e) => set({ workingHours: { ...draft.workingHours, [i]: { ...wh, start: e.target.value } } })} />
                    <span className="text-mist">to</span>
                    <input type="time" className="field !min-h-10 w-32" value={wh.end} onChange={(e) => set({ workingHours: { ...draft.workingHours, [i]: { ...wh, end: e.target.value } } })} />
                  </div>
                ) : (
                  <span className="text-sm text-mist">Closed</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold">Scheduling rules</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Num label="Prep buffer before each shoot (min)" value={draft.prepBufferMinutes} onChange={(v) => set({ prepBufferMinutes: v })} />
          <Num label="Travel buffer after each shoot (min)" value={draft.travelBufferMinutes} onChange={(v) => set({ travelBufferMinutes: v })} />
          <Num label="Start-time interval (min)" value={draft.slotIntervalMinutes} onChange={(v) => set({ slotIntervalMinutes: v })} />
          <Num label="Minimum advance notice (hours)" value={draft.minNoticeHours} onChange={(v) => set({ minNoticeHours: v })} />
          <Num label="Book up to (days ahead)" value={draft.maxAdvanceDays} onChange={(v) => set({ maxAdvanceDays: v })} />
          <Num label="Unpaid hold expires after (min)" value={draft.holdMinutes} onChange={(v) => set({ holdMinutes: v })} />
        </div>
        <p className="mt-3 text-xs text-mist">Shoot durations per service are set on the Settings page. Two shoots are always separated by travel + prep time.</p>
      </section>

      <SaveBar saving={saving} saved={saved} error={error} onSave={() => save()} />

      <Blocks />
    </div>
  );
}

function Blocks() {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [form, setForm] = useState({ startDate: "", endDate: "", allDay: true, startTime: "09:00", endTime: "12:00", reason: "" });
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/blocks", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    setBlocks(json.blocks ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/admin/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, endDate: form.endDate || form.startDate, reason: form.reason || undefined }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(json.error ?? "Failed");
    setForm({ ...form, reason: "" });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/blocks?id=${id}`, { method: "DELETE" });
    load();
  }

  const fmt = (iso: string, withTime: boolean) =>
    new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric", ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}) });

  return (
    <section className="card p-6">
      <h2 className="text-lg font-bold">Blocked dates &amp; times</h2>
      <p className="mt-1 text-sm text-mist">Vacations, personal time, weather days — customers can&apos;t book during these.</p>
      <form onSubmit={add} className="mt-4 grid gap-3 rounded-xl border border-line bg-ink/40 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <label className="text-sm lg:col-span-1">
          From
          <input type="date" required className="field mt-1 !min-h-10" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </label>
        <label className="text-sm lg:col-span-1">
          To
          <input type="date" className="field mt-1 !min-h-10" value={form.endDate} min={form.startDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" className="size-4 accent-[#20B8FF]" checked={form.allDay} onChange={(e) => setForm({ ...form, allDay: e.target.checked })} /> All day
        </label>
        {!form.allDay && (
          <>
            <label className="text-sm">
              Start time
              <input type="time" className="field mt-1 !min-h-10" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </label>
            <label className="text-sm">
              End time
              <input type="time" className="field mt-1 !min-h-10" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </label>
          </>
        )}
        <label className="text-sm sm:col-span-2 lg:col-span-4">
          Reason (internal)
          <input className="field mt-1 !min-h-10" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Vacation" />
        </label>
        <div className="flex items-end sm:col-span-2">
          <button className="btn btn-primary min-h-10 w-full text-sm">Add block</button>
        </div>
        {err && <p className="text-sm text-danger sm:col-span-full">{err}</p>}
      </form>
      <ul className="mt-4 divide-y divide-line">
        {!blocks ? (
          <li className="p-3 text-mist">Loading…</li>
        ) : blocks.length === 0 ? (
          <li className="p-3 text-mist">No upcoming blocks.</li>
        ) : (
          blocks.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span>
                <span className="font-semibold">
                  {fmt(b.starts_at, !b.all_day)} – {b.all_day ? fmt(new Date(new Date(b.ends_at).getTime() - 60000).toISOString(), false) : fmt(b.ends_at, true)}
                </span>
                {b.all_day && <span className="ml-2 text-mist">all day</span>}
                {b.reason && <span className="ml-2 text-mist">· {b.reason}</span>}
              </span>
              <button onClick={() => remove(b.id)} className="grid size-8 place-items-center rounded-lg text-danger hover:bg-danger/10" aria-label="Remove block">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

export function Num({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="text-sm">
      {label}
      <input type="number" step={step} min={0} className="field mt-1 !min-h-10" value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function SaveBar({ saving, saved, error, onSave }: { saving: boolean; saved: boolean; error: string | null; onSave: () => void }) {
  return (
    <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-2xl border border-line bg-panel/95 p-3 backdrop-blur">
      {error && <p className="mr-auto text-sm text-danger">{error}</p>}
      {saved && (
        <p className="flex items-center gap-1 text-sm text-success">
          <CircleCheck className="size-4" /> Saved
        </p>
      )}
      <button onClick={onSave} disabled={saving} className="btn btn-primary min-h-10 text-sm">
        {saving && <Loader2 className="size-4 animate-spin" />} Save changes
      </button>
    </div>
  );
}

export function Loading({ error }: { error: string | null }) {
  return error ? <p className="rounded-xl bg-danger/10 p-4 text-danger">{error}</p> : <Loader2 className="mx-auto mt-20 size-6 animate-spin text-accent" />;
}
