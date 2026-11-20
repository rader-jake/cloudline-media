import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Tracking } from "@/components/Tracking";
import { SITE_URL } from "@/lib/env";
import { business } from "@/content/site";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Cloudline Media | Drone Videography in Queens & Long Island",
    template: "%s | Cloudline Media",
  },
  description:
    "Cinematic drone videos for real estate, construction and service businesses in Queens, Nassau & Suffolk County. Aerial property tours from $299, job time-lapses from $249. Book online with a $20 deposit.",
  keywords: [
    "drone videography Queens",
    "drone video Long Island",
    "real estate drone video Long Island",
    "aerial photography Nassau County",
    "construction time-lapse drone",
    "roofing time-lapse video",
    "FPV real estate fly-through NY",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Cloudline Media",
    title: "Cloudline Media — Elevating Your Projects",
    description: "Cinematic aerial videos for real estate, construction and service businesses in Queens & Long Island.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Cloudline Media" }],
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#06111B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const localBusiness = {
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
  makesOffer: [
    { "@type": "Offer", name: "Aerial Job Time-Lapse", priceSpecification: { "@type": "PriceSpecification", minPrice: 249, priceCurrency: "USD" } },
    { "@type": "Offer", name: "Real Estate Aerial Tour", priceSpecification: { "@type": "PriceSpecification", minPrice: 299, priceCurrency: "USD" } },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="min-h-dvh font-sans">
        {children}
        <Tracking />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
      </body>
    </html>
  );
}
