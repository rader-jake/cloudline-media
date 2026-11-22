import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { showcase } from "@/content/site";
import { formatUSD, type Settings } from "@/lib/settings";
import { Reveal } from "./Reveal";
import { DronePass } from "./DronePass";

const videoLabel = {
  client: "",
  illustrative: "Illustrative footage — not Cloudline Media client work",
  concept: "Concept visualization (AI-generated)",
} as const;

/**
 * "The Possibilities." — what can be filmed, not a portfolio. With no approved footage it
 * renders a flight-plan frame with cycling scene names; set `showcase.video` to feature a reel.
 */
export function Possibilities({ settings }: { settings: Settings }) {
  const tl = settings.services.timelapse.priceCents;
  const re = settings.services.realestate.priceCents;
  return (
    <section id="possibilities" aria-labelledby="poss-title" className="relative scroll-mt-20 overflow-hidden bg-void pb-24 pt-8 md:pb-36 md:pt-12">
      <div className="container-x">
        <Reveal>
          <p className="kicker">Showcase</p>
          <h2 id="poss-title" className="display mt-6 text-[clamp(1.85rem,5.6vw,5.2rem)]">
            The possibilities<span className="text-accent">.</span>
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-mist md:text-xl">{showcase.sub}</p>
        </Reveal>
      </div>

      <div className="container-x mt-12 md:mt-16">
        <DronePass>{showcase.video ? <FeaturedVideo video={showcase.video} /> : <FlightPlanFrame />}</DronePass>
      </div>

      <div className="container-x mt-6 md:mt-8">
        <div className="grid gap-px overflow-hidden rounded-[1.25rem] border border-line bg-line md:grid-cols-2">
          <AudienceLink
            href="/time-lapse"
            kicker="Contractors & seasonal crews"
            title="Job time-lapse"
            price={tl != null ? `From ${formatUSD(tl)}` : ""}
            scenes={showcase.scenes.filter((s) => s.service === "timelapse").map((s) => s.label)}
          />
          <AudienceLink
            href="/real-estate"
            kicker="Agents, brokers & owners"
            title="Real estate aerial film"
            price={re != null ? `From ${formatUSD(re)}` : ""}
            scenes={showcase.scenes.filter((s) => s.service === "realestate").map((s) => s.label)}
          />
        </div>
      </div>
    </section>
  );
}

function AudienceLink({ href, kicker, title, price, scenes }: { href: string; kicker: string; title: string; price: string; scenes: string[] }) {
  return (
    <Link href={href} className="group relative flex flex-col justify-between gap-8 bg-ink p-7 transition-colors duration-500 hover:bg-panel md:p-9">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-[0.66rem] font-bold uppercase tracking-[0.28em] text-accent">{kicker}</p>
          <p className="mt-3 font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/20 transition duration-500 group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent group-hover:text-void">
          <ArrowUpRight className="size-5" aria-hidden />
        </span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-xs text-sm leading-relaxed text-mist">{scenes.join(" · ")}</p>
        {price && <p className="text-sm font-bold text-white">{price}</p>}
      </div>
    </Link>
  );
}

/** Cinematic "flight plan" canvas: topo lines, a live flight path, HUD, and cycling scene titles. */
function FlightPlanFrame() {
  const scenes = showcase.scenes;
  return (
    <div className="grain relative aspect-[4/5] overflow-hidden rounded-[1.25rem] border border-line bg-[radial-gradient(110%_90%_at_30%_20%,#11283b_0%,#081521_45%,#03080d_100%)] sm:aspect-[16/10] lg:aspect-[21/9]">
      {/* Topographic lines + flight path */}
      <svg aria-hidden className="absolute inset-0 size-full" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="pf-dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#a9bac8" opacity="0.13" />
          </pattern>
          <linearGradient id="pf-path" x1="0" x2="1">
            <stop offset="0" stopColor="#20b8ff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#20b8ff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#20b8ff" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <rect width="1200" height="520" fill="url(#pf-dots)" />
        <g fill="none" stroke="#a9bac8" strokeOpacity="0.1">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <ellipse key={`a${i}`} cx="860" cy="150" rx={70 + i * 58} ry={38 + i * 34} transform={`rotate(${-14 + i * 2} 860 150)`} />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <ellipse key={`b${i}`} cx="230" cy="430" rx={60 + i * 62} ry={30 + i * 30} transform={`rotate(${10 - i * 3} 230 430)`} />
          ))}
        </g>
        <path
          className="pf-route"
          d="M -20 420 C 180 380, 260 220, 470 250 S 760 410, 900 300 S 1100 90, 1230 120"
          fill="none"
          stroke="url(#pf-path)"
          strokeWidth="1.5"
          strokeDasharray="2 10"
          strokeLinecap="round"
        />
        {[
          [470, 250],
          [900, 300],
        ].map(([x, y]) => (
          <g key={x}>
            <circle cx={x} cy={y} r="4" fill="#20b8ff" />
            <circle cx={x} cy={y} r="14" fill="none" stroke="#20b8ff" strokeOpacity="0.35" />
          </g>
        ))}
      </svg>

      {/* Crosshair */}
      <div aria-hidden className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 opacity-30">
        <span className="absolute inset-x-0 top-1/2 h-px bg-white/50" />
        <span className="absolute inset-y-0 left-1/2 w-px bg-white/50" />
        <span className="absolute inset-5 rounded-full border border-white/40" />
      </div>

      {/* HUD */}
      <div className="absolute inset-x-0 top-0 flex justify-between p-5 text-[0.6rem] font-bold uppercase tracking-[0.26em] text-white/55 md:p-7">
        <span className="flex items-center gap-2">
          <span className="size-1.5 animate-blink rounded-full bg-accent" aria-hidden /> Flight plan
        </span>
        <span>Queens · Long Island</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex justify-between p-5 text-[0.6rem] font-bold uppercase tracking-[0.26em] text-white/40 md:p-7">
        <span className="tabular-nums">40.72° N · 73.79° W</span>
        <span>Your project next</span>
      </div>

      {/* Cycling scene titles */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center">
        <p className="text-[0.66rem] font-bold uppercase tracking-[0.34em] text-accent">Imagine it from above</p>
        <div
          className="scene-cycle relative mx-auto mt-4 h-[2.3em] max-w-5xl font-display text-[clamp(1.7rem,5.2vw,4.4rem)] font-extrabold uppercase leading-[1.1] tracking-tight [font-stretch:115%]"
          aria-hidden
        >
          {scenes.map((s, i) => (
            <span key={s.label} className="flex items-center justify-center" style={{ animationDelay: `${i * 3}s` }}>
              {s.label}
            </span>
          ))}
        </div>
        <p className="sr-only">Scenes we film: {scenes.map((s) => s.label).join(", ")}.</p>
      </div>
    </div>
  );
}

function FeaturedVideo({ video }: { video: NonNullable<typeof showcase.video> }) {
  const label = videoLabel[video.kind];
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-[1.25rem] border border-line bg-panel lg:aspect-[21/9]">
      <video className="absolute inset-0 size-full object-cover" src={video.src} poster={video.poster} controls preload="none" playsInline />
      {label && (
        <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-void/70 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
          {label}
        </span>
      )}
    </div>
  );
}
