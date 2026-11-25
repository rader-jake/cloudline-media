"use client";

import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";
import { useSettings } from "./useSettings";
import { Loading, Num, SaveBar } from "./AdminAvailability";
import type { ServiceKey, Settings } from "@/lib/settings";

const SERVICE_LABELS: Record<ServiceKey, string> = {
  flythrough: "FPV · The Fly-Through",
  experience: "FPV · The Experience",
  production: "FPV · The Production (quote)",
  wedding_fpv: "FPV · Wedding-Day (quote)",
  realestate: "Real Estate Aerial Tour",
  timelapse: "Aerial Job Time-Lapse",
  fpv: "Interior FPV (retired — old quotes only)",
};
/** Packages that have a launch rate + a standard (post-launch) rate. */
const LAUNCH_PRICED: ServiceKey[] = ["flythrough", "experience", "production"];
const dollars = (c: number | null | undefined) => (c != null ? c / 100 : "");
const toCents = (v: string) => (v === "" ? null : Math.round(Number(v) * 100));

export function AdminSettings() {
  const { data, draft, setDraft, error, saving, saved, save } = useSettings();
  if (!draft || !data) return <Loading error={error} />;
  const set = (patch: Partial<Settings>) => setDraft({ ...draft, ...patch });
  const setSvc = (k: ServiceKey, patch: Partial<Settings["services"][ServiceKey]>) => set({ services: { ...draft.services, [k]: { ...draft.services[k], ...patch } } });

  const integrations: [string, boolean, string][] = [
    ["Database (Supabase)", data.integrations.database, "Required for bookings"],
    ["Payments (Square)", data.integrations.square, "Required to collect deposits"],
    ["Email (Resend)", data.integrations.email, "Confirmations, reminders, team alerts"],
    ["Google Calendar", data.integrations.googleCalendar, "Optional — sync busy times & add shoots"],
    ["Meta Conversions API", data.integrations.metaCapi, "Optional — server-side Purchase events"],
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold">Settings</h1>

      <section className="card p-6">
        <h2 className="text-lg font-bold">Integrations</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {integrations.map(([name, ok, note]) => (
            <li key={name} className="flex items-center gap-3 rounded-xl border border-line bg-ink/40 p-3 text-sm">
              {ok ? <CircleCheck className="size-5 text-success" /> : <CircleX className="size-5 text-white/30" />}
              <span>
                <span className="font-semibold">{name}</span>
                <span className="block text-xs text-mist">{ok ? "Connected" : `Not configured · ${note}`}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-mist">Credentials are set as environment variables on your host — they are never stored in or shown by this dashboard.</p>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold">Services &amp; pricing</h2>
        <div className="mt-4 space-y-3">
          {(Object.keys(SERVICE_LABELS) as ServiceKey[]).map((k) => {
            const s = draft.services[k];
            const launchPriced = LAUNCH_PRICED.includes(k);
            const quoteOnly = k === "fpv" || k === "wedding_fpv";
            return (
              <div key={k} className="grid gap-3 rounded-xl border border-line bg-ink/40 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm sm:col-span-2 lg:col-span-1">
                  {SERVICE_LABELS[k]} — display name
                  <input className="field mt-1 !min-h-10" value={s.name} onChange={(e) => setSvc(k, { name: e.target.value })} />
                </label>
                {k === "fpv" ? (
                  <div className="text-sm text-mist">Priced per quote</div>
                ) : (
                  <label className="text-sm">
                    {launchPriced ? "Launch price ($)" : k === "wedding_fpv" ? "Starting price ($) — empty = hidden" : "Starting price ($)"}
                    <input type="number" min={0} className="field mt-1 !min-h-10" value={dollars(s.priceCents)} onChange={(e) => setSvc(k, { priceCents: toCents(e.target.value) })} />
                  </label>
                )}
                {launchPriced && (
                  <label className="text-sm">
                    Standard price after launch ($)
                    <input
                      type="number"
                      min={0}
                      className="field mt-1 !min-h-10"
                      value={dollars(s.standardPriceCents)}
                      onChange={(e) => setSvc(k, { standardPriceCents: toCents(e.target.value) })}
                    />
                  </label>
                )}
                <Num label={quoteOnly || k === "production" ? "Default duration (min)" : "Shoot duration (min)"} value={s.durationMinutes} onChange={(v) => setSvc(k, { durationMinutes: v })} />
                {(k === "flythrough" || k === "experience") && (
                  <label className="text-sm">
                    Turnaround shown to customers
                    <input className="field mt-1 !min-h-10" placeholder="e.g. 48 hours" value={s.turnaround ?? ""} onChange={(e) => setSvc(k, { turnaround: e.target.value })} />
                  </label>
                )}
                <label className="flex items-end gap-2 pb-2 text-sm">
                  <input type="checkbox" className="size-4 accent-[#20B8FF]" checked={s.active} onChange={(e) => setSvc(k, { active: e.target.checked })} /> Active
                </label>
              </div>
            );
          })}
        </div>
        <div className="mt-6 grid gap-4 rounded-xl border border-accent/25 bg-accent/5 p-4 md:grid-cols-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" className="size-4 accent-[#20B8FF]" checked={draft.launch.enabled} onChange={(e) => set({ launch: { ...draft.launch, enabled: e.target.checked } })} />
            Launch pricing on
          </label>
          <label className="text-sm">
            Label
            <input className="field mt-1 !min-h-10" value={draft.launch.label} onChange={(e) => set({ launch: { ...draft.launch, label: e.target.value } })} />
          </label>
          <label className="text-sm">
            Ends on (optional — shown only if set)
            <input type="date" className="field mt-1 !min-h-10" value={draft.launch.endsAt ?? ""} onChange={(e) => set({ launch: { ...draft.launch, endsAt: e.target.value || null } })} />
          </label>
          <p className="text-xs text-mist md:col-span-3">
            On: FPV packages charge and show the launch price, with the standard price beneath it. Off: they charge and show the standard price.
          </p>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-[#20B8FF]" checked={draft.display.showTimelapse} onChange={(e) => set({ display: { showTimelapse: e.target.checked } })} />
          Show the aerial job time-lapse on the homepage
        </label>
        <div className="mt-4 max-w-xs">
          <Num label="Deposit ($)" value={draft.depositCents / 100} onChange={(v) => set({ depositCents: Math.round(v * 100) })} />
          <p className="mt-1 text-xs text-mist">Credited toward the service price. Changing this affects new bookings only.</p>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold">Service area</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Display label
            <input className="field mt-1 !min-h-10" value={draft.serviceArea.label} onChange={(e) => set({ serviceArea: { ...draft.serviceArea, label: e.target.value } })} />
          </label>
          <label className="text-sm">
            Areas (comma-separated)
            <input
              className="field mt-1 !min-h-10"
              value={draft.serviceArea.areas.join(", ")}
              onChange={(e) => set({ serviceArea: { ...draft.serviceArea, areas: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } })}
            />
          </label>
          <label className="text-sm">
            In-area ZIP prefixes (first 3 digits, comma-separated — empty = no check)
            <input
              className="field mt-1 !min-h-10"
              value={draft.serviceArea.zipPrefixes.join(", ")}
              onChange={(e) => set({ serviceArea: { ...draft.serviceArea, zipPrefixes: e.target.value.split(/[,\s]+/).filter((s) => /^\d{3}$/.test(s)) } })}
            />
          </label>
          <label className="text-sm">
            Addresses outside the area
            <select
              className="field mt-1 !min-h-10"
              value={draft.serviceArea.outsideAreaBehavior}
              onChange={(e) => set({ serviceArea: { ...draft.serviceArea, outsideAreaBehavior: e.target.value as "warn" | "block" } })}
            >
              <option value="warn">Allow, but warn customer &amp; flag booking</option>
              <option value="block">Block online booking</option>
            </select>
          </label>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold">Deposit &amp; cancellation policy</h2>
        {!draft.policy.approved && (
          <p className="mt-3 flex gap-2 rounded-xl border border-warn/30 bg-warn/10 p-3 text-sm text-warn">
            <TriangleAlert className="size-4 shrink-0" /> This is draft wording. Customers must agree to it before paying — review it, edit as needed, then tick &ldquo;approved&rdquo;.
          </p>
        )}
        <textarea className="field mt-4" rows={6} value={draft.policy.text} onChange={(e) => set({ policy: { ...draft.policy, text: e.target.value } })} />
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-[#20B8FF]" checked={draft.policy.approved} onChange={(e) => set({ policy: { ...draft.policy, approved: e.target.checked } })} />
          I&apos;ve reviewed this policy and it&apos;s approved by the business
        </label>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold">Public contact details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Email
            <input className="field mt-1 !min-h-10" value={draft.contact.email} onChange={(e) => set({ contact: { ...draft.contact, email: e.target.value } })} />
          </label>
          <label className="text-sm">
            Phone
            <input className="field mt-1 !min-h-10" value={draft.contact.phone} onChange={(e) => set({ contact: { ...draft.contact, phone: e.target.value } })} />
          </label>
        </div>
      </section>

      <SaveBar saving={saving} saved={saved} error={error} onSave={() => save()} />
    </div>
  );
}
