import Link from "next/link";
import { landingScenes as copy } from "@/data/site";
import { landingArt as art } from "@/data/landingArt";
import anchors from "@/data/landing-anchors.json";
import CurvedNotes from "./CurvedNotes";
import LivingLayer, { type Sprite } from "./LivingLayer";
import Reveal from "./Reveal";
import SceneSettle from "./SceneSettle";
import PaintedTitle from "./PaintedTitle";
import ButterflyCursor from "./ButterflyCursor";
import Lamppost from "./Lamppost";
import NightSky from "./NightSky";

// The Landing is one tall garden painting in three scenes, stacked edge to edge
// in normal document flow: scrolling simply moves down the painting. Each scene
// is a slice of the same picture, so the joins are seamless. Viewports at or
// narrower than 3:4 get the portrait composition (`portrait-art:` variant).
// The title, invitation and sign are real HTML. The scene-2 notes are SVG text
// written along gentle curves that follow the painted hills (measured by the
// painting script into src/data/landing-anchors.json), with an HTML copy for
// screen readers.

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

/** Handwriting laid on the grass: dark ink with a soft halo of light. */
const note = "[text-shadow:0_0_14px_rgb(246_242_214/0.85),0_1px_2px_rgb(246_242_214/0.9)]";

const layers = (scene: number) => (
  <LivingLayer
    breeze={scene !== 1}
    desktop={(anchors.desktop.sprites as Sprite[]).filter((s) => s.scene === scene)}
    mobile={(anchors.mobile.sprites as Sprite[]).filter((s) => s.scene === scene)}
  />
);

export default function LandingScenes() {
  const sd = anchors.desktop.sign;
  const sm = anchors.mobile.sign;
  return (
    <div className="landing-scenes nightable relative overflow-clip bg-[#9fb574]">
      <SceneSettle />
      <ButterflyCursor />
      {/* ---- Scene 1 · A living garden: the title alone, centred in the first view ---- */}
      <section aria-labelledby="landing-title" className="relative">
        <SceneArt scene={1} />
        {layers(1)}
        <NightSky scene={1} />
        <Lamppost />
        <PaintedTitle id="landing-title" className="pointer-events-none absolute inset-x-0 top-[min(38svh,38%)] -translate-y-1/2 px-6 portrait-art:top-[min(38svh,38%)]" />
        {/* a quiet, wordless cue at the foot of the first view */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[min(calc(100svh-4.5rem),92%)] flex justify-center text-[#33402f]/70">
          <svg viewBox="0 0 24 40" className="h-10 w-6 motion-safe:animate-[cue_2.6s_ease-in-out_infinite]">
            <rect x="7" y="2" width="10" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 7 V11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M7 28 L12 33 L17 28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ---- Scene 2 · Thoughts on the hills: notes that curve with the slopes and appear as you scroll ---- */}
      <section aria-label="Thoughts" className="relative">
        <SceneArt scene={2} />
        {layers(2)}
        <NightSky scene={2} />
        <CurvedNotes texts={copy.thoughts} desktop={anchors.desktop} mobile={anchors.mobile} />
      </section>

      {/* ---- Scene 3 · Afternoon tea in the garden ---- */}
      <section aria-labelledby="landing-invitation" className="relative">
        <SceneArt scene={3} />
        {layers(3)}
        <NightSky scene={3} />
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
