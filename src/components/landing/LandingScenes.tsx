import Link from "next/link";
import { landingScenes as copy } from "@/data/site";
import { landingArt as art } from "@/data/landingArt";
import anchors from "@/data/landing-anchors.json";
import Reveal from "./Reveal";

// The Landing is one tall garden painting in three scenes, stacked edge to edge
// in normal document flow: scrolling simply moves down the painting. Each scene
// is a slice of the same picture, so the joins are seamless. Viewports at or
// narrower than 3:4 get the portrait composition (`portrait-art:` variant).
// Text is real HTML. The scene-2 notes sit on hill slopes whose position and
// tilt the painting script measured (src/data/landing-anchors.json).

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
/** Handwriting laid on the grass: dark ink with a soft halo of light. */
const note = "[text-shadow:0_0_14px_rgb(246_242_214/0.85),0_1px_2px_rgb(246_242_214/0.9)]";

type Anchor = { x: number; y: number; angle: number };
const place = (d: Anchor, m: Anchor) =>
  ({ "--dx": `${d.x * 100}%`, "--dy": `${d.y * 100}%`, "--da": `${d.angle}deg`, "--mx": `${m.x * 100}%`, "--my": `${m.y * 100}%`, "--ma": `${m.angle}deg` }) as React.CSSProperties;

export default function LandingScenes() {
  const sd = anchors.desktop.sign;
  const sm = anchors.mobile.sign;
  return (
    <div className="relative overflow-hidden bg-[#9fb574]">
      {/* ---- Scene 1 · A living garden: the title alone, centred in the first view ---- */}
      <section aria-labelledby="landing-title" className="relative">
        <SceneArt scene={1} />
        <h1
          id="landing-title"
          className={`absolute inset-x-0 top-[min(50svh,50%)] -translate-y-1/2 px-6 text-center font-serif text-[clamp(3rem,7.6vw,8rem)] leading-[0.95] font-medium tracking-[-0.01em] text-[#33402f] portrait-art:text-[clamp(2.9rem,14vw,5rem)] ${glow}`}
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

      {/* ---- Scene 2 · Thoughts on the hills: notes laid along three slopes ---- */}
      <section aria-label="Thoughts" className="relative">
        <SceneArt scene={2} />
        {copy.thoughts.map((line, i) => (
          <Reveal
            key={line}
            style={place(anchors.desktop.phrases[i], anchors.mobile.phrases[i])}
            className="absolute top-(--dy) left-(--dx) w-max max-w-[40vw] -translate-x-1/2 -translate-y-1/2 rotate-(--da) portrait-art:top-(--my) portrait-art:left-(--mx) portrait-art:max-w-[84vw] portrait-art:rotate-(--ma)"
          >
            <p className={`reveal-item text-center font-hand text-[clamp(2rem,3.5vw,3.7rem)] leading-[1.05] font-semibold text-[#2a3624] portrait-art:text-[clamp(1.8rem,8.4vw,2.7rem)] ${note}`}>
              {line}
            </p>
          </Reveal>
        ))}
      </section>

      {/* ---- Scene 3 · Afternoon tea in the garden ---- */}
      <section aria-labelledby="landing-invitation" className="relative">
        <SceneArt scene={3} />
        <Reveal className="absolute top-[11%] left-[74%] w-max max-w-[44vw] -translate-x-1/2 -translate-y-1/2 -rotate-2 portrait-art:top-[13%] portrait-art:left-1/2 portrait-art:max-w-[88vw]">
          <h2
            id="landing-invitation"
            className={`reveal-item text-center font-hand text-[clamp(2.3rem,4.2vw,4.4rem)] leading-[1.05] font-semibold text-[#2a3624] portrait-art:text-[clamp(2rem,9.4vw,3rem)] ${note}`}
          >
            {copy.invitation}
          </h2>
        </Reveal>
        {/* the way in: a painted wooden sign hanging over the garden gate */}
        <Link
          href="/work"
          style={{ "--sx": `${sd.x * 100}%`, "--sy": `${sd.y * 100}%`, "--sw": `${sd.w * 100}%`, "--mx": `${sm.x * 100}%`, "--my": `${sm.y * 100}%`, "--mw": `${sm.w * 100}%` } as React.CSSProperties}
          className="garden-sign @container absolute top-(--sy) left-(--sx) w-(--sw) -translate-x-1/2 rounded-[1.5rem] portrait-art:top-(--my) portrait-art:left-(--mx) portrait-art:w-(--mw)"
        >
          <span className="garden-sign__board relative block">
            {/* eslint-disable-next-line @next/next/no-img-element -- painted sign artwork, sized by the sign */}
            <img src="/assets/garden/landing/sign.webp" alt="" width={760} height={470} className="block h-auto w-full select-none" draggable={false} />
            <span className="absolute inset-x-[8%] top-[56%] -translate-y-1/2 text-center font-hand text-[12cqw] leading-none font-bold text-[#3a2618] [text-shadow:0_1px_0_rgb(255_236_200/0.45),0_-1px_0_rgb(40_25_15/0.25)]">
              {copy.cta}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element -- painted flower that nods on hover */}
            <img
              src="/assets/garden/landing/sign-flower.webp"
              alt=""
              width={200}
              height={200}
              className="garden-sign__flower pointer-events-none absolute top-[13%] right-[3%] w-[19%] select-none"
              draggable={false}
            />
          </span>
        </Link>
      </section>
    </div>
  );
}
