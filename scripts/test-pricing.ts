/**
 * Pricing checks — the server charges effectivePriceCents(), so these lock its behaviour down.
 *   npm run test:pricing
 */
import { DEFAULT_SETTINGS, effectivePriceCents, mergeSettings, priceDisplay, type Settings } from "../src/lib/settings";
import { holdRequestSchema, inquiryRequestSchema } from "../src/lib/validation";

let failed = 0;
const check = (name: string, ok: boolean, detail?: unknown) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` → ${JSON.stringify(detail)}`}`);
  if (!ok) failed++;
};

const s = mergeSettings(null);
const off: Settings = { ...s, launch: { ...s.launch, enabled: false } };

// Launch on: launch rates are charged, standard shown beneath
check("fly-through charges $349 at launch", effectivePriceCents(s, "flythrough") === 34900, effectivePriceCents(s, "flythrough"));
check("experience charges $699 at launch", effectivePriceCents(s, "experience") === 69900);
check("fly-through shows standard $499 beneath", priceDisplay(s, "flythrough").standardLabel === "$499", priceDisplay(s, "flythrough"));
check("production shows 'From $1,799' / 'from $2,499'", priceDisplay(s, "production").label === "From $1,799" && priceDisplay(s, "production").standardLabel === "from $2,499", priceDisplay(s, "production"));
check("fly-through remaining after $20 deposit is $329", (effectivePriceCents(s, "flythrough") ?? 0) - s.depositCents === 32900);
check("experience remaining after $20 deposit is $679", (effectivePriceCents(s, "experience") ?? 0) - s.depositCents === 67900);

// Launch off: standard rates are charged and no "standard after launch" line
check("launch off charges standard $499", effectivePriceCents(off, "flythrough") === 49900);
check("launch off hides standard line", priceDisplay(off, "flythrough").standard === null);

// Existing services are untouched
check("real estate stays $299", effectivePriceCents(s, "realestate") === 29900);
check("time-lapse stays $249", effectivePriceCents(s, "timelapse") === 24900);
check("aerial services have no standard line", priceDisplay(s, "realestate").standard === null && priceDisplay(off, "timelapse").price === 24900);

// Wedding-Day FPV price stays hidden until set; quote-only packages aren't self-bookable
check("wedding-day FPV price hidden", priceDisplay(s, "wedding_fpv").label === null);
check("production + wedding are inquiry-only", !s.services.production.selfBookable && !s.services.wedding_fpv.selfBookable);

// Settings saved before this release (no new keys) still get every package + launch block
const legacy = mergeSettings({ depositCents: 2000, services: { realestate: { ...DEFAULT_SETTINGS.services.realestate, priceCents: 31900 } } } as Partial<Settings>);
check("legacy saved settings keep their own prices", legacy.services.realestate.priceCents === 31900);
check("legacy saved settings gain FPV packages", legacy.services.flythrough.priceCents === 34900 && legacy.launch.enabled === true);

// Admin edits flow through
const edited = mergeSettings({ services: { flythrough: { ...DEFAULT_SETTINGS.services.flythrough, priceCents: 39900 } } } as Partial<Settings>);
check("admin-edited launch price is charged", effectivePriceCents(edited, "flythrough") === 39900);

// Validation: clients can't send a price, and inquiries need the required fields
const hold = holdRequestSchema.safeParse({
  service: "flythrough",
  start: new Date().toISOString(),
  contact: { name: "Test Person", email: "t@example.com", phone: "5165550100" },
  address: { line1: "1 Test St", city: "Garden City", state: "NY", zip: "11530" },
  project: { industry: "restaurants-retail", priceCents: 1 },
  policyAccepted: true,
});
check("hold request ignores any client price", hold.success && !("priceCents" in (hold.data.project as object)), hold.success ? hold.data.project : hold.error.issues);
const inq = inquiryRequestSchema.safeParse({ contact: { name: "Test Person", email: "t@example.com", phone: "5165550100" }, package: "production", location: { city: "Queens" }, preferredDate: "2027-03-01", project: { industry: "" } });
check("inquiry requires 'What are we filming?'", !inq.success && inq.error.issues.some((i) => i.path.join(".") === "project.industry"));

console.log(failed ? `\n${failed} pricing check(s) FAILED` : "\nAll pricing checks passed");
process.exit(failed ? 1 : 0);
