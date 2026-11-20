import { ChevronDown } from "lucide-react";
import { faq } from "@/content/site";
import { Reveal } from "./Reveal";

export function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <section id="faq" className="scroll-mt-20 py-20 md:py-28">
      <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Questions, Answered.</h2>
          <p className="mt-4 text-lg text-mist">
            Something else on your mind?{" "}
            <a href="#contact" className="font-semibold text-accent hover:underline">
              Send us a message
            </a>
            .
          </p>
        </Reveal>
        <div className="space-y-3">
          {faq.map((f, i) => (
            <Reveal key={f.q} delay={Math.min(i, 5) * 60}>
              <details className="group card !rounded-2xl !shadow-none open:border-accent/30">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left font-bold md:text-lg [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="size-5 shrink-0 text-accent transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="px-5 pb-5 leading-relaxed text-mist">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
