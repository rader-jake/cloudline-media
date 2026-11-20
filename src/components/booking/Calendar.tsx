"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarX, ChevronLeft, ChevronRight, Clock, Loader2, RefreshCw } from "lucide-react";
import type { ServiceKey } from "@/lib/settings";
import type { SelectedSlot } from "./types";

interface Day {
  date: string;
  slots: { start: string; label: string }[];
  reason?: string;
}
type MonthState = { status: "loading" } | { status: "ok"; days: Day[] } | { status: "setup"; message: string } | { status: "error"; message: string };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const todayNY = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const shiftMonth = (m: string, by: number) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};
const monthLabel = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, 15)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
};
export const longDate = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
};

export function Calendar({
  service,
  quote,
  value,
  onChange,
  maxMonthsAhead = 3,
  fetchUrl,
  contactEmail,
}: {
  service: ServiceKey;
  quote?: { reference: string; token: string } | null;
  value: SelectedSlot | null;
  onChange: (s: SelectedSlot | null) => void;
  maxMonthsAhead?: number;
  /** Override for admin rescheduling. */
  fetchUrl?: (month: string) => string;
  contactEmail?: string;
}) {
  const firstMonth = todayNY().slice(0, 7);
  const [month, setMonth] = useState(value?.date.slice(0, 7) ?? firstMonth);
  const [cache, setCache] = useState<Record<string, MonthState>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(value?.date ?? null);
  const state = cache[month] ?? { status: "loading" };

  const load = useCallback(
    async (m: string, force = false) => {
      if (!force && cache[m] && cache[m].status !== "error") return;
      setCache((c) => ({ ...c, [m]: { status: "loading" } }));
      try {
        const url = fetchUrl
          ? fetchUrl(m)
          : `/api/availability?service=${service}&month=${m}${quote ? `&quote=${encodeURIComponent(quote.reference)}&t=${encodeURIComponent(quote.token)}` : ""}`;
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        if (data.setupRequired) return setCache((c) => ({ ...c, [m]: { status: "setup", message: data.message } }));
        if (!res.ok) return setCache((c) => ({ ...c, [m]: { status: "error", message: data.error ?? "Couldn't load availability." } }));
        setCache((c) => ({ ...c, [m]: { status: "ok", days: data.days } }));
      } catch {
        setCache((c) => ({ ...c, [m]: { status: "error", message: "Network error loading availability." } }));
      }
    },
    [cache, fetchUrl, service, quote]
  );

  useEffect(() => {
    load(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, service]);

  // Auto-advance once to the next month if this one has nothing left (common near month end)
  const advanced = useRef(false);
  useEffect(() => {
    if (!advanced.current && state.status === "ok" && month === firstMonth && !selectedDate && !state.days.some((d) => d.slots.length)) {
      advanced.current = true;
      setMonth(shiftMonth(month, 1));
    }
  }, [state, month, firstMonth, selectedDate]);

  const days = state.status === "ok" ? state.days : [];
  const leading = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  }, [month]);
  const selectedDay = days.find((d) => d.date === selectedDate);
  const canPrev = month > firstMonth;
  const canNext = month < shiftMonth(firstMonth, maxMonthsAhead);

  if (state.status === "setup") {
    return (
      <div className="rounded-2xl border border-warn/30 bg-warn/5 p-6 text-center" role="status">
        <CalendarX className="mx-auto size-10 text-warn" aria-hidden />
        <p className="mt-3 text-lg font-bold">Online scheduling isn&apos;t live yet</p>
        <p className="mt-1 text-mist">{state.message}</p>
        {contactEmail && (
          <a href={`mailto:${contactEmail}`} className="btn btn-primary mt-5 whitespace-normal">
            Email us to book
          </a>
        )}
      </div>
    );
  }

  const groups = selectedDay
    ? [
        { label: "Morning", slots: selectedDay.slots.filter((s) => /AM$/.test(s.label)) },
        { label: "Afternoon & Evening", slots: selectedDay.slots.filter((s) => /PM$/.test(s.label)) },
      ].filter((g) => g.slots.length)
    : [];

  return (
    <div className="grid gap-6 md:grid-cols-[1.15fr_1fr]">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => canPrev && setMonth(shiftMonth(month, -1))}
            disabled={!canPrev}
            className="grid size-10 place-items-center rounded-xl border border-line hover:border-accent disabled:opacity-30"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-5" />
          </button>
          <p className="text-lg font-bold" aria-live="polite">
            {monthLabel(month)}
          </p>
          <button
            type="button"
            onClick={() => canNext && setMonth(shiftMonth(month, 1))}
            disabled={!canNext}
            className="grid size-10 place-items-center rounded-xl border border-line hover:border-accent disabled:opacity-30"
            aria-label="Next month"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wider text-mist" aria-hidden>
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>

        {state.status === "loading" ? (
          <div className="grid h-[288px] place-items-center text-mist">
            <Loader2 className="size-6 animate-spin" aria-label="Loading availability" />
          </div>
        ) : state.status === "error" ? (
          <div className="grid h-[288px] place-items-center text-center">
            <div>
              <p className="text-danger">{state.message}</p>
              <button type="button" onClick={() => load(month, true)} className="btn btn-ghost mt-3 min-h-10 text-sm">
                <RefreshCw className="size-4" /> Try again
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`Available dates in ${monthLabel(month)}`}>
            {Array.from({ length: leading }).map((_, i) => (
              <div key={`b${i}`} />
            ))}
            {days.map((d) => {
              const available = d.slots.length > 0;
              const selected = d.date === selectedDate;
              const dayNum = Number(d.date.slice(8));
              return (
                <button
                  key={d.date}
                  type="button"
                  role="gridcell"
                  disabled={!available}
                  aria-selected={selected}
                  aria-label={`${longDate(d.date)}${available ? `, ${d.slots.length} times available` : ", unavailable"}`}
                  onClick={() => {
                    setSelectedDate(d.date);
                    if (value?.date !== d.date) onChange(null);
                  }}
                  className={`relative aspect-square rounded-xl text-sm font-semibold transition md:text-base ${
                    selected
                      ? "bg-accent text-ink shadow-glow"
                      : available
                        ? "border border-accent/25 bg-accent/10 text-white hover:border-accent hover:bg-accent/20"
                        : "cursor-not-allowed text-white/25 line-through decoration-white/20"
                  }`}
                >
                  {dayNum}
                  {available && !selected && <span className="absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-accent" aria-hidden />}
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-mist">
          <span className="flex items-center gap-2">
            <span className="size-3 rounded border border-accent/40 bg-accent/15" /> Available
          </span>
          <span className="flex items-center gap-2">
            <span className="size-3 rounded bg-white/5" /> Unavailable
          </span>
          <span>All times Eastern (New York)</span>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-ink/40 p-5">
        {!selectedDay ? (
          <div className="grid h-full min-h-[180px] place-items-center text-center text-mist">
            <div>
              <Clock className="mx-auto size-8 text-accent/70" aria-hidden />
              <p className="mt-3">Pick a highlighted date to see available start times.</p>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-bold">{longDate(selectedDay.date)}</p>
            <p className="text-sm text-mist">Choose a start time</p>
            <div className="mt-4 space-y-4">
              {groups.map((g) => (
                <div key={g.label}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-white/50">{g.label}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {g.slots.map((s) => {
                      const sel = value?.start === s.start;
                      return (
                        <button
                          key={s.start}
                          type="button"
                          aria-pressed={sel}
                          onClick={() => onChange({ date: selectedDay.date, start: s.start, label: s.label })}
                          className={`min-h-11 rounded-lg border text-sm font-semibold transition ${
                            sel ? "border-accent bg-accent text-ink" : "border-line bg-panel hover:border-accent"
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
