// ════════════════════════════════════════════════════════════════
// Editable website content. Prices / durations / service area live in the
// database (admin → Settings); everything else on the marketing page is here.
// ════════════════════════════════════════════════════════════════

export const hero = {
  eyebrow: "Immersive FPV drone films",
  location: "Queens · Long Island · New York",
  headline: ["Don't just show it.", "Take them inside."],
  sub: "Cinematic fly-through films for venues, businesses, and experiences worth stepping inside.",
  primaryCta: "See FPV Packages",
  secondaryCta: "Book a Shoot",
  /**
   * Background loop (muted, no audio, 8–12 s). The poster is the first frame and is also the still
   * shown on slow connections / Data Saver / reduced motion. Re-encode with scripts/encode-hero.sh.
   * Set any src to "" to fall back to the poster image only.
   */
  video: {
    mp4: "/media/hero/hero-fpv.mp4",
    webm: "/media/hero/hero-fpv.webm",
    mobileMp4: "/media/hero/hero-fpv-mobile.mp4",
  },
  poster: "/media/hero/hero-fpv-poster.webp",
  posterMobile: "/media/hero/hero-fpv-poster-mobile.webp",
  posterAlt: "FPV-style flight through the open doors of a candlelit venue",
  /**
   * Honesty caption in the corner. "Concept visualization" = AI-generated (current clip);
   * "Illustrative footage" = licensed stock. Set to "" only once it's Cloudline's own footage.
   */
  mediaNote: "Concept visualization",
};

/** Value strip + "The FPV Difference" (one section). Every fact here must stay true. */
export const intro = {
  label: "The FPV difference",
  headline: "One perspective can change everything.",
  /** Rendered with "through" emphasized. */
  sentence: "FPV drones fly through a space, not just over it: in the front door, past what makes you different, and right into the experience.",
  compare: {
    columns: ["Traditional aerial", "FPV"],
    rows: [
      ["Shows the outside from above", "Takes viewers inside and through"],
      ["Wide, slow establishing shots", "Flowing, close, dynamic movement"],
      ["Great for land and exteriors", "Built for spaces and experiences"],
    ],
  },
  finePrint: "Every flight path is planned around the location's layout, safety, permissions, and regulations.",
  facts: [
    { k: "In + Out", v: "Indoor & outdoor FPV flights" },
    { k: "9:16 · 16:9", v: "Edited for social and web — vertical and horizontal" },
    { k: "$20", v: "Deposit holds your date, credited to your total" },
  ],
};

/**
 * FPV packages. Prices, durations and turnaround come from admin → Settings
 * (keys: flythrough, experience, production) so the server and the page always agree.
 */
export const fpvPackages = {
  label: "The Cloudline launch special",
  headline: "Extraordinary content. Launch pricing.",
  line: "We're opening with introductory rates on our FPV productions while we build our New York portfolio.",
  items: [
    {
      key: "flythrough" as const,
      index: "01",
      eyebrow: "For local businesses",
      displayTitle: ["FPV", "Fly-through"],
      tagline: "Step inside. Before they ever visit.",
      body: "A smooth, cinematic flight through your space, from the front door to the part customers remember. Cut for Reels, TikTok, and your website.",
      idealFor: ["Home listings", "Restaurants & bars", "Gyms", "Boutiques", "Auto shops", "Studios", "Entertainment venues"],
      includes: ["Up to 1 hour on location", "One planned FPV flight path", "One edited 15–30s vertical video", "Licensed music & color grade", "One minor revision"],
      cta: "Book the Fly-Through",
      action: "book" as const,
      image: "/media/fpv/home.webp",
      imageAlt: "Concept frame: flying up the front walk toward a modern home's glass entrance at dusk",
      hud: { left: "FPV", right: "Flight path", caption: "Entrance → Experience", timecode: "00:00:30" },
    },
    {
      key: "experience" as const,
      index: "02",
      eyebrow: "For venues & destinations",
      displayTitle: ["The", "Experience"],
      tagline: "Don't just showcase your business. Let people experience it.",
      body: "",
      idealFor: [],
      includes: [
        "Up to 3 hours of production",
        "Multiple FPV sequences",
        "Traditional aerial where appropriate and permitted",
        "One 45–60s film",
        "Vertical + horizontal versions",
        "Two short social cutdowns",
        "Licensed music & color grade",
        "One revision",
      ],
      cta: "Book the Experience",
      action: "book" as const,
      image: "/media/fpv/venue.webp",
      imageAlt: "Concept frame: open doors into a chandelier-lit event venue at sunset",
    },
    {
      key: "production" as const,
      index: "03",
      eyebrow: "For brands & resorts",
      displayTitle: ["The", "Production"],
      tagline: "Built for ambitious brands and extraordinary experiences.",
      body: "",
      idealFor: [],
      includes: [
        "Up to a full production day (hours confirmed in the proposal)",
        "Creative direction",
        "FPV + traditional aerial",
        "Ground cinematography where scoped",
        "One 60–90s film",
        "Five social cutdowns",
        "Vertical + horizontal versions",
        "Full post-production",
      ],
      cta: "Plan Your Production",
      action: "inquire" as const,
      note: "No deposit until we send a confirmed quote.",
      image: "/media/fpv/rooftop-night.webp",
      imageAlt: "Concept frame: a rooftop bar overlooking the Manhattan skyline at night",
    },
  ],
  finePrint:
    "All productions depend on location suitability, safety, permissions, and agreed scope. Extra crew, permits, specialty equipment, or travel beyond our service area may add cost, and we'll confirm any of that before you pay a deposit. NYC shoots often need permits and extra lead time.",
};

