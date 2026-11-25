import type { Metadata, Viewport } from "next";
import { Archivo, Manrope } from "next/font/google";
import "./globals.css";
import { Tracking } from "@/components/Tracking";
import { SITE_URL } from "@/lib/env";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
// Wide, architectural display face for oversized headlines.
// "optional": use it only if it arrives in time — no late swap that could shift the wide headline (CLS).
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", axes: ["wdth"], display: "optional" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Cloudline Media | FPV Drone Videography in New York",
    template: "%s | Cloudline Media",
  },
  description:
    "Immersive FPV drone films for luxury real estate, wedding venues, nightlife, events, and local businesses. Based in Queens and Long Island, serving NYC and New York.",
  keywords: [
    "FPV drone videography New York",
    "FPV fly-through",
    "FPV real estate tour",
    "luxury real estate drone video",
    "Long Island drone videography",
    "wedding venue drone video",
    "event drone videography NYC",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Cloudline Media",
    title: "Cloudline Media — Don't just show it. Take them inside.",
    description: "Cinematic FPV fly-through films for venues, businesses, and experiences in New York. Based in Queens and Long Island.",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${archivo.variable}`} suppressHydrationWarning>
      <head>
        {/* Enables reveal animations only when JS runs, so content is never hidden without it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-dvh font-sans">
        {children}
        <Tracking />
      </body>
    </html>
  );
}
