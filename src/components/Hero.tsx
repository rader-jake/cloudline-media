import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { hero } from "@/content/site";
import { HeroVideo } from "./HeroVideo";
import heroImg from "../../public/media/hero-estate.webp";

export function Hero() {
  return (
    <section id="top" className="relative isolate flex min-h-[100svh] items-end overflow-hidden pb-24 pt-28 md:items-center md:pb-28">
      {/* Background: still image (instant, LCP) + optional lazy video on top */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 animate-slow-zoom">
          <Image
            src={heroImg}
            alt={hero.posterAlt}
            priority
            fill
            sizes="100vw"
            placeholder="blur"
            className="object-cover object-[62%_50%] md:object-center"
          />
          {hero.videoSrc && <HeroVideo src={hero.videoSrc} mobileSrc={hero.mobileVideoSrc} poster={hero.poster} />}
        </div>
        {/* readability gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/55 to-ink/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/40" />
      </div>

      <div className="container-x">
        <div className="max-w-2xl">
          <p className="eyebrow animate-fade-up text-white/85 [animation-delay:100ms]">{hero.eyebrow}</p>
          <h1 className="mt-4 animate-fade-up text-[2.9rem] font-extrabold leading-[1.02] tracking-tight [animation-delay:200ms] sm:text-6xl md:text-7xl lg:text-[5.4rem]">
            Elevating <br />
            <span className="bg-gradient-to-r from-accent to-[#5fd0ff] bg-clip-text text-transparent">Your Projects.</span>
          </h1>
          <p className="mt-5 max-w-xl animate-fade-up text-lg leading-relaxed text-white/85 [animation-delay:350ms] md:text-xl">
            Cinematic aerial videos for real estate, construction, and service businesses. Professional results. Simple pricing.
          </p>
          <div className="mt-8 flex animate-fade-up flex-col gap-3 [animation-delay:500ms] sm:flex-row">
            <Link href="/book" className="btn btn-primary min-h-14 px-7 text-base">
              Book a Shoot <ArrowRight className="size-5" aria-hidden />
            </Link>
            <Link href="#services" className="btn btn-ghost min-h-14 px-7 text-base">
              Explore Our Services
            </Link>
          </div>
          <p className="mt-6 flex animate-fade-up items-center gap-2 text-sm font-medium text-mist [animation-delay:650ms]">
            <MapPin className="size-4 text-accent" aria-hidden /> Serving Queens, Long Island &amp; Surrounding Areas
          </p>
        </div>
      </div>

      <a
        href="#services"
        aria-label="Scroll to services"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/60 md:flex"
      >
        <span className="relative h-10 w-6 rounded-full border-2 border-white/40">
          <span className="absolute left-1/2 top-2 h-2 w-1 -translate-x-1/2 animate-scroll-dot rounded-full bg-accent" />
        </span>
        Scroll
      </a>
    </section>
  );
}
