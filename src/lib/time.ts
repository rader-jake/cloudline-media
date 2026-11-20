import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

export const TZ = "America/New_York";

/** "2026-11-20" + "09:30" in tz → UTC Date */
export const zonedToUtc = (date: string, time: string, tz = TZ) => fromZonedTime(`${date}T${time}:00`, tz);

export const fmt = (d: Date | string, pattern: string, tz = TZ) => formatInTimeZone(new Date(d), tz, pattern);

export const localDate = (d: Date | string, tz = TZ) => fmt(d, "yyyy-MM-dd", tz);

export const prettyDate = (d: Date | string, tz = TZ) => fmt(d, "EEEE, MMMM d, yyyy", tz);
export const prettyTime = (d: Date | string, tz = TZ) => fmt(d, "h:mm a", tz);
export const prettyDateTime = (d: Date | string, tz = TZ) => `${prettyDate(d, tz)} at ${prettyTime(d, tz)} ET`;

export const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60_000);

/** Days in a "YYYY-MM" month as "YYYY-MM-DD" strings. */
export function daysInMonth(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
}

/** Day of week (0=Sun) for a calendar date string, independent of timezone. */
export const dayOfWeek = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

export const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
export const hhmmOf = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
