// ════════════════════════════════════════════════════════════════
// Editable website content. Prices / durations / service area live in the
// database (admin → Settings); everything else on the marketing page is here.
// ════════════════════════════════════════════════════════════════

export const hero = {
  eyebrow: "Aerial Video Production",
  /**
   * Background video. Leave empty to use the still image.
   * Recommended: 1080p H.264 MP4, 8–15s seamless loop, < 4 MB, no audio track
   * (host on your CDN / Supabase Storage / Mux). Mobile gets `mobileVideoSrc` if set.
   */
  videoSrc: "",
  mobileVideoSrc: "",
  poster: "/media/hero-estate.webp",
  posterAlt: "Aerial view of a waterfront luxury home at sunset",
};

export const packages = {
  timelapse: {
    key: "timelapse" as const,
    eyebrow: "Package 1",
    title: "Aerial Job Time-Lapse",
    headline: "Turn Hours of Work Into Seconds of Incredible Content.",
    description:
      "Showcase your team's hard work with a cinematic aerial time-lapse. Perfect for contractors and service businesses looking to demonstrate the transformation of a project.",
    idealFor: ["Roofing", "Construction", "Landscaping", "Paving", "Installations", "Property transformations"],
    includes: [
      "Up to 2 hours of scheduled on-site coverage",
      "Aerial progress footage with battery-change intervals",
      "One professionally edited 20–45-second time-lapse video",
      "Vertical format optimized for social media",
      "Business logo and licensed background music",
      "Digital delivery within 48 hours after the shoot, subject to the agreed scope",
      "One minor editing revision",
    ],
    disclaimer:
      "Footage is captured in intervals between battery changes — it shows the transformation but isn't guaranteed to document every moment continuously.",
    pricePrefix: "Starting at",
    cta: "Book Time-Lapse",
    image: "/media/timelapse-roof.webp",
    imageAlt: "Aerial view of a roofing crew replacing shingles",
    previewVideo: "", // optional short muted loop (MP4)
  },
  realestate: {
    key: "realestate" as const,
    eyebrow: "Package 2",
    title: "Real Estate Fly-Through + Aerial",
    headline: "Show Every Property From a New Perspective.",
    description:
      "Help potential buyers and tenants experience your property with cinematic aerial footage and optional immersive interior fly-throughs.",
    idealFor: ["Real estate agents", "Property owners", "Luxury listings", "Rental properties", "Developers", "Commercial properties"],
    includes: [
      "Exterior aerial property filming",
      "Front, rear, and surrounding property views where permitted",
      "One professionally edited 30–60-second video",
      "Vertical social media version",
      "Listing-ready digital delivery",
      "Delivery within 48 hours after the shoot, subject to the agreed scope",
    ],
    upgrade: {
      title: "Optional upgrade: Interior FPV Fly-Through",
      body: "A smooth, immersive indoor flight through the home. Quoted separately based on size and layout — not included in the aerial tour price.",
      cta: "Request an FPV quote",
    },
    pricePrefix: "Aerial tours from",
    cta: "Book Property Tour",
    image: "/media/estate-aerial.webp",
    imageAlt: "Aerial view of a luxury home with a pool",
    previewVideo: "",
  },
};

export const howItWorks = [
  { title: "Choose Your Package", body: "Select the video service that fits your project.", icon: "package" },
  { title: "Schedule Your Shoot", body: "Choose your preferred date and time.", icon: "calendar" },
  { title: "Secure Your Booking", body: "Enter the shoot location and pay a $20 deposit.", icon: "lock" },
  { title: "We Capture & Deliver", body: "Our team films, edits, and delivers your finished video.", icon: "film" },
] as const;

export const benefits = [
  { title: "Cinematic 4K Quality", body: "Shot in 4K and color-graded for a polished, premium look on every screen.", icon: "4k" },
  { title: "Fast Turnaround", body: "Edited videos delivered within 48 hours of your shoot, subject to scope.", icon: "bolt" },
  { title: "Queens & Long Island", body: "Local pilots serving Queens, Nassau, Suffolk and surrounding areas.", icon: "pin" },
  { title: "Simple, Upfront Pricing", body: "Clear starting prices. A $20 deposit holds your date and is credited to your total.", icon: "tag" },
] as const;

/**
 * Portfolio. Replace placeholders with real projects:
 *   - set `placeholder: false`
 *   - `video`: { type: "youtube", id: "VIDEO_ID" } | { type: "vimeo", id: "123" } | { type: "mp4", src: "https://..." }
 *   - `thumbnail`: path in /public/media or a remote URL allowed in next.config.ts
 * Videos are only loaded when a visitor opens them.
 */
