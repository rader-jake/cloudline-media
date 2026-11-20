import "server-only";
import { requireDb } from "@/lib/supabase/admin";
import { googleBusy } from "@/lib/google-calendar";
import type { Settings, ServiceKey } from "@/lib/settings";
import { addMinutes, daysInMonth, dayOfWeek, hhmmOf, localDate, minutesOf, prettyTime, zonedToUtc } from "@/lib/time";

export interface Slot {
  start: string; // ISO UTC
  label: string; // "9:00 AM"
}
export interface DayAvailability {
  date: string;
  slots: Slot[];
  /** Why a day has no slots — useful for UI copy. */
  reason?: "past" | "closed" | "blocked" | "full" | "beyond_window";
}

interface Interval {
  start: Date;
  end: Date;
}
const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

/** All booked/held ranges (already including each booking's buffers) + blocks + Google busy. */
async function loadBusy(from: Date, to: Date, excludeBookingId?: string) {
  const sb = requireDb();
  const nowIso = new Date().toISOString();

  const [bookingsRes, blocksRes] = await Promise.all([
    sb
      .from("bookings")
      .select("id, status, busy_start, busy_end, hold_expires_at")
      .in("status", ["pending_payment", "confirmed"])
      .lt("busy_start", to.toISOString())
      .gt("busy_end", from.toISOString()),
    sb.from("availability_blocks").select("starts_at, ends_at").lt("starts_at", to.toISOString()).gt("ends_at", from.toISOString()),
  ]);
  if (bookingsRes.error) throw new Error(bookingsRes.error.message);
  if (blocksRes.error) throw new Error(blocksRes.error.message);

  const booked: Interval[] = (bookingsRes.data ?? [])
    .filter((b) => b.id !== excludeBookingId)
    // unpaid holds only count while unexpired
    .filter((b) => b.status === "confirmed" || (b.hold_expires_at && b.hold_expires_at > nowIso))
    .map((b) => ({ start: new Date(b.busy_start), end: new Date(b.busy_end) }));

  const blocks: Interval[] = (blocksRes.data ?? []).map((b) => ({ start: new Date(b.starts_at), end: new Date(b.ends_at) }));

  let external: Interval[] = [];
  try {
    external = await googleBusy(from, to);
  } catch (e) {
    // Fail closed: if the calendar can't be read we must not offer possibly-conflicting slots.
    console.error("[availability] google calendar unavailable", e);
    throw new Error("calendar_unavailable");
  }
  return { booked: [...booked, ...external], blocks };
}

/** Busy range a booking occupies, including prep before and travel after. */
export function busyRangeFor(start: Date, durationMinutes: number, s: Settings) {
  return {
    busyStart: addMinutes(start, -s.prepBufferMinutes),
    busyEnd: addMinutes(start, durationMinutes + s.travelBufferMinutes),
    end: addMinutes(start, durationMinutes),
  };
}

export async function monthAvailability(opts: {
  settings: Settings;
  service: ServiceKey;
  month: string; // YYYY-MM
  durationMinutes?: number;
  excludeBookingId?: string;
  ignoreNotice?: boolean; // admin rescheduling
}): Promise<DayAvailability[]> {
  const { settings: s } = opts;
  const duration = opts.durationMinutes ?? s.services[opts.service].durationMinutes;
  const days = daysInMonth(opts.month);
  const now = new Date();
  const earliest = opts.ignoreNotice ? now : addMinutes(now, s.minNoticeHours * 60);
  const today = localDate(now, s.timezone);
  const lastDay = localDate(addMinutes(now, s.maxAdvanceDays * 1440), s.timezone);

  const rangeStart = zonedToUtc(days[0], "00:00", s.timezone);
  const rangeEnd = addMinutes(zonedToUtc(days[days.length - 1], "23:59", s.timezone), 1);
  const { booked, blocks } = await loadBusy(addMinutes(rangeStart, -1440), addMinutes(rangeEnd, 1440), opts.excludeBookingId);

  return days.map((date): DayAvailability => {
    if (date < today) return { date, slots: [], reason: "past" };
    if (date > lastDay && !opts.ignoreNotice) return { date, slots: [], reason: "beyond_window" };
    const wh = s.workingHours[String(dayOfWeek(date))];
    if (!wh?.enabled) return { date, slots: [], reason: "closed" };

    const open = minutesOf(wh.start);
    const close = minutesOf(wh.end);
    const slots: Slot[] = [];
    let anyUnblocked = false;

    for (let m = open; m + duration <= close; m += s.slotIntervalMinutes) {
      const start = zonedToUtc(date, hhmmOf(m), s.timezone);
      const { busyStart, busyEnd, end } = busyRangeFor(start, duration, s);
      const shoot = { start, end };
      if (blocks.some((b) => overlaps(b, shoot))) continue;
      anyUnblocked = true;
      if (start < earliest) continue;
      if (booked.some((b) => overlaps(b, { start: busyStart, end: busyEnd }))) continue;
      slots.push({ start: start.toISOString(), label: prettyTime(start, s.timezone) });
    }
    if (slots.length) return { date, slots };
    return { date, slots, reason: anyUnblocked ? (date === today ? "past" : "full") : "blocked" };
  });
}

/** Re-validates a single requested start time against current availability. */
export async function isSlotAvailable(opts: {
  settings: Settings;
  service: ServiceKey;
  start: Date;
  durationMinutes?: number;
  excludeBookingId?: string;
  ignoreNotice?: boolean;
}) {
  const month = localDate(opts.start, opts.settings.timezone).slice(0, 7);
  const days = await monthAvailability({ ...opts, month });
  const iso = opts.start.toISOString();
  return days.some((d) => d.slots.some((sl) => sl.start === iso));
}
