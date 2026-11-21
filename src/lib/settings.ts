// Business settings: prices, durations, hours, buffers, service area, policy.
// Stored as a single JSON row in the `settings` table and editable from /admin/settings.
// DEFAULT_SETTINGS are only used to fill in missing keys and to render prices on the
// marketing page before the database is connected — they never create availability.

export type ServiceKey = "timelapse" | "realestate" | "fpv";
export const SERVICE_KEYS: ServiceKey[] = ["timelapse", "realestate", "fpv"];

export interface ServiceConfig {
  name: string;
  /** Starting price in cents. null = quote only. */
  priceCents: number | null;
  /** Length of the on-site shoot in minutes (used for calendar blocking). */
  durationMinutes: number;
  /** true = customers can self-book & pay deposit. false = "request a quote" flow. */
  selfBookable: boolean;
  active: boolean;
}

export interface WorkingDay {
  enabled: boolean;
  start: string; // "08:00" (America/New_York)
  end: string; // "18:00"
}

export interface Settings {
  /** Master switch: customers only see slots once an admin turns this on in /admin/availability. */
  onlineBookingEnabled: boolean;
  timezone: string;
  depositCents: number;
  services: Record<ServiceKey, ServiceConfig>;
  /** Keys "0" (Sunday) – "6" (Saturday) */
  workingHours: Record<string, WorkingDay>;
  slotIntervalMinutes: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  /** Prep time reserved before each shoot. */
  prepBufferMinutes: number;
  /** Travel / wrap time reserved after each shoot. */
  travelBufferMinutes: number;
  /** How long an unpaid booking holds its slot before it's released. */
  holdMinutes: number;
  serviceArea: {
    label: string;
    areas: string[];
    /** First 3 digits of ZIP codes considered in-area. Empty = no ZIP check. */
    zipPrefixes: string[];
    outsideAreaBehavior: "warn" | "block";
  };
  policy: {
    /** Shown before payment; customer must tick to agree. */
    text: string;
    /** Set to true in admin once the business has reviewed/approved the wording. */
    approved: boolean;
  };
  contact: { email: string; phone: string };
}

export const DEFAULT_SETTINGS: Settings = {
  onlineBookingEnabled: false,
  timezone: "America/New_York",
  depositCents: 2000,
  services: {
    timelapse: { name: "Aerial Job Time-Lapse", priceCents: 24900, durationMinutes: 120, selfBookable: true, active: true },
    realestate: { name: "Real Estate Aerial Tour", priceCents: 29900, durationMinutes: 90, selfBookable: true, active: true },
    fpv: { name: "Interior FPV Fly-Through", priceCents: null, durationMinutes: 120, selfBookable: false, active: true },
  },
  workingHours: {
    "0": { enabled: false, start: "09:00", end: "17:00" },
    "1": { enabled: true, start: "08:00", end: "18:00" },
    "2": { enabled: true, start: "08:00", end: "18:00" },
    "3": { enabled: true, start: "08:00", end: "18:00" },
    "4": { enabled: true, start: "08:00", end: "18:00" },
    "5": { enabled: true, start: "08:00", end: "18:00" },
    "6": { enabled: true, start: "09:00", end: "16:00" },
  },
  slotIntervalMinutes: 30,
  minNoticeHours: 24,
  maxAdvanceDays: 60,
  prepBufferMinutes: 30,
  travelBufferMinutes: 45,
  holdMinutes: 15,
  serviceArea: {
    label: "Queens, Long Island & surrounding areas",
    areas: ["Queens", "Nassau County", "Suffolk County", "Brooklyn", "The Bronx"],
    zipPrefixes: ["110", "111", "112", "113", "114", "115", "116", "117", "118", "119", "104"],
    outsideAreaBehavior: "warn",
  },
  policy: {
    // DRAFT — review and approve in /admin/settings before going live.
    text: "Your $20 deposit reserves your shoot date and time. It is credited toward your total, so it is not an extra fee.\n\nCancel or reschedule 48+ hours ahead: Contact us at least 48 hours before your scheduled start time and we'll refund your deposit in full or move your shoot to a new date at no charge. Refunds go back to your original card and usually appear within 5–10 business days.\n\nLess than 48 hours' notice or no-show: If you cancel within 48 hours of your shoot, or we can't complete it because no one is available or the site isn't accessible at the scheduled time, your deposit is kept to cover the reserved time and travel. No other charge applies.\n\nWeather, airspace & safety: Every flight depends on weather, airspace authorization and on-site safety, and our pilot makes the final call. If conditions prevent the flight, we'll reschedule at no charge. If we can't find a date that works for you, we'll refund your deposit in full.\n\nIf we cancel: If Cloudline Media has to cancel for any other reason, your deposit is refunded in full.\n\nRemaining balance: The remaining balance is due before your final videos are delivered. We'll send you an invoice once editing is complete.",
    approved: false,
  },
  contact: { email: "hello@cloudlinemedia.com", phone: "" },
};

/** Deep-merge saved settings over defaults so newly added keys always exist. */
export function mergeSettings(saved: Partial<Settings> | null | undefined): Settings {
  const s = saved ?? {};
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    services: {
      timelapse: { ...DEFAULT_SETTINGS.services.timelapse, ...s.services?.timelapse },
      realestate: { ...DEFAULT_SETTINGS.services.realestate, ...s.services?.realestate },
      fpv: { ...DEFAULT_SETTINGS.services.fpv, ...s.services?.fpv },
    },
    workingHours: { ...DEFAULT_SETTINGS.workingHours, ...s.workingHours },
    serviceArea: { ...DEFAULT_SETTINGS.serviceArea, ...s.serviceArea },
    policy: { ...DEFAULT_SETTINGS.policy, ...s.policy },
    contact: { ...DEFAULT_SETTINGS.contact, ...s.contact },
  };
}

/** The subset of settings safe to send to the browser. */
export function publicSettings(s: Settings) {
  return {
    timezone: s.timezone,
    depositCents: s.depositCents,
    services: s.services,
    serviceArea: s.serviceArea,
    policy: { text: s.policy.text },
    holdMinutes: s.holdMinutes,
    contact: s.contact,
  };
}
export type PublicSettings = ReturnType<typeof publicSettings>;

export const formatUSD = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
