import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clapperboard, Lock, MapPin, MonitorPlay, Package, Tag, Zap } from "lucide-react";
import { benefits, finalCta, howItWorks } from "@/content/site";
import { Reveal } from "./Reveal";
import skyline from "../../public/media/skyline-sunset.webp";
import drone from "../../public/media/drone-closeup.webp";

const stepIcons = { package: Package, calendar: CalendarDays, lock: Lock, film: Clapperboard };
const benefitIcons = { "4k": MonitorPlay, bolt: Zap, pin: MapPin, tag: Tag };

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 py-20 md:py-28">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">How It Works</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Booked in Minutes</h2>
          <p className="mt-3 text-lg text-mist">Four simple steps from idea to finished aerial video.</p>
        </Reveal>
        <ol className="relative mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div aria-hidden className="absolute left-[12%] right-[12%] top-9 hidden h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent lg:block" />
          {howItWorks.map((s, i) => {
            const Icon = stepIcons[s.icon];
            return (
              <Reveal as="li" key={s.title} delay={i * 120} className="relative">
                <div className="card h-full p-6 text-center lg:bg-none lg:border-0 lg:shadow-none lg:bg-transparent">
                  <div className="relative mx-auto grid size-[72px] place-items-center rounded-2xl border border-accent/30 bg-ink shadow-glow">
                    <Icon className="size-8 text-accent" strokeWidth={1.5} aria-hidden />
                    <span className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-accent text-sm font-extrabold text-ink">{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-mist">{s.body}</p>
                </div>
              </Reveal>
            );
          })}
        </ol>
        <Reveal className="mt-12 text-center">
          <Link href="/book" className="btn btn-primary min-h-14 px-8 text-base">
            Start Booking <ArrowRight className="size-5" aria-hidden />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export function WhyUs() {
  return (
    <section aria-labelledby="why" className="border-y border-line bg-panel/40 py-16 md:py-20">
      <div className="container-x">
        <Reveal className="text-center">
          <p className="eyebrow">Why Cloudline Media?</p>
          <h2 id="why" className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
            Premium Results, Without the Hassle
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-line">
          {benefits.map((b, i) => {
            const Icon = benefitIcons[b.icon];
            return (
              <Reveal key={b.title} delay={i * 100} className="flex gap-4 lg:px-6">
                <Icon className="size-9 shrink-0 text-accent" strokeWidth={1.5} aria-hidden />
                <div>
                  <h3 className="font-bold">{b.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-mist">{b.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta" className="relative isolate overflow-hidden py-24 md:py-36">
      <Image src={skyline} alt="" fill sizes="100vw" placeholder="blur" className="-z-20 object-cover object-bottom" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink via-ink/60 to-ink/80" />
      <div className="container-x">
        <Reveal className="card mx-auto grid max-w-5xl items-center overflow-hidden !bg-ink/60 backdrop-blur-md md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative hidden h-full min-h-[260px] md:block">
            <Image src={drone} alt="Cloudline Media camera drone in flight" fill sizes="450px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ink/70" />
          </div>
          <div className="p-8 md:p-12">
            <h2 id="final-cta" className="text-3xl font-extrabold leading-tight tracking-tight md:text-[2.6rem]">
              {finalCta.headline}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-mist">{finalCta.sub}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/book" className="btn btn-primary min-h-14 px-7 text-base">
                Book Your Shoot <ArrowRight className="size-5" aria-hidden />
              </Link>
              <Link href="/#contact" className="btn btn-ghost min-h-14 px-7 text-base">
                Request a Custom Quote
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
