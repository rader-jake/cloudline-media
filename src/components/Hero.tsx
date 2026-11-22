import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { hero } from "@/content/site";
import { HeroVideo } from "./HeroVideo";
import heroImg from "../../public/media/hero-estate.webp";

/**
 * Immersive hero. The still image is the LCP element (priority, blurred placeholder) and
 * drifts slowly; an optional background video fades in over it once it can play.
 */
export function Hero({ priceLine }: { priceLine?: string }) {
  const [l1, l2, l3] = hero.headline;
  return (
    <section id="top" className="grain relative isolate flex min-h-[100svh] min-h-[640px] flex-col overflow-hidden bg-void">
      {/* Media */}
      <div className="absolute inset-0 -z-10" aria-hidden={!hero.posterAlt}>
        <div className="absolute inset-0 animate-drift will-change-transform">
          <Image
            src={heroImg}
            alt={hero.posterAlt}
            priority
            fetchPriority="high"
            fill
            sizes="100vw"
            placeholder="blur"
            className="object-cover object-[64%_55%]"
          />
          {hero.videoSrc && <HeroVideo src={hero.videoSrc} mobileSrc={hero.mobileVideoSrc} poster={hero.poster} />}
        </div>
        {/* Grade: cool the image down, deepen shadows, keep text legible */}
        <div className="absolute inset-0 bg-[#06111b]/20 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-void/95 via-void/60 to-void/0 md:from-void/90 md:via-void/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/10 to-void/55" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_68%_45%,transparent_45%,rgb(3_8_13/0.6)_100%)]" />
      </div>

      {/* Copy */}
      <div className="container-x flex flex-1 flex-col justify-end pb-12 pt-32 md:justify-center md:pb-24">
        <p className="kicker animate-fade-up [animation-delay:150ms]">{hero.location}</p>

        <h1 className="display mt-6 text-[clamp(2.05rem,8.4vw,6.6rem)] text-white md:mt-8">
          <span className="line-mask">
            <span className="line [--d:250ms]">{l1}</span>
          </span>
          <span className="line-mask">
            <span className="line [--d:380ms]">{l2}</span>
          </span>
          <span className="line-mask">
            <span className="line [--d:510ms]">
              {l3.replace(/\.$/, "")}
              <span className="text-accent">.</span>
            </span>
          </span>
        </h1>

        <p className="mt-6 max-w-md animate-fade-up text-[1.05rem] leading-relaxed text-white/78 [animation-delay:800ms] md:mt-8 md:max-w-lg md:text-xl">
          {hero.sub}
        </p>

        <div className="mt-8 flex animate-fade-up flex-col gap-3 [animation-delay:950ms] sm:flex-row sm:items-center md:mt-10">
          <Link href="/book" className="btn btn-primary min-h-14 px-8 text-base">
            {hero.primaryCta} <ArrowRight className="size-5" aria-hidden />
          </Link>
          <Link href="/#possibilities" className="btn btn-ghost min-h-14 px-7 text-base">
            <span className="grid size-7 place-items-center rounded-full border border-white/40">
              <Play className="size-3 translate-x-px fill-current" aria-hidden />
            </span>
            {hero.secondaryCta}
          </Link>
        </div>
        {priceLine && <p className="mt-5 animate-fade-up text-sm text-white/55 [animation-delay:1100ms]">{priceLine}</p>}
      </div>

      {/* Bottom rail */}
      <div className="container-x relative flex items-end justify-between pb-6 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/45">
        <span className="hidden animate-fade-in [animation-delay:1.4s] sm:block">{hero.mediaNote}</span>
        <a href="#intro" aria-label="Scroll to content" className="absolute left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex">
          <span>Scroll</span>
          <span className="relative h-12 w-px overflow-hidden bg-white/15">
            <span className="absolute inset-0 animate-scroll-line bg-accent" />
          </span>
        </a>
        <span className="ml-auto hidden animate-fade-in tabular-nums [animation-delay:1.4s] sm:block">40.72° N · 73.79° W</span>
      </div>
      {/* Mobile media note */}
      {hero.mediaNote && (
        <span className="absolute right-4 top-24 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-white/40 sm:hidden">{hero.mediaNote}</span>
      )}
    </section>
  );
}
