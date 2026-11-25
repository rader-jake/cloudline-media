"use client";

import { inquiry } from "@/content/site";
import { ATTENDANCE } from "@/lib/validation";
import { ErrorText, Input, Label, TextArea } from "./fields";
import type { ProjectDetails } from "./types";

export const PROPERTY_TYPES = ["Single-family home", "Luxury estate", "Multi-family", "Condo / Co-op", "Rental property", "Commercial property", "Land / Lot", "Other"];

const WEDDING = ["weddings", "wedding-day"];
const CREATOR = ["creator", "creators-brands"];
const SIZES = [
  ["small", "Small"],
  ["medium", "Medium"],
  ["large", "Large"],
  ["not_sure", "Not sure"],
];
const USES = [
  ["social", "Instagram / TikTok"],
  ["website", "Website"],
  ["ads", "Ads"],
  ["other", "Other"],
];
const PLACES = [
  ["indoor", "Indoor"],
  ["outdoor", "Outdoor"],
  ["both", "Both"],
];

/**
 * FPV project fields, shared by the booking details step and the homepage inquiry form.
 * Conditional fields: property type (real estate), event date + attendance (live events),
 * social handle (creators), videographer checkbox (weddings).
 */
export function ProjectFields({
  value,
  onChange,
  errors,
  prefix = "project.",
  showAccessNotes = true,
}: {
  value: ProjectDetails;
  onChange: (patch: Partial<ProjectDetails>) => void;
  errors: Record<string, string>;
  /** id/error-key prefix, e.g. "project." → "project.industry" */
  prefix?: string;
  showAccessNotes?: boolean;
}) {
  const id = (k: string) => `${prefix}${k}`;
  const ind = value.industry;
  const toggleUse = (u: string) => onChange({ intendedUse: value.intendedUse.includes(u) ? value.intendedUse.filter((x) => x !== u) : [...value.intendedUse, u] });

  return (
    <div className="grid gap-4">
      <div>
        <Label htmlFor={id("industry")} required>
          What are we filming?
        </Label>
        <select
          id={id("industry")}
          className="field"
          value={ind}
          onChange={(e) => onChange({ industry: e.target.value })}
          aria-invalid={Boolean(errors[id("industry")])}
          aria-describedby={errors[id("industry")] ? `${id("industry")}-err` : undefined}
        >
          <option value="">Select…</option>
          {inquiry.filming.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ErrorText id={id("industry")} error={errors[id("industry")]} />
      </div>

      {ind === "real-estate" && (
        <div>
          <Label htmlFor={id("propertyType")} optional>
            Property type
          </Label>
          <select id={id("propertyType")} className="field" value={value.propertyType} onChange={(e) => onChange({ propertyType: e.target.value })}>
            <option value="">Select…</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      )}

      {ind === "nightlife-events" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Event date" id={id("eventDate")} type="date" optional value={value.eventDate} onChange={(v) => onChange({ eventDate: v })} error={errors[id("eventDate")]} />
          <div>
            <Label htmlFor={id("expectedAttendance")} optional>
              Expected attendance
            </Label>
            <select id={id("expectedAttendance")} className="field" value={value.expectedAttendance} onChange={(e) => onChange({ expectedAttendance: e.target.value })}>
              <option value="">Select…</option>
              {ATTENDANCE.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <p className="text-xs leading-relaxed text-mist sm:col-span-2">
            Live-event flights are planned with the venue and organizer around crowd safety — usually before doors open or in controlled areas.
          </p>
        </div>
      )}

      {CREATOR.includes(ind) && (
        <Input label="Instagram / TikTok handle" id={id("socialHandle")} optional placeholder="@yourhandle" value={value.socialHandle} onChange={(v) => onChange({ socialHandle: v })} />
      )}

      {WEDDING.includes(ind) && (
        <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 text-sm">
          <p className="leading-relaxed text-white/85">{inquiry.weddingNote}</p>
          <label className="mt-3 flex cursor-pointer items-center gap-2.5 font-semibold">
            <input type="checkbox" className="size-4 accent-[#20B8FF]" checked={value.isVideographer} onChange={(e) => onChange({ isVideographer: e.target.checked })} /> I&apos;m a wedding
            videographer
          </label>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">
            Indoor or outdoor? <span className="font-normal text-mist">(optional)</span>
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {PLACES.map(([v, l]) => (
              <label
                key={v}
                className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold transition ${value.indoorOutdoor === v ? "border-accent bg-accent/10 text-white" : "border-line text-white/75 hover:border-white/30"}`}
              >
                <input type="radio" name={id("indoorOutdoor")} value={v} className="sr-only" checked={value.indoorOutdoor === v} onChange={() => onChange({ indoorOutdoor: v })} />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <Label htmlFor={id("spaceSize")} optional>
            Approximate size of the space
          </Label>
          <select id={id("spaceSize")} className="field" value={value.spaceSize} onChange={(e) => onChange({ spaceSize: e.target.value })}>
            <option value="">Select…</option>
            {SIZES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">
          Where will the video be used? <span className="font-normal text-mist">(optional)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {USES.map(([v, l]) => {
            const on = value.intendedUse.includes(v);
            return (
              <label
                key={v}
                className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${on ? "border-accent bg-accent/10 text-white" : "border-line text-white/75 hover:border-white/30"}`}
              >
                <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleUse(v)} />
                {l}
              </label>
            );
          })}
        </div>
      </fieldset>

      <TextArea
        label="Describe the flight you're picturing"
        id={id("description")}
        optional
        placeholder="e.g. Start outside, fly through the front doors, past the bar, end on the dance floor."
        value={value.description}
        onChange={(v) => onChange({ description: v })}
        error={errors[id("description")]}
      />
      {showAccessNotes && (
        <TextArea
          label="Access notes"
          id={id("accessNotes")}
          optional
          rows={3}
          placeholder="Parking, loading entrance, on-site contact, best time to film…"
          value={value.accessNotes}
          onChange={(v) => onChange({ accessNotes: v })}
        />
      )}
    </div>
  );
}
