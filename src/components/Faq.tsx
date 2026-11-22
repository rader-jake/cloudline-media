import { Plus } from "lucide-react";
import { faq as allFaq } from "@/content/site";
import { Reveal } from "./Reveal";

type QA = (typeof allFaq)[number];

/** Compact FAQ accordion (native <details>, zero JS) with FAQPage structured data. */
export function Faq({ items = allFaq, title = "Questions, answered." }: { items?: readonly QA[]; title?: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 bg-void py-24 md:py-32">
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="kicker">FAQ</p>
          <h2 id="faq-title" className="display mt-6 text-[clamp(2rem,3.6vw,2.8rem)]">
            {title.replace(/\.$/, "")}
            <span className="text-accent">.</span>
          </h2>
          <p className="mt-5 text-mist">
            Something else?{" "}
            <a href="#contact" className="link-line text-white">
              Send us a message
            </a>
          </p>
        </Reveal>
        <Reveal delay={100} className="border-t border-line lg:col-span-8">
          {items.map((f) => (
            <details key={f.q} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left text-lg font-semibold tracking-tight transition-colors hover:text-accent-soft md:text-xl [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 transition duration-300 group-open:rotate-45 group-open:border-accent group-open:text-accent">
                  <Plus className="size-4" aria-hidden />
                </span>
              </summary>
              <p className="max-w-2xl pb-7 pr-12 leading-relaxed text-mist">{f.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