/** Industries. Tapping a tile opens the inquiry form with the industry + recommended package prefilled. */
export const industries = {
  label: "Built for the extraordinary",
  headline: "If it can be experienced, it can be filmed differently.",
  footer: "Don't see yours? If people can walk through it, we can probably fly through it.",
  /** `image`: 16:10 or wider, ≥1280px wide WebP. Leave "" for the designed no-photo tile. */
  items: [
    {
      key: "real-estate",
      name: "Luxury Real Estate & Architecture",
      hook: "Let buyers walk through before they ever visit.",
      uses: ["Luxury estates", "Waterfront homes", "Penthouses & condos", "New developments", "Commercial spaces", "Architectural showcases", "Short-term rentals"],
      recommend: "The Fly-Through or The Experience",
      package: "flythrough",
      image: "/media/fpv/home.webp",
      featured: true,
    },
    {
      key: "weddings",
      name: "Wedding Venues & Wedding Days",
      hook: "Let couples experience the venue before they book.",
      uses: ["Venue promo films", "Estate & ballroom walkthroughs", "Ceremony & reception reveals", "Wedding-day FPV moments", "Add-on for wedding videographers"],
      recommend: "The Experience, or Wedding-Day FPV (quote)",
      package: "experience",
      image: "/media/fpv/ballroom.webp",
      featured: true,
    },
    {
      key: "nightlife-events",
      name: "Nightlife, Concerts & Live Events",
      hook: "Capture the energy, not just the crowd.",
      uses: ["Nightclubs & lounges", "Rooftop bars", "Concerts & festivals", "Brand activations & pop-ups", "Galas & corporate events", "Sporting events"],
      recommend: "The Experience or The Production",
      package: "production",
      image: "/media/fpv/rooftop.webp",
    },
    {
      key: "creators-brands",
      name: "Creators, Music & Brands",
      hook: "Content your audience hasn't scrolled past a hundred times.",
      uses: ["Content creators & YouTubers", "Music videos", "Product launches", "Ad campaigns", "Action sports (skate, BMX, motocross, snow)"],
      recommend: "The Experience or The Production",
      package: "experience",
      image: "/media/fpv/skate.webp",
    },
    {
      key: "entertainment",
      name: "Entertainment & Recreation",
      hook: "Give customers a reason to walk through your doors.",
      uses: ["Go-kart tracks", "Climbing gyms", "Trampoline parks", "Escape rooms", "Bowling & arcades", "Pickleball", "Immersive attractions"],
      recommend: "The Fly-Through or The Experience",
      package: "flythrough",
      image: "/media/fpv/gokart.webp",
    },
    {
      key: "restaurants-retail",
      name: "Restaurants, Retail & Fitness",
      hook: "Show the experience, not just the location.",
      uses: ["Restaurants & bars", "Breweries", "Boutiques", "Gyms & studios", "Salons & spas", "Creative studios"],
      recommend: "The Fly-Through",
      package: "flythrough",
      image: "/media/fpv/restaurant.webp",
    },
    {
      key: "hospitality",
      name: "Hospitality & Resorts",
      hook: "Turn viewers into visitors.",
      uses: ["Boutique hotels", "Destination resorts", "Ski resorts", "Golf courses", "Wineries", "Marinas"],
      recommend: "The Experience or The Production",
      package: "experience",
      image: "/media/fpv/resort.webp",
    },
    {
      key: "automotive",
      name: "Automotive",
      hook: "Capture performance in motion.",
      uses: ["Exotic showrooms", "Dealerships", "Custom garages", "Detailing & tint shops", "Car meets", "Controlled track days"],
      recommend: "The Fly-Through or The Experience",
      package: "flythrough",
      image: "",
    },
  ],
};

