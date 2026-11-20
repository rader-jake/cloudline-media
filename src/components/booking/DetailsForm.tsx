"use client";

import { CircleCheck } from "lucide-react";
import { AddressAutocomplete } from "./AddressAutocomplete";
import type { Details } from "./types";
import type { ServiceKey } from "@/lib/settings";

const PROPERTY_TYPES = [
  "Single-family home",
  "Luxury estate",
  "Multi-family",
  "Condo / Co-op",
  "Rental property",
  "Commercial property",
  "Construction site",
  "Land / Lot",
  "Other",
];

export function DetailsForm({
  value,
  onChange,
  errors,
  service,
  googleMapsKey,
}: {
  value: Details;
  onChange: (d: Details) => void;
  errors: Record<string, string>;
  service: ServiceKey;
  googleMapsKey: string;
}) {
  const set = <K extends keyof Details>(section: K, patch: Partial<Details[K]>) => onChange({ ...value, [section]: { ...value[section], ...patch } });
  const a = value.address;

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-lg font-bold">Contact details</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input label="Full name" id="contact.name" required autoComplete="name" value={value.contact.name} onChange={(v) => set("contact", { name: v })} error={errors["contact.name"]} />
          <Input label="Email" id="contact.email" type="email" required autoComplete="email" inputMode="email" value={value.contact.email} onChange={(v) => set("contact", { email: v })} error={errors["contact.email"]} />
          <Input label="Phone" id="contact.phone" type="tel" required autoComplete="tel" inputMode="tel" value={value.contact.phone} onChange={(v) => set("contact", { phone: v })} error={errors["contact.phone"]} />
          <Input
            label="Business or brokerage"
            id="contact.businessName"
            optional
            autoComplete="organization"
            value={value.contact.businessName}
            onChange={(v) => set("contact", { businessName: v })}
            error={errors["contact.businessName"]}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold">Shoot location</legend>
        <p className="mt-1 text-sm text-mist">Where should we fly? We&apos;ll check airspace for this address before your shoot.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <Label htmlFor="address.line1" required>
              Street address
            </Label>
            <AddressAutocomplete
              id="address.line1"
              apiKey={googleMapsKey}
              value={a.line1}
              error={errors["address.line1"]}
              onChange={(v) => set("address", { line1: v, placeId: undefined, lat: undefined, lng: undefined })}
              onSelect={(p) => set("address", { line1: p.line1, city: p.city || a.city, state: p.state || a.state, zip: p.zip || a.zip, placeId: p.placeId, lat: p.lat, lng: p.lng })}
            />
            <ErrorText id="address.line1" error={errors["address.line1"]} />
            {a.placeId && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-success">
                <CircleCheck className="size-3.5" aria-hidden /> Address verified with Google
              </p>
            )}
          </div>
          <div className="sm:col-span-6">
            <Input label="Apartment, unit, or suite" id="address.line2" optional autoComplete="address-line2" value={a.line2} onChange={(v) => set("address", { line2: v })} />
          </div>
          <div className="sm:col-span-3">
            <Input label="City" id="address.city" required autoComplete="address-level2" value={a.city} onChange={(v) => set("address", { city: v, placeId: undefined })} error={errors["address.city"]} />
          </div>
          <div className="sm:col-span-1">
            <Input
              label="State"
              id="address.state"
              required
              autoComplete="address-level1"
              maxLength={2}
              value={a.state}
              onChange={(v) => set("address", { state: v.toUpperCase(), placeId: undefined })}
              error={errors["address.state"]}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="ZIP code"
              id="address.zip"
              required
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={10}
              value={a.zip}
              onChange={(v) => set("address", { zip: v, placeId: undefined })}
              error={errors["address.zip"]}
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold">Project details</legend>
        <div className="mt-4 grid gap-4">
          <div>
            <Label htmlFor="project.propertyType">Property type</Label>
            <select id="project.propertyType" className="field" value={value.project.propertyType} onChange={(e) => set("project", { propertyType: e.target.value })}>
              <option value="">Select…</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <TextArea
            label={service === "timelapse" ? "What work are we capturing?" : "Tell us about the property"}
            id="project.description"
            placeholder={service === "timelapse" ? "e.g. Full roof tear-off and replacement, 2-story colonial. Crew starts at 8am." : "e.g. 4-bed waterfront colonial, pool, dock. Listing goes live next week."}
            value={value.project.description}
            onChange={(v) => set("project", { description: v })}
            error={errors["project.description"]}
          />
          <TextArea
            label="Preferred filming requirements"
            id="project.filmingRequirements"
            optional
            placeholder="Specific angles, shots, golden-hour preference, aspect ratios…"
            value={value.project.filmingRequirements}
            onChange={(v) => set("project", { filmingRequirements: v })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextArea label="Special instructions" id="project.specialInstructions" optional rows={3} value={value.project.specialInstructions} onChange={(v) => set("project", { specialInstructions: v })} />
            <TextArea
              label="Property access notes"
              id="project.accessNotes"
              optional
              rows={3}
              placeholder="Gate codes, parking, on-site contact…"
              value={value.project.accessNotes}
              onChange={(v) => set("project", { accessNotes: v })}
            />
          </div>
          {service === "realestate" && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-ink/40 p-4">
              <input type="checkbox" className="mt-1 size-5 accent-[#20B8FF]" checked={value.project.fpvInterest} onChange={(e) => set("project", { fpvInterest: e.target.checked })} />
              <span>
                <span className="font-semibold">I&apos;m interested in an Interior FPV fly-through</span>
                <span className="block text-sm text-mist">Quoted separately — we&apos;ll follow up with pricing. Not included in today&apos;s total.</span>
              </span>
            </label>
          )}
        </div>
      </fieldset>
    </div>
  );
}

function Label({ htmlFor, children, required, optional }: { htmlFor: string; children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">
      {children} {required && <span className="text-accent" aria-hidden>*</span>}
      {optional && <span className="font-normal text-mist">(optional)</span>}
    </label>
  );
}
function ErrorText({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={`${id}-err`} className="mt-1 text-sm text-danger">
      {error}
    </p>
  ) : null;
}

function Input({
  label,
  id,
  value,
  onChange,
  error,
  required,
  optional,
  ...rest
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  optional?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "id">) {
  return (
    <div>
      <Label htmlFor={id} required={required} optional={optional}>
        {label}
      </Label>
      <input
        id={id}
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-required={required}
        aria-describedby={error ? `${id}-err` : undefined}
        {...rest}
      />
      <ErrorText id={id} error={error} />
    </div>
  );
}

function TextArea({
  label,
  id,
  value,
  onChange,
  error,
  optional,
  rows = 4,
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  optional?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <textarea
        id={id}
        rows={rows}
        className="field resize-y"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      <ErrorText id={id} error={error} />
    </div>
  );
}
