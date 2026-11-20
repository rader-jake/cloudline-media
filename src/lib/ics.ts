// iCalendar (.ics) + Google Calendar link helpers. Safe for client and server.

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escIcs = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

export interface CalEvent {
  uid: string;
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
}

export function buildIcs(e: CalEvent) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cloudline Media//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}@cloudlinemedia`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(e.end)}`,
    `SUMMARY:${escIcs(e.title)}`,
    `DESCRIPTION:${escIcs(e.description)}`,
    `LOCATION:${escIcs(e.location)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escIcs(e.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function googleCalendarUrl(e: CalEvent) {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${stamp(e.start)}/${stamp(e.end)}`,
    details: e.description,
    location: e.location,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