/** Inquiry form options. Values are stored with the inquiry. */
export const inquiry = {
  filming: [
    ...[
      ["real-estate", "Luxury real estate & architecture"],
      ["weddings", "Wedding venue"],
      ["wedding-day", "Wedding day"],
      ["nightlife-events", "Nightlife, concert or live event"],
      ["creators-brands", "Brand, music or campaign"],
      ["creator", "I'm a content creator"],
      ["entertainment", "Entertainment & recreation"],
      ["restaurants-retail", "Restaurant, retail or fitness"],
      ["hospitality", "Hospitality & resorts"],
      ["automotive", "Automotive"],
      ["other", "Other"],
    ].map(([value, label]) => ({ value, label })),
  ],
  packages: [
    { value: "flythrough", label: "The Fly-Through" },
    { value: "experience", label: "The Experience" },
    { value: "production", label: "The Production" },
    { value: "wedding_fpv", label: "Wedding-Day FPV" },
    { value: "realestate", label: "Real estate aerial tour" },
    { value: "timelapse", label: "Aerial job time-lapse" },
    { value: "custom", label: "Custom / not sure yet" },
  ],
  weddingNote: "Add an FPV moment to your wedding film. Planned with your venue and videographer, so you know exactly what you're getting.",
};

/** "More ways to elevate your project" — quieter list of the aerial services. */
export const moreServices = {
  label: "More ways to elevate your project",
  items: [
    { key: "realestate", title: "Real estate aerial tours", href: "/real-estate" },
    { key: "timelapse", title: "Aerial job time-lapses", href: "/time-lapse" },
    { key: "commercial", title: "Commercial aerial cinematography", href: "/#contact", price: "Custom quote" },
    { key: "custom", title: "Custom projects", href: "/#contact", price: "Custom quote" },
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
      "Give buyers and tenants the full picture — the home, the lot, the neighborhood and the setting — with a cinematic exterior aerial film.",
    idealFor: ["Real estate agents", "Property owners", "Luxury listings", "Rental properties", "Developers", "Commercial properties"],
    includes: [
      "Exterior aerial property filming",
      "Front, rear, and surrounding property views where permitted",
      "One professionally edited 30–60-second video",
      "Vertical social media version",
      "Listing-ready digital delivery",
      "Delivery within 48 hours after the shoot, subject to the agreed scope",
    ],
    pricePrefix: "Aerial tours from",
    cta: "Book Property Tour",
    image: "/media/estate-frame.webp",
    imageAlt: "Aerial view of a large home with a pool, framed by trees",
  },
};

export const howItWorks = [
  { title: "Choose a package", body: "Or tell us about a custom project." },
  { title: "Pick a date and share your location", body: "Real-time availability, booked in a few minutes." },
  { title: "We confirm the flight plan", body: "We review the space for safety and permissions. Your $20 deposit holds the date." },
  { title: "Get your film", body: "Edited and ready to post." },
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
    faq: ["Can you film my entire construction project?", "How long does filming take?", "What happens with bad weather?", "Is the $20 deposit applied to the total?", "Is every location flyable?"],
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
    faq: ["How long does filming take?", "When will I receive my video?", "Is every location flyable?", "Can I reschedule my shoot?", "Where do you film?"],
  },
};

/**
 * "Imagine the possibilities" — what FPV can capture, NOT a portfolio.
 * Add real videos later by filling in `poster` + `videoUrl` on an item. `isIllustrative: true`
 * labels it as not-our-work (stock or AI); set false ONLY for verified Cloudline footage.
 * The first item with a videoUrl is featured; without any, the section shows the flight-plan frame.
 */
export type ShowcaseItem = { title: string; industry: string; poster?: string; videoUrl?: string; isIllustrative: boolean };
export const showcase = {
  title: "Imagine the possibilities",
  sub: "Every project has a story worth capturing.",
  items: [
    { title: "A venue reveal", industry: "Wedding venues", isIllustrative: true },
    { title: "A go-kart lap", industry: "Entertainment", isIllustrative: true },
    { title: "A showroom fly-through", industry: "Automotive", isIllustrative: true },
    { title: "A hotel arrival", industry: "Hospitality", isIllustrative: true },
    { title: "A rooftop bar at golden hour", industry: "Nightlife", isIllustrative: true },
    { title: "Front door to the dance floor", industry: "Events", isIllustrative: true },
    { title: "A penthouse walkthrough", industry: "Real estate", isIllustrative: true },
    { title: "A drop into the bowl", industry: "Action sports", isIllustrative: true },
  ] as ShowcaseItem[],
};

