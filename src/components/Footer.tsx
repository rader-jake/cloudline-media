import Link from "next/link";
import { Logo } from "./Logo";
import { CookieSettingsLink } from "./Tracking";

export function Footer({ email, phone, areaLabel }: { email: string; phone: string; areaLabel: string }) {
  return (
    <footer className="bg-void pb-28 pt-12 md:pb-10">
      <div className="container-x flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="w-36">
            <Logo />
          </div>
          <p className="mt-4 text-sm text-mist">{areaLabel}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/75">
          {[
            ["/time-lapse", "Time-Lapse"],
            ["/real-estate", "Real Estate"],
            ["/#possibilities", "Possibilities"],
            ["/#faq", "FAQ"],
            ["/book", "Book"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1 text-sm md:items-end">
          {email && (
            <a href={`mailto:${email}`} className="text-white/85 hover:text-accent">
              {email}
            </a>
          )}
          {phone && (
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="text-white/85 hover:text-accent">
              {phone}
            </a>
          )}
        </div>
      </div>
      <div className="container-x mt-10">
        <div className="hairline" />
        <div className="mt-6 flex flex-col gap-3 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Cloudline Media. Imagery shown is illustrative unless noted.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/policies" className="hover:text-white">
              Booking &amp; Deposit Policy
            </Link>
            <CookieSettingsLink />
          </div>
        </div>
      </div>
    </footer>
  );
}
