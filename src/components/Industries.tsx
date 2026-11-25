import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { industries } from "@/content/site";
import { Reveal } from "./Reveal";
import { PrefillLink } from "./Prefill";

/**
 * "Who it's for" — editorial bento grid on desktop (Real Estate + Weddings large), stacked on mobile.
 * Each tile prefills the inquiry form with the industry and its recommended package.
 */
export function Industries() {
  const items = industries.items;
  return (
    <section id="industries" aria-labelledby="ind-title" className="scroll-mt-20 border-t border-line bg-ink py-24 md:py-32">
      <div className="container-x">
        <Reveal className="max-w-3xl">
          <p className="kicker">{industries.label}</p>
          <h2 id="ind-title" className="display mt-6 text-[clamp(2rem,5vw,4.2rem)]">
            {industries.headline.replace(/\.$/, "")}
            <span className="text-accent">.</span>
          </h2>
        </Reveal>

        {/* Bento: RE (2×2) + 4 tiles | 2 wide tiles + Weddings (2×2) */}
        <Reveal className="mt-12 grid gap-3 md:mt-16 md:grid-cols-2 lg:grid-flow-dense lg:grid-cols-4 lg:auto-rows-[minmax(300px,auto)]">
          {items.map((it, i) => {
            const big = "featured" in it && it.featured;
            const wide = !big && i >= 6; // last regular tiles sit beside the Weddings tile
            const place = big ? (it.key === "weddings" ? "lg:col-span-2 lg:row-span-2 lg:col-start-3 lg:row-start-3" : "lg:col-span-2 lg:row-span-2") : wide ? "lg:col-span-2" : "";
            return (
              <PrefillLink
                key={it.key}
                industry={it.key}
                pkg={it.package}
                aria-label={`${it.name} — ask about filming yours`}
                className={`group relative isolate flex min-h-[260px] flex-col justify-end overflow-hidden rounded-[1.25rem] border border-line bg-void p-6 transition-colors duration-500 hover:border-accent/50 md:p-7 ${place}`}
              >
                {it.image ? (
                  <>
                    <Image
                      src={it.image}
                      alt=""
                      fill
                      sizes={big ? "(min-width: 1024px) 640px, 100vw" : "(min-width: 1024px) 320px, 100vw"}
                      className="-z-20 object-cover transition-transform duration-[1.6s] ease-[var(--ease-cine)] group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-void via-void/75 to-void/10" />
                    <span className="absolute right-4 top-4 text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-white/45">Concept visualization</span>
                  </>
                ) : (
                  <NoPhotoBackdrop />
                )}
                <h3 className={`flex items-start justify-between gap-4 font-display font-bold tracking-tight ${big ? "text-2xl md:text-[2rem] md:leading-tight" : "text-xl"}`}>
                  {it.name}
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-white/25 bg-void/40 backdrop-blur transition duration-500 group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent group-hover:text-void">
                    <ArrowUpRight className="size-4" aria-hidden />
                  </span>
                </h3>
                <p className="mt-1.5 text-[0.95rem] leading-snug text-white/85">{it.hook}</p>
                <p className="mt-3 text-[0.8rem] leading-relaxed text-white/60">{it.uses.join(" · ")}</p>
              </PrefillLink>
            );
          })}
        </Reveal>

        <Reveal className="mt-8 flex flex-col gap-2 text-mist sm:flex-row sm:items-center sm:gap-4">
          <p>{industries.footer}</p>
          <PrefillLink industry="other" className="link-line text-sm text-white">
            Tell us about it <ArrowUpRight className="size-4" aria-hidden />
          </PrefillLink>
        </Reveal>
      </div>
    </section>
  );
}

/** Designed backdrop for tiles without a photo yet (topo lines, no fake imagery). */
function NoPhotoBackdrop() {
  return (
    <svg aria-hidden className="absolute inset-0 -z-10 size-full" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="260" fill="#081521" />
      <g fill="none" stroke="#a9bac8" strokeOpacity="0.1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse key={i} cx="320" cy="40" rx={40 + i * 38} ry={24 + i * 24} transform={`rotate(${-12 + i * 3} 320 40)`} />
        ))}
      </g>
      <path d="M -10 230 C 90 210, 150 120, 250 140 S 360 80, 410 60" fill="none" stroke="#20b8ff" strokeOpacity="0.5" strokeDasharray="2 8" strokeLinecap="round" />
    </svg>
  );
}
