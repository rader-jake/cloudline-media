import type { PublicSettings, ServiceKey } from "@/lib/settings";

export interface Details {
  contact: { name: string; email: string; phone: string; businessName: string };
  address: { line1: string; line2: string; city: string; state: string; zip: string; placeId?: string; lat?: number; lng?: number };
  project: ProjectDetails;
}

/** Project fields. The FPV ones ("What are we filming?", space, usage…) only show for FPV packages. */
export interface ProjectDetails {
  industry: string;
  propertyType: string;
  description: string;
  filmingRequirements: string;
  specialInstructions: string;
  accessNotes: string;
  fpvInterest: boolean;
  indoorOutdoor: string;
  spaceSize: string;
  intendedUse: string[];
  socialHandle: string;
  isVideographer: boolean;
  eventDate: string;
  expectedAttendance: string;
}

export const emptyProject = (): ProjectDetails => ({
  industry: "",
  propertyType: "",
  description: "",
  filmingRequirements: "",
  specialInstructions: "",
  accessNotes: "",
  fpvInterest: false,
  indoorOutdoor: "",
  spaceSize: "",
  intendedUse: [],
  socialHandle: "",
  isVideographer: false,
  eventDate: "",
  expectedAttendance: "",
});

export const emptyDetails = (): Details => ({
  contact: { name: "", email: "", phone: "", businessName: "" },
  address: { line1: "", line2: "", city: "", state: "NY", zip: "" },
  project: emptyProject(),
});

export interface SelectedSlot {
  date: string;
  start: string;
  label: string;
}

export interface Hold {
  reference: string;
  token: string;
  holdExpiresAt: string;
  totalCents: number;
  depositCents: number;
  remainingCents: number;
  outsideServiceArea: boolean;
}

export interface QuoteContext {
  reference: string;
  token: string;
  totalCents: number;
  packageName: string;
}

export interface WizardConfig {
  settings: PublicSettings;
  initialService: ServiceKey | null;
  quote: { reference: string; token: string } | null;
  ready: { database: boolean; payments: boolean };
  square: { appId: string; locationId: string; env: "sandbox" | "production" };
  googleMapsKey: string;
}
