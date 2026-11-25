import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { finalCta, howItWorks, intro } from "@/content/site";
import { Reveal } from "./Reveal";
import { InquiryForm } from "./InquiryForm";
import skyline from "../../public/media/skyline-sunset.webp";

/** "The FPV difference" + value strip: one short idea, a 3-row comparison, three true facts. */
export function Intro() {
  const [before, after] = intro.sentence.split(" through ");
  return (
    <section id="intro" aria-labelledby="intro-title" className="scroll-mt-20 bg-void py-24 md:py-32">
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-6">
          <p className="kicker">{intro.label}</p>
          <h2 id="intro-title" className="display mt-6 text-[clamp(1.9rem,3.6vw,3.3rem)]">
            {intro.headline.replace(/\.$/, "")}
            <span className="text-accent">.</span>
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-mist">
            {before} <em className="font-semibold not-italic text-white">through</em> {after}
          </p>
        </Reveal>
        <Reveal delay={100} className="lg:col-span-6 lg:pt-14">
          <table className="w-full text-left text-[0.95rem]">
            <caption className="sr-only">Traditional aerial compared with FPV</caption>
            <thead>
              <tr className="text-[0.68rem] font-bold uppercase tracking-[0.26em]">
                <th scope="col" className="w-1/2 pb-4 pr-4 font-bold text-white/45">{intro.compare.columns[0]}</th>
                <th scope="col" className="w-1/2 pb-4 font-bold text-accent">{intro.compare.columns[1]}</th>
              </tr>
            </thead>
            <tbody>
              {intro.compare.rows.map(([a, b]) => (
                <tr key={a} className="border-t border-line align-top">
                  <td className="py-4 pr-4 text-white/55">{a}</td>
                  <td className="py-4 font-semibold text-white">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs leading-relaxed text-white/45">{intro.finePrint}</p>
        </Reveal>
      </div>
      <div className="container-x mt-14 md:mt-20">
        <Reveal>
          <dl className="grid gap-px overflow-hidden rounded-[1.25rem] border border-line bg-line sm:grid-cols-3">
            {intro.facts.map((f) => (
              <div key={f.k} className="bg-void p-6 md:p-8">
                <dt className="display text-4xl text-white md:text-5xl">{f.k}</dt>
                <dd className="mt-3 text-sm leading-relaxed text-mist">{f.v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

/** Four-step process on a single hairline. */
export function Process() {
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-20 border-t border-line bg-ink py-24 md:py-32">
      <div className="container-x">
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="kicker">How it works</p>
            <h2 id="how-title" className="display mt-6 text-[clamp(2.2rem,6vw,4.8rem)]">
              Booked in minutes<span className="text-accent">.</span>
            </h2>
          </div>
          <Link href="/book" className="btn btn-primary min-h-14 self-start px-8 text-base md:self-auto">
            Start booking <ArrowRight className="size-5" aria-hidden />
          </Link>
        </Reveal>
        <ol className="mt-14 grid gap-10 md:mt-20 md:grid-cols-4 md:gap-8">
          {howItWorks.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 110} className="relative border-t border-line pt-8">
              <span aria-hidden className="absolute -top-px left-0 h-px w-10 bg-accent" />
              <p className="font-display text-sm font-bold tabular-nums text-accent">0{i + 1}</p>
              <h3 className="mt-4 text-xl font-bold tracking-tight">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-mist">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Final booking CTA with the contact form for custom projects. */
export function FinalCta({ email, phone }: { email: string; phone: string }) {
  return (
    <section id="contact" aria-labelledby="final-cta" className="relative isolate scroll-mt-20 overflow-hidden bg-[linear-gradient(180deg,#03080d_0%,#071725_55%,#0c2233_100%)] pt-24 md:pt-36">
      <div className="container-x grid gap-14 pb-16 lg:grid-cols-12 lg:gap-12">
        <Reveal className="lg:col-span-6">
          <p className="kicker">Book your shoot</p>
          <h2 id="final-cta" className="display mt-6 text-[clamp(2.6rem,6vw,5.2rem)]">
            <span className="block">{finalCta.headline[0]}</span>
            <span className="block">
              {finalCta.headline[1].replace(/\?$/, "")}
              <span className="text-accent">?</span>
            </span>
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-mist">{finalCta.sub}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/book" className="btn btn-primary min-h-14 px-8 text-base">
              Book Your Shoot <ArrowRight className="size-5" aria-hidden />
            </Link>
            {email && (
              <a href={`mailto:${email}`} className="btn btn-ghost min-h-14 px-7 text-base">
                {email}
              </a>
            )}
          </div>
          {phone && (
            <p className="mt-5 text-sm text-mist">
              Or call{" "}
              <a className="font-semibold text-white hover:text-accent" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                {phone}
              </a>
            </p>
          )}
        </Reveal>
        <Reveal delay={120} className="lg:col-span-6">
          <div className="rounded-[1.5rem] border border-line bg-void/60 p-6 backdrop-blur-md md:p-8">
            <h3 className="text-lg font-bold">Tell us what you&apos;re picturing.</h3>
            <p className="mt-1 text-sm leading-relaxed text-mist">
              Productions, wedding moments, live events or anything custom. No payment until we&apos;ve agreed the plan and sent you a quote.
            </p>
            <div className="mt-6">
              <InquiryForm />
            </div>
          </div>
        </Reveal>
      </div>
      {/* Horizon */}
      <div aria-hidden className="relative h-[110px] md:h-[180px]">
        <Image src={skyline} alt="" fill sizes="100vw" className="object-cover object-bottom opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c2233] via-transparent to-void" />
      </div>
    </section>
  );
}
