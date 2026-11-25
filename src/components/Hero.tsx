import Link from "next/link";
import { getImageProps } from "next/image";
import { ArrowRight } from "lucide-react";
import { hero } from "@/content/site";
import { HeroVideo } from "./HeroVideo";
import posterImg from "../../public/media/hero/hero-fpv-poster.webp";
import posterMobileImg from "../../public/media/hero/hero-fpv-poster-mobile.webp";

/**
 * Immersive hero. The poster still (first frame of the loop) is the LCP element, art-directed:
 * a portrait crop on phones, landscape elsewhere. The muted loop fades in over it when allowed.
 */
export function Hero({ priceLine }: { priceLine?: string }) {
  const [l1, l2] = hero.headline;
  const common = { alt: hero.posterAlt, sizes: "100vw", priority: true, quality: 80 };
  const {
    props: { srcSet: desktopSet },
  } = getImageProps({ ...common, src: posterImg });
  const {
    props: { srcSet: mobileSet, ...img },
  } = getImageProps({ ...common, src: posterMobileImg });
  const hasVideo = Boolean(hero.video.mp4);

  return (
    <section id="top" className="grain relative isolate flex min-h-[100svh] min-h-[640px] flex-col overflow-hidden bg-void">
      {/* Media */}
      <div className="absolute inset-0 -z-10">
        <div className={`absolute inset-0 will-change-transform ${hasVideo ? "" : "animate-drift"}`}>
          <picture>
            <source media="(min-width: 768px)" srcSet={desktopSet} />
            <source srcSet={mobileSet} />
            <img {...img} alt={hero.posterAlt} className="absolute inset-0 size-full object-cover" />
          </picture>
          {hasVideo && <HeroVideo sources={hero.video} poster={hero.poster} posterMobile={hero.posterMobile} />}
        </div>
        {/* Grade: keep the footage visible on the right, copy legible on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-void/95 via-void/55 to-void/0 md:from-void/85 md:via-void/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/15 to-void/55" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_68%_45%,transparent_45%,rgb(3_8_13/0.55)_100%)]" />
      </div>

      {/* Copy */}
      <div className="container-x flex flex-1 flex-col justify-end pb-12 pt-32 md:justify-center md:pb-24">
        <p className="kicker animate-fade-up [animation-delay:150ms]">{hero.eyebrow}</p>

        <h1 className="display mt-6 text-[clamp(2.15rem,6vw,5.4rem)] text-white md:mt-8">
          <span className="line-mask">
            <span className="line [--d:250ms]">{l1}</span>
          </span>
          <span className="line-mask">
            <span className="line [--d:400ms]">
              {l2.replace(/\.$/, "")}
              <span className="text-accent">.</span>
            </span>
          </span>
        </h1>

        <p className="mt-6 max-w-md animate-fade-up text-[1.05rem] leading-relaxed text-white/80 [animation-delay:700ms] md:mt-8 md:max-w-lg md:text-xl">{hero.sub}</p>

        <div className="mt-8 flex animate-fade-up flex-col gap-3 [animation-delay:850ms] sm:flex-row sm:items-center md:mt-10">
          <Link href="/#packages" className="btn btn-primary min-h-14 px-8 text-base">
            {hero.primaryCta} <ArrowRight className="size-5" aria-hidden />
          </Link>
          <Link href="/book" className="btn btn-ghost min-h-14 px-7 text-base">
            {hero.secondaryCta}
          </Link>
        </div>
        {priceLine && <p className="mt-5 animate-fade-up text-sm text-white/60 [animation-delay:1000ms]">{priceLine}</p>}
      </div>

      {/* Bottom rail */}
      <div className="container-x relative flex items-end justify-between gap-4 pb-6 text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-white/50">
        <span className="hidden animate-fade-in [animation-delay:1.3s] sm:block">{hero.mediaNote}</span>
        <a href="#intro" aria-label="Scroll to content" className="absolute left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex">
          <span>Scroll</span>
          <span className="relative h-12 w-px overflow-hidden bg-white/15">
            <span className="absolute inset-0 animate-scroll-line bg-accent" />
          </span>
        </a>
        <span className="animate-fade-in [animation-delay:1.3s] sm:ml-auto">{hero.location}</span>
      </div>
      {hero.mediaNote && <span className="absolute right-4 top-24 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-white/45 sm:hidden">{hero.mediaNote}</span>}
    </section>
  );
}
