import Link from "next/link";
import { Logo } from "./Logo";
import { business } from "@/content/site";
import { CookieSettingsLink } from "./Tracking";

export function Footer({ email, phone, areaLabel }: { email: string; phone: string; areaLabel: string }) {
  return (
    <footer className="border-t border-line bg-ink pb-28 pt-14 md:pb-14">
      <div className="container-x grid gap-10 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <div className="w-44">
            <Logo />
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist">{business.description}</p>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/60">Explore</p>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              ["/#services", "Services & Pricing"],
              ["/#work", "Our Work"],
              ["/#how", "How It Works"],
              ["/#faq", "FAQ"],
              ["/book", "Book a Shoot"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-white/80 hover:text-accent">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/60">Contact</p>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            {email && (
              <li>
                <a href={`mailto:${email}`} className="hover:text-accent">
                  {email}
                </a>
              </li>
            )}
            {phone && (
              <li>
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="hover:text-accent">
                  {phone}
                </a>
              </li>
            )}
            <li className="text-mist">{areaLabel}</li>
          </ul>
        </div>
      </div>
      <div className="container-x mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-mist md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Cloudline Media. All rights reserved.</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/privacy" className="hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/policies" className="hover:text-white">
            Booking &amp; Deposit Policy
          </Link>
          <CookieSettingsLink />
        </div>
      </div>
    </footer>
  );
}
