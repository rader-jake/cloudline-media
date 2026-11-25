import { z } from "zod";
import { SERVICE_KEYS, type ServiceKey } from "@/lib/settings";

// Shared client + server validation.

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => {
    const digits = v.replace(/\D/g, "");
    return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
  }, "Enter a valid US phone number");

export const contactDetailsSchema = z.object({
  name: trimmed(120).min(2, "Enter your full name").refine((v) => v.includes(" "), "Enter your first and last name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
  phone: phoneSchema,
  businessName: optionalText(160),
});

export const US_STATES = ["NY", "NJ", "CT", "PA", "MA", "RI", "VT", "NH", "ME", "DE", "MD"] as const;

export const addressSchema = z.object({
  line1: trimmed(200).min(4, "Enter the street address").refine((v) => /\d/.test(v) && /[a-z]/i.test(v), "Include the street number and name"),
  line2: optionalText(80),
  city: trimmed(100).min(2, "Enter the city"),
  state: z.string().trim().toUpperCase().length(2, "Use the 2-letter state code"),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
  /** Set when the address was picked from Google Places. */
  placeId: optionalText(300),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const INDOOR_OUTDOOR = ["indoor", "outdoor", "both"] as const;
export const SPACE_SIZES = ["small", "medium", "large", "not_sure"] as const;
export const INTENDED_USES = ["social", "website", "ads", "other"] as const;
export const ATTENDANCE = ["Under 100", "100–500", "500–2,000", "2,000+"] as const;

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
  .refine((v) => !Number.isNaN(Date.parse(`${v}T12:00:00Z`)), "Pick a valid date");
/** Empty strings from selects/inputs → undefined. */
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.enum(values), z.literal("")])
    .optional()
    .transform((v) => (v ? (v as T[number]) : undefined));

export const projectSchema = z.object({
  /** "What are we filming?" — one of the inquiry.filming values. */
  industry: optionalText(40),
  propertyType: optionalText(60),
  description: optionalText(2000),
  filmingRequirements: optionalText(1000),
  specialInstructions: optionalText(1000),
  accessNotes: optionalText(1000),
  fpvInterest: z.boolean().optional().default(false),
  indoorOutdoor: optionalEnum(INDOOR_OUTDOOR),
  spaceSize: optionalEnum(SPACE_SIZES),
  intendedUse: z.array(z.enum(INTENDED_USES)).max(4).optional().default([]),
  socialHandle: optionalText(60),
  isVideographer: z.boolean().optional().default(false),
  eventDate: z.union([isoDate, z.literal("")]).optional().transform((v) => v || undefined),
  expectedAttendance: optionalEnum(ATTENDANCE),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const attributionSchema = z
  .object({
    utm: z.record(z.string().max(300)).optional(),
    fbp: optionalText(200),
    fbc: optionalText(300),
    consent: z.boolean().optional(),
  })
  .optional();

export const serviceKeySchema = z.enum(SERVICE_KEYS as [ServiceKey, ...ServiceKey[]]);

export const holdRequestSchema = z.object({
  service: serviceKeySchema,
  start: z.string().datetime(),
  contact: contactDetailsSchema,
  address: addressSchema,
  project: projectSchema,
  policyAccepted: z.literal(true, { errorMap: () => ({ message: "Please agree to the deposit & cancellation policy" }) }),
  /** For inquiries/quotes that were priced by the admin. */
  quote: z.object({ reference: z.string(), token: z.string() }).optional(),
  attribution: attributionSchema,
  /** Existing unpaid hold being replaced (e.g. user went back and changed time). */
  replaceHold: z.object({ reference: z.string(), token: z.string() }).optional(),
});
export type HoldRequest = z.infer<typeof holdRequestSchema>;

/** Packages someone can pick on the inquiry form ("custom" = not sure / something else). */
export const INQUIRY_PACKAGES = ["flythrough", "experience", "production", "wedding_fpv", "realestate", "timelapse", "custom"] as const;

/**
 * Inquiry / quote request (no payment). Required: name, email, phone, what we're filming, package,
 * city, preferred date. Spam protection mirrors the contact form (honeypot, time-trap, Turnstile).
 */
export const inquiryRequestSchema = z.object({
  contact: contactDetailsSchema,
  package: z.enum(INQUIRY_PACKAGES, { errorMap: () => ({ message: "Choose a package (or \"Not sure yet\")" }) }),
  location: z.object({
    city: trimmed(100).min(2, "Enter the city or town"),
    state: z.string().trim().toUpperCase().length(2).optional().default("NY"),
  }),
  preferredDate: isoDate,
  project: projectSchema.extend({ industry: trimmed(40).min(1, "Tell us what we're filming") }),
  attribution: attributionSchema,
  website: z.string().max(0).optional(),
  startedAt: z.number().optional(),
  turnstileToken: z.string().optional(),
});
export type InquiryRequest = z.infer<typeof inquiryRequestSchema>;

export const paymentRequestSchema = z.object({
  reference: z.string().min(4).max(20),
  token: z.string().min(10).max(100),
  sourceId: z.string().min(5).max(500),
  verificationToken: z.string().max(2000).optional(),
  idempotencyKey: z.string().uuid(),
});

export const contactFormSchema = z.object({
  name: trimmed(120).min(2, "Enter your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .refine((v) => !v || v.replace(/\D/g, "").length >= 10, "Enter a valid phone number"),
  service: optionalText(80),
  industry: optionalText(40),
  package: optionalText(40),
  isVideographer: z.boolean().optional(),
  message: trimmed(3000).min(10, "Tell us a little more (10+ characters)"),
  // spam protection
  website: z.string().max(0).optional(), // honeypot — must stay empty
  startedAt: z.number().optional(),
  turnstileToken: z.string().optional(),
});

export const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : v;
};

export const formatAddress = (a: { line1: string; line2?: string; city: string; state: string; zip: string }) =>
  `${a.line1}${a.line2 ? `, ${a.line2}` : ""}, ${a.city}, ${a.state} ${a.zip}`;

/** Flatten zod errors to { "address.zip": "message" } */
export function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
