import { SITE_URL } from "@/lib/env";
import { business } from "@/content/site";
import { effectivePriceCents, type ServiceKey, type Settings } from "@/lib/settings";

const OFFERS: [ServiceKey, string, string][] = [
  ["flythrough", "FPV Fly-Through", "FPV drone fly-through film for local businesses and home listings"],
  ["experience", "FPV Experience", "Multi-sequence FPV film for venues and destinations"],
  ["production", "FPV Production", "Full-day FPV and aerial production for brands and resorts"],
  ["realestate", "Real Estate Aerial Tour", "Exterior aerial real estate video"],
  ["timelapse", "Aerial Job Time-Lapse", "Aerial construction and job-site time-lapse"],
];

/** LocalBusiness JSON-LD. Prices come from the same settings the booking server charges. */
export function localBusinessJsonLd(settings: Settings) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#business`,
    name: business.name,
    description: business.description,
    url: SITE_URL,
    image: `${SITE_URL}/og.jpg`,
    logo: `${SITE_URL}/brand/logo-dark.png`,
    areaServed: business.areaServed.map((a) => ({ "@type": "Place", name: a })),
    address: { "@type": "PostalAddress", addressRegion: "NY", addressCountry: "US" },
    priceRange: "$$",
    makesOffer: OFFERS.filter(([k]) => settings.services[k].active && (k !== "timelapse" || settings.display.showTimelapse)).flatMap(([k, name, description]) => {
      const cents = effectivePriceCents(settings, k);
      return cents == null
        ? []
        : [{ "@type": "Offer", itemOffered: { "@type": "Service", name, description }, priceSpecification: { "@type": "PriceSpecification", minPrice: cents / 100, priceCurrency: "USD" } }];
    }),
  };
}
