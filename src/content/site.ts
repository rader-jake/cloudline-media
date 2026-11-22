// ════════════════════════════════════════════════════════════════
// Editable website content. Prices / durations / service area live in the
// database (admin → Settings); everything else on the marketing page is here.
// ════════════════════════════════════════════════════════════════

export const hero = {
  location: "Queens · Long Island · New York",
  headline: ["Your work.", "From a higher", "perspective."],
  sub: "Drone films and aerial time-lapses that make your projects impossible to ignore.",
  primaryCta: "Book Your Shoot",
  secondaryCta: "See What We Create",
  /**
   * Background video. Leave empty to use the still image.
   * Recommended: 1080p H.264 MP4, 8–15s seamless loop, < 4 MB, no audio track
   * (host on your CDN / Supabase Storage / Mux). Mobile gets `mobileVideoSrc` if set.
   * If the footage isn't Cloudline client work, keep `mediaNote` accurate.
   */
  videoSrc: "",
  mobileVideoSrc: "",
  poster: "/media/hero-estate.webp",
  posterAlt: "Aerial view of a waterfront home at sunset",
  /** Shown discreetly on the image. Set to "" only when the media is Cloudline client work. */
  mediaNote: "Illustrative imagery",
};

/** Short positioning statement under the hero. Every fact here must stay true. */
export const intro = {
  statement: "Aerial films for the people who build, sell and transform property across Queens and Long Island.",
  facts: [
    { k: "4K", v: "Shot in 4K and color-graded" },
    { k: "48h", v: "Edited delivery, subject to scope" },
    { k: "$20", v: "Deposit holds your date — credited to your total" },
  ],
};

export const packages = {
  timelapse: {
    key: "timelapse" as const,
    eyebrow: "Package 1",
    title: "Aerial Job Time-Lapse",
    displayTitle: ["Aerial job", "time-lapse"],
    tagline: "Hours of work. Seconds of impact.",
    headline: "Turn Hours of Work Into Seconds of Incredible Content.",
    description:
      "Showcase your team's hard work with a cinematic aerial time-lapse. Perfect for contractors and service businesses looking to demonstrate the transformation of a project.",
    idealFor: ["Roofing", "Construction", "Christmas lighting", "Landscaping", "Commercial snow removal", "Paving & installs"],
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
    image: "/media/roof-clean.webp",
    imageAlt: "Aerial view of a roofing crew replacing shingles",
  },
  realestate: {
    key: "realestate" as const,
    eyebrow: "Package 2",
    title: "Real Estate Aerial Films",
    displayTitle: ["Real estate", "aerial films"],
    tagline: "Show more than a property. Show its potential.",
    headline: "Show Every Property From a New Perspective.",
    description:
      "Give buyers and tenants the full picture — the home, the lot, the neighborhood and the setting — with a cinematic exterior aerial film. Interior FPV fly-throughs are available as a separately quoted upgrade.",
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
    image: "/media/estate-frame.webp",
    imageAlt: "Aerial view of a large home with a pool, framed by trees",
  },
};

export const howItWorks = [
  { title: "Choose Your Package", body: "Select the video service that fits your project.", icon: "package" },
  { title: "Schedule Your Shoot", body: "Choose your preferred date and time.", icon: "calendar" },
  { title: "Secure Your Booking", body: "Enter the shoot location and pay a $20 deposit.", icon: "lock" },
  { title: "We Capture & Deliver", body: "Our team films, edits, and delivers your finished video.", icon: "film" },
] as const;

/** Ad landing pages (/time-lapse, /real-estate). Keep every statement true — no results promises. */
export const landing = {
  timelapse: {
    path: "/time-lapse",
    metaTitle: "Aerial Job Time-Lapse for Contractors — Queens & Long Island",
    metaDescription:
      "Turn a day on the job into a 20–45-second aerial time-lapse for your socials. Roofing, construction, holiday lighting, landscaping and snow removal. From $249 — book online with a $20 deposit.",
    audience: "For contractors & seasonal service businesses",
    heroLine: "Your crew does the work. We make it impossible to scroll past.",
    benefits: [
      { title: "Proof of craft", body: "Show prospects how your crew works, start to finish — the kind of content a photo of the finished job can't match." },
      { title: "Built for social", body: "A vertical edit sized for Facebook, Instagram and TikTok, with your logo and licensed music." },
      { title: "Zero lift for your crew", body: "We set up, fly and edit. Your team just does the job they were already doing." },
    ],
    faq: ["Can you film my entire construction project?", "How long does filming take?", "What happens if it rains?", "Is the $20 deposit applied to the total?", "Is every location flyable?"],
  },
  realestate: {
    path: "/real-estate",
    metaTitle: "Real Estate Drone Video — Queens & Long Island Listings",
    metaDescription:
      "Cinematic exterior aerial films for listings in Queens, Nassau and Suffolk. Listing-ready and vertical versions, delivered within 48 hours, subject to scope. From $299 — book online with a $20 deposit.",
    audience: "For agents, brokers & property owners",
    heroLine: "Buyers fall for the setting before they ever walk in. Show it to them.",
    benefits: [
      { title: "Context sells", body: "The lot, the water, the tree line, the street — aerials show what ground-level photos can't." },
      { title: "Listing-ready delivery", body: "A 30–60-second edit for the listing plus a vertical version for your socials." },
      { title: "Fast turnaround", body: "Delivered within 48 hours after the shoot, subject to the agreed scope." },
    ],
    faq: ["How long does filming take?", "Can you fly inside a house?", "When will I receive my video?", "Is every location flyable?", "Can I reschedule my shoot?"],
  },
};

/**
 * "The Possibilities." — a showcase of what we can film, NOT a portfolio.
 * `video`: optional featured reel. `kind` controls the honesty label shown on it:
 *   "client"       → real Cloudline Media work (only when verified)
 *   "illustrative" → licensed stock / sample footage
 *   "concept"      → AI-generated concept visualization
 */
export const showcase = {
  title: "The Possibilities.",
  sub: "Every project has a story worth capturing.",
  video: null as null | { src: string; poster: string; kind: "client" | "illustrative" | "concept" },
  scenes: [
    { label: "Roof replacements", service: "timelapse" },
    { label: "New construction", service: "timelapse" },
    { label: "Holiday lighting installs", service: "timelapse" },
    { label: "Landscape transformations", service: "timelapse" },
    { label: "Commercial snow removal", service: "timelapse" },
    { label: "Waterfront listings", service: "realestate" },
    { label: "Luxury estates", service: "realestate" },
    { label: "Commercial properties", service: "realestate" },
  ] as const,
};

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
    a: "Yes. Contact us at least 48 hours before your shoot to reschedule at no charge or cancel for a full deposit refund. If weather or airspace prevents the flight, we'll reschedule free of charge. Full terms are shown before you pay.",
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
  headline: ["Ready for", "takeoff?"],
  sub: "Pick a date, drop the address, and secure your shoot with a $20 deposit that's credited to your total.",
  image: "/media/skyline-sunset.webp",
};

export const business = {
  name: "Cloudline Media",
  tagline: "Aerial Films • Property Tours • Project Time-Lapses",
  description: "Cinematic drone videography for real estate, construction, and service businesses in Queens, Long Island & surrounding New York areas.",
  areaServed: ["Queens", "Nassau County", "Suffolk County", "Long Island", "Brooklyn", "New York"],
  social: { instagram: "", facebook: "" },
};
