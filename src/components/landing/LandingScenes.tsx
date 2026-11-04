import Link from "next/link";
import { landingScenes as copy } from "@/data/site";
import { landingArt as art } from "@/data/landingArt";
import Reveal from "./Reveal";

// The Landing is one tall garden painting in three scenes, stacked edge to edge
// in normal document flow: scrolling simply moves down the painting. Each scene
// is a slice of the same picture, so the joins are seamless. Viewports at or
// narrower than 3:4 get the portrait composition (`portrait-art:` variant).
// Text is real HTML placed over the calm areas the painting leaves for it.

function SceneArt({ scene }: { scene: 1 | 2 | 3 }) {
  const d = art.desktop;
  const p = art.portrait;
  return (
    <picture>
      <source
        media={art.portraitQuery}
        srcSet={p.sizes.map((w) => `${art.src(scene, "mobile", w)} ${w}w`).join(", ")}
        sizes="100vw"
        width={p.width}
        height={p.height}
      />
      <img
        src={art.src(scene, "desktop", d.sizes[0])}
        srcSet={d.sizes.map((w) => `${art.src(scene, "desktop", w)} ${w}w`).join(", ")}
        sizes="100vw"
        width={d.width}
        height={d.height}
        alt=""
        loading={scene === 1 ? "eager" : "lazy"}
        fetchPriority={scene === 1 ? "high" : undefined}
        decoding="async"
        className="block h-auto w-full select-none"
        draggable={false}
      />
    </picture>
  );
}

const glow = "[text-shadow:0_1px_18px_rgb(251_247_238/0.9),0_0_2px_rgb(251_247_238/0.7)]";

export default function LandingScenes() {
  return (
    <div className="relative overflow-hidden bg-[#9fb574]">
      {/* ---- Scene 1 · The beginning: the title alone ---- */}
      <section aria-labelledby="landing-title" className="relative">
        <SceneArt scene={1} />
        <h1
          id="landing-title"
          className={`absolute inset-x-0 top-[9.5%] px-6 text-center font-serif text-[clamp(3rem,7.6vw,8rem)] leading-[0.95] font-medium tracking-[-0.01em] text-[#33402f] portrait-art:top-[11%] portrait-art:text-[clamp(2.9rem,14vw,5rem)] ${glow}`}
        >
          {copy.title}
        </h1>
        {/* a quiet, wordless cue at the foot of the first view */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[min(calc(100svh-4.5rem),92%)] flex justify-center text-[#33402f]/70">
          <svg viewBox="0 0 24 40" className="h-10 w-6 motion-safe:animate-[cue_2.6s_ease-in-out_infinite]">
            <rect x="7" y="2" width="10" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 7 V11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M7 28 L12 33 L17 28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ---- Scene 2 · My thoughts ---- */}
      <section aria-label="Thoughts" className="relative">
        <SceneArt scene={2} />
        <Reveal className="absolute top-[7%] left-[6%] max-w-[min(36rem,46%)] portrait-art:top-[10%] portrait-art:right-[7%] portrait-art:left-[7%] portrait-art:max-w-none">
          {copy.thoughts.map((line, i) => (
            <p
              key={line}
              style={{ transitionDelay: `${i * 260}ms` }}
              className={`reveal-item font-serif text-[clamp(1.5rem,2.7vw,2.75rem)] leading-[1.2] text-[#2c3828] portrait-art:text-[clamp(1.45rem,6.6vw,2.2rem)] ${glow} ${
                i === 1 ? "mt-[0.9em] ml-[1.4em] italic portrait-art:ml-[0.8em]" : i === 2 ? "mt-[0.9em] ml-[0.5em] portrait-art:ml-0" : ""
              }`}
            >
              {line}
            </p>
          ))}
        </Reveal>
      </section>

      {/* ---- Scene 3 · Enter my work ---- */}
      <section aria-labelledby="landing-invitation" className="relative">
        <SceneArt scene={3} />
        <Reveal className="absolute inset-x-0 top-[6%] px-6 text-center portrait-art:top-[10%]">
          <h2
            id="landing-invitation"
            className={`reveal-item font-serif text-[clamp(2rem,4.4vw,4.4rem)] leading-[1.1] text-[#2c3828] portrait-art:text-[clamp(1.9rem,8.6vw,3rem)] ${glow}`}
          >
            {copy.invitation}
          </h2>
        </Reveal>
        {/* the way in: a painted sign standing in the light under the arch */}
        <div className="absolute inset-x-0 top-[54%] flex justify-center px-6 portrait-art:top-[52%]">
          <Link
            href="/work"
            className="group inline-flex min-h-14 items-center gap-3 rounded-[18px_14px_20px_12px] border border-[#7a5f48]/35 bg-[#fbf3e4]/95 px-8 py-3 font-serif text-[clamp(1.15rem,1.7vw,1.5rem)] text-[#2f4a2c] shadow-[0_18px_40px_-18px_rgb(60_48_30/0.75),inset_0_1px_0_rgb(255_255_255/0.6)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#fffaf0] hover:shadow-[0_22px_44px_-18px_rgb(60_48_30/0.85)] focus-visible:-translate-y-0.5"
          >
            {copy.cta}
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
