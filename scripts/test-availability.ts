// Sanity tests for the availability engine with a stubbed Supabase REST API.
// Run: NODE_OPTIONS="--conditions=react-server" npx tsx scripts/test-availability.ts
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://stub.local";
process.env.SUPABASE_SERVICE_ROLE_KEY = "stub";

const bookings: unknown[] = [];
const blocks: unknown[] = [];
globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input);
  const body = url.includes("/bookings") ? bookings : url.includes("/availability_blocks") ? blocks : [];
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}) as typeof fetch;

async function main() {
  const { monthAvailability } = await import("../src/lib/availability");
  const { mergeSettings } = await import("../src/lib/settings");
  const s = mergeSettings({ minNoticeHours: 0, maxAdvanceDays: 365 });
  let fails = 0;
  const check = (name: string, ok: boolean, extra = "") => {
    console.log(`${ok ? "PASS" : "FAIL"} ${name} ${extra}`);
    if (!ok) fails++;
  };

  // Mon Mar 1 2027 (EST, UTC-5) and Mon Jul 5 2027 (EDT, UTC-4)
  let days = await monthAvailability({ settings: s, service: "timelapse", month: "2027-03" });
  const mar1 = days.find((d) => d.date === "2027-03-01")!;
  check("weekday open 8:00 ET (EST)", mar1.slots[0]?.start === "2027-03-01T13:00:00.000Z", mar1.slots[0]?.start);
  check("last 2h slot starts 16:00 ET", mar1.slots.at(-1)?.label === "4:00 PM", mar1.slots.at(-1)?.label);
  const sun = days.find((d) => d.date === "2027-03-07")!;
  check("sunday closed", sun.slots.length === 0 && sun.reason === "closed");

  days = await monthAvailability({ settings: s, service: "timelapse", month: "2027-07" });
  const jul5 = days.find((d) => d.date === "2027-07-05")!;
  check("DST: 8:00 ET = 12:00Z (EDT)", jul5.slots[0]?.start === "2027-07-05T12:00:00.000Z", jul5.slots[0]?.start);

  // Existing booking 10:00–12:00 ET on Mar 1 with buffers (prep 30, travel 45) => busy 9:30–12:45
  bookings.push({ id: "x", status: "confirmed", busy_start: "2027-03-01T14:30:00Z", busy_end: "2027-03-01T17:45:00Z", hold_expires_at: null });
  days = await monthAvailability({ settings: s, service: "timelapse", month: "2027-03" });
  const labels = days.find((d) => d.date === "2027-03-01")!.slots.map((x) => x.label);
  // new 2h shoot needs [start-30, start+120+45] clear of 9:30–12:45 → latest morning start: start+165 <= 9:30 → 6:45 (< open) so none; earliest after: start-30 >= 12:45 → 13:15 → 1:30 PM on the 30-min grid
  check("buffers block overlapping slots", !labels.includes("8:00 AM") && !labels.includes("1:00 PM") && labels[0] === "1:30 PM", labels.slice(0, 3).join(","));

  // Expired unpaid hold must not block
  bookings.length = 0;
  bookings.push({ id: "y", status: "pending_payment", busy_start: "2027-03-02T13:00:00Z", busy_end: "2027-03-02T22:00:00Z", hold_expires_at: "2000-01-01T00:00:00Z" });
  days = await monthAvailability({ settings: s, service: "timelapse", month: "2027-03" });
  check("expired hold ignored", days.find((d) => d.date === "2027-03-02")!.slots.length > 0);

  // All-day block
  bookings.length = 0;
  blocks.push({ starts_at: "2027-03-03T05:00:00Z", ends_at: "2027-03-04T05:00:00Z" });
  days = await monthAvailability({ settings: s, service: "timelapse", month: "2027-03" });
  const mar3 = days.find((d) => d.date === "2027-03-03")!;
  check("blocked day", mar3.slots.length === 0 && mar3.reason === "blocked", mar3.reason);

  // Past dates & min notice
  const s2 = mergeSettings({ minNoticeHours: 24 });
  const now = new Date();
  const month = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit" }).format(now).slice(0, 7);
  days = await monthAvailability({ settings: s2, service: "realestate", month });
  const earliest = days.flatMap((d) => d.slots).map((x) => new Date(x.start).getTime()).sort()[0];
  check("min notice respected", !earliest || earliest >= now.getTime() + 24 * 3600_000 - 1000);

  console.log(fails ? `\n${fails} FAILED` : "\nAll availability checks passed");
  process.exit(fails ? 1 : 0);
}
main();
