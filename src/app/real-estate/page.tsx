import type { Metadata } from "next";
import { ServiceLanding } from "@/components/ServiceLanding";
import { landing } from "@/content/site";
import { loadSettings } from "@/lib/settings-server";

export const revalidate = 60;

const l = landing.realestate;

export const metadata: Metadata = {
  title: { absolute: `${l.metaTitle} | Cloudline Media` },
  description: l.metaDescription,
  alternates: { canonical: l.path },
  openGraph: { url: l.path, title: l.metaTitle, description: l.metaDescription, images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Cloudline Media" }] },
};

export default async function Page() {
  const { settings } = await loadSettings();
  return <ServiceLanding pkg="realestate" settings={settings} />;
}