/** FAQ — keep answers short and accurate; nothing here promises flight availability. */
export const faq = [
  {
    q: "What is FPV?",
    a: "FPV (first-person view) drones are small, agile drones flown through a space rather than above it — in the door, down the hall, around the room — for a smooth, immersive shot a regular drone can't get.",
  },
  {
    q: "Can you fly inside my business?",
    a: "Usually, yes. It depends on the layout, ceiling height and safety. We review the space with you before confirming the shoot.",
  },
  {
    q: "What happens with bad weather?",
    a: "Indoor shoots are largely unaffected. Outdoor flights depend on wind and rain — if conditions aren't safe, we reschedule at no charge and your deposit carries over.",
  },
  {
    q: "Is the $20 deposit applied to the total?",
    a: "Yes. It holds your date and is credited toward your final price — it's not an extra fee. Cancel or reschedule at least 48 hours ahead for a full deposit refund or a free reschedule.",
  },
  {
    q: "Do you film full weddings?",
    a: "No. We plan specific FPV moments — a grand entrance, a first-dance reveal, the exit — with your venue and videographer, so they fit into your wedding film.",
  },
  {
    q: "Can you fly at concerts or packed events?",
    a: "Yes, with planning. Flights are coordinated with the venue and organizer and built around crowd safety and regulations — often before doors open or in controlled areas.",
  },
  {
    q: "What if my location can't be filmed — or needs a permit?",
    a: "Some spaces and airspace (Queens sits near JFK and LaGuardia) have limits, and NYC shoots often need permits and lead time. We confirm any added fees before you pay. If a location can't be filmed safely or legally, we'll suggest alternatives or refund your deposit.",
  },
  {
    q: "Where do you film?",
    a: "We're based in Queens and Long Island and film across NYC and New York. For locations further out, contact us — travel may be possible for an additional fee.",
  },
  // ── Used on the /time-lapse and /real-estate pages ──
  {
    q: "How long does filming take?",
    a: "Real estate aerial tours typically take about 60–90 minutes on site. Job time-lapses include up to 2 hours of scheduled coverage. Larger properties or custom projects may take longer — we'll confirm timing with you before the shoot.",
  },
  {
    q: "Can you film my entire construction project?",
    a: "Our standard time-lapse package covers up to 2 hours of on-site coverage, captured in intervals between battery changes. For full-day coverage or multi-visit progress documentation over weeks or months, contact us for a custom quote.",
  },
  {
    q: "When will I receive my video?",
    a: "Aerial tours and time-lapses are typically delivered digitally within 48 hours after the shoot, subject to the agreed scope. Custom or larger projects may need more time — we'll let you know up front.",
  },
  {
    q: "Can I reschedule my shoot?",
    a: "Yes. Contact us at least 48 hours before your shoot to reschedule at no charge or cancel for a full deposit refund. If weather or airspace prevents the flight, we'll reschedule free of charge. Full terms are shown before you pay.",
  },
  {
    q: "Is every location flyable?",
    a: "Not always. Some locations are in controlled or restricted airspace (Queens is near JFK and LaGuardia). We check airspace and obtain any required FAA authorizations before your shoot. If a location can't be flown legally or safely, we'll let you know and discuss options.",
  },
];

/** The questions shown on the homepage (8 max). */
export const HOME_FAQ = faq.slice(0, 8).map((f) => f.q);

export const finalCta = {
  headline: ["Ready for", "takeoff?"],
  sub: "Book a package with a $20 deposit that's credited to your total — or tell us what you're picturing and we'll plan the flight with you.",
  image: "/media/skyline-sunset.webp",
};

export const business = {
  name: "Cloudline Media",
  tagline: "FPV Fly-Throughs • Aerial Films • Project Time-Lapses",
  description:
    "Immersive FPV drone films for luxury real estate, wedding venues, nightlife, events, and local businesses. Based in Queens and Long Island, serving NYC and New York.",
  areaServed: ["Queens", "Nassau County", "Suffolk County", "Long Island", "Brooklyn", "New York"],
  social: { instagram: "", facebook: "" },
};