export type PortfolioVideo = { type: "youtube"; id: string } | { type: "vimeo"; id: string } | { type: "mp4"; src: string };
export interface PortfolioItem {
  id: string;
  title: string;
  category: "timelapse" | "realestate";
  location?: string;
  thumbnail: string;
  thumbnailPosition?: string;
  video: PortfolioVideo | null;
  placeholder: boolean;
}

export const portfolio: PortfolioItem[] = [
  { id: "p1", title: "Roof Replacement Time-Lapse", category: "timelapse", thumbnail: "/media/timelapse-roof.webp", thumbnailPosition: "50% 50%", video: null, placeholder: true },
  { id: "p2", title: "Waterfront Estate Aerial Tour", category: "realestate", thumbnail: "/media/hero-estate.webp", thumbnailPosition: "55% 60%", video: null, placeholder: true },
  { id: "p3", title: "New Construction Progress", category: "timelapse", thumbnail: "/media/skyline-sunset.webp", thumbnailPosition: "50% 70%", video: null, placeholder: true },
  { id: "p4", title: "Luxury Listing Exterior", category: "realestate", thumbnail: "/media/estate-aerial.webp", thumbnailPosition: "50% 50%", video: null, placeholder: true },
  { id: "p5", title: "Landscape Transformation", category: "timelapse", thumbnail: "/media/hero-estate.webp", thumbnailPosition: "20% 85%", video: null, placeholder: true },
  { id: "p6", title: "Neighborhood Overview", category: "realestate", thumbnail: "/media/hero-estate.webp", thumbnailPosition: "80% 20%", video: null, placeholder: true },
];

/** FAQ — keep answers accurate; nothing here promises flight availability. */
export const faq = [
  {
    q: "What happens if it rains?",
    a: "Safety comes first. We don't fly in rain, high winds, or low visibility. If the forecast or on-site conditions aren't safe, we'll contact you to reschedule at no extra charge, and your deposit carries over to the new date.",
  },
  {
    q: "How long does filming take?",
    a: "Real estate aerial tours typically take about 60–90 minutes on site. Job time-lapses include up to 2 hours of scheduled coverage. Larger properties or custom projects may take longer — we'll confirm timing with you before the shoot.",
  },
  {
    q: "Can you film my entire construction project?",
    a: "Our standard time-lapse package covers up to 2 hours of on-site coverage, captured in intervals between battery changes. For full-day coverage or multi-visit progress documentation over weeks or months, contact us for a custom quote.",
  },
  {
    q: "Can you fly inside a house?",
    a: "Yes — interior FPV fly-throughs are available as a separate, quoted upgrade. Pricing depends on the property's size and layout, so request a quote and we'll get back to you with a price before you book.",
  },
  {
    q: "When will I receive my video?",
    a: "Edited videos are typically delivered digitally within 48 hours after the shoot, subject to the agreed scope. Custom or larger projects may need more time — we'll let you know up front.",
  },
  {
    q: "Is the $20 deposit applied to the total?",
    a: "Yes. The $20 deposit secures your date and is credited toward your final price — it's not an extra fee. For example, on a $249 time-lapse you'd pay $20 today and $229 later.",
  },
  {
    q: "Can I reschedule my shoot?",
    a: "Yes. Contact us as early as possible and we'll find a new time that works. Our full deposit and cancellation terms are shown before you pay.",
  },
  {
    q: "Do you travel outside Queens and Long Island?",
    a: "We primarily serve Queens, Nassau and Suffolk, and surrounding New York areas. For locations further out, contact us — travel may be possible for an additional fee.",
  },
  {
    q: "Is every location flyable?",
    a: "Not always. Some locations are in controlled or restricted airspace (Queens is near JFK and LaGuardia). We check airspace and obtain any required FAA authorizations before your shoot. If a location can't be flown legally or safely, we'll let you know and discuss options.",
  },
];

export const finalCta = {
  headline: "Ready to Bring Your Project to Life?",
  sub: "From stunning property tours to incredible job transformations, we capture your work from a whole new perspective.",
  image: "/media/skyline-sunset.webp",
};

export const business = {
  name: "Cloudline Media",
  tagline: "Aerial Films • Property Tours • Project Time-Lapses",
  description: "Cinematic drone videography for real estate, construction, and service businesses in Queens, Long Island & surrounding New York areas.",
  areaServed: ["Queens", "Nassau County", "Suffolk County", "Long Island", "Brooklyn", "New York"],
  social: { instagram: "", facebook: "" },
};
