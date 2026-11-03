"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { landingScenes as copy } from "@/data/site";
import { landingArt, type LandingArtSlot } from "@/data/landingArt";
import { Clouds, ForegroundStems, GrassBlades, LeafSpray, PaintedHill, Wildflowers } from "../garden/Painted";

// One continuous garden, walked through by scrolling. A tall section holds a
// sticky full-viewport stage; the scroll handler writes one CSS variable, --p
// (0 → 1), and every layer and statement derives its transform and opacity
// from it. Layers grow toward a shared vanishing point at different rates, so
// the camera seems to move forward along the path rather than slide.
// --d scales every movement (1 on desktop, 0.55 on phones). Reduced motion
// (globals.css) removes all transforms and keeps only the text fades.
// Layout and art spec: docs/LANDING-ART-SPEC.md.

const VB = "0 0 1600 1000";
const VANISH = "50% 62%";

/** 0 before `a`, 1 after `b`, linear in between. */
const ramp = (a: number, b: number) => `clamp(0, (var(--p) - ${a}) / ${b - a}, 1)`;
/** Fade in over a→b, hold, fade out over c→d. */
const fade = (a: number, b: number, c?: number, d?: number) =>
  c === undefined || d === undefined ? ramp(a, b) : `calc(${ramp(a, b)} * (1 - ${ramp(c, d)}))`;
/** Grow by `k` (scaled by --d) between a and b. */
const grow = (k: number, a = 0, b = 1) => `scale(calc(1 + ${k} * var(--d) * ${ramp(a, b)}))`;

const GREENS = ["#6f8f5a", "#87a067", "#9db274", "#5f7d55", "#b3c180"];
const BLOSSOMS = ["#fbf3ea", "#f2b8a0", "#e9afab", "#fbf3ea", "#e3bf73", "#d9776a"];

function Layer({ move, origin = VANISH, children, className = "absolute inset-0" }: { move?: string; origin?: string; children: React.ReactNode; className?: string }) {
  return (
    <div aria-hidden="true" className={`journey-move will-change-transform ${className}`} style={{ transform: move, transformOrigin: origin }}>
      {children}
    </div>
  );
}

/** A painted image when one has been supplied for the slot, otherwise the code-drawn placeholder. */
function Art({ slot, fit = "object-cover object-bottom", children, viewBox = VB, align = "xMidYMax slice" }: { slot: LandingArtSlot; fit?: string; children: React.ReactNode; viewBox?: string; align?: string }) {
  const src = landingArt[slot];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- decorative layer; sizing is handled by CSS
    return <img src={src} alt="" className={`absolute inset-0 h-full w-full ${fit}`} />;
  }
  return (
    <svg viewBox={viewBox} preserveAspectRatio={align} className="absolute inset-0 h-full w-full" focusable="false" data-placeholder={slot}>
      {children}
    </svg>
  );
}

function TreeClump({ x, y, s = 1, tone = "#58775a" }: { x: number; y: number; s?: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#paint)">
      <path d="M-3 0 L-2 -26 L2 -26 L3 0 Z" fill="#6d5a45" opacity="0.7" />
      <ellipse cx="-12" cy="-36" rx="22" ry="18" fill={tone} opacity="0.85" />
      <ellipse cx="12" cy="-40" rx="20" ry="20" fill={tone} opacity="0.9" />
      <ellipse cx="0" cy="-58" rx="18" ry="16" fill={tone} opacity="0.8" />
      <ellipse cx="6" cy="-50" rx="10" ry="8" fill="#89a46e" opacity="0.6" />
    </g>
  );
}

/** Grass, leaves and flower stems framing one bottom corner. */
function ForegroundCluster({ seed, flip }: { seed: number; flip?: boolean }) {
  return (
    <g transform={flip ? "translate(600 0) scale(-1 1)" : undefined}>
      <GrassBlades seed={seed} count={70} x={[-20, 560]} bottom={800} height={[90, 360]} colors={GREENS} />
      <LeafSpray x={70} y={800} length={330} angle={8} color="#7f9a66" />
      <LeafSpray x={250} y={800} length={250} angle={-14} color="#93a96c" scale={0.9} />
      <LeafSpray x={420} y={800} length={190} angle={18} color="#6f8f5a" scale={0.8} />
      <ForegroundStems seed={seed} xs={[40, 150, 300, 430]} bottom={800} height={470} colors={BLOSSOMS} />
      <Wildflowers seed={seed + 1} count={22} x={[0, 470]} y={[650, 800]} size={[6, 13]} colors={BLOSSOMS} />
    </g>
  );
}

function Moment({ opacity, still, className, children }: { opacity: string; still?: boolean; className: string; children: React.ReactNode }) {
  return (
    <div
      style={{ opacity, transform: still ? undefined : `translateY(calc(26px * (1 - ${opacity})))` }}
      className={`journey-text pointer-events-none absolute [text-shadow:0_1px_24px_rgb(251_247_238/0.95),0_0_2px_rgb(251_247_238/0.6)] ${className}`}
    >
      {children}
    </div>
  );
}

const statement = "font-serif text-[clamp(1.9rem,4.4vw,3.3rem)] leading-[1.12] text-ink";

export default function LandingJourney() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const range = el.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, (window.scrollY - el.offsetTop) / Math.max(1, range)));
      el.style.setProperty("--p", p.toFixed(4));
      el.dataset.end = String(p > 0.76);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Keyboard users who tab to the CTA are carried to the moment where it is shown.
  const toEnd = () => {
    const el = ref.current;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (el) window.scrollTo({ top: el.offsetTop + el.offsetHeight - window.innerHeight, behavior: still ? "auto" : "smooth" });
  };

  return (
    <section ref={ref} aria-label="A walk through the garden" data-end="false" className="group relative h-[520vh] [--d:0.55] [--p:0] md:[--d:1]">
      <div className="paper-grain sticky top-0 h-[100svh] overflow-hidden bg-[#f4c4b7]">
        {/* ---- background: sky, clouds, distant ranges ---- */}
        <Layer move={grow(0.03)}>
          <Art slot="sky">
            <defs>
              <linearGradient id="lSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ecbcc2" />
                <stop offset="0.32" stopColor="#f2c3ba" />
                <stop offset="0.56" stopColor="#f8d8c4" />
                <stop offset="1" stopColor="#f7e5d2" />
              </linearGradient>
            </defs>
            <rect width="1600" height="1000" fill="url(#lSky)" />
            {/* watercolor blooms in the wash */}
            <Clouds
              items={[
                { cx: 380, cy: 120, rx: 420, ry: 120, color: "#f6d3cf", o: 0.45 },
                { cx: 1180, cy: 90, rx: 380, ry: 110, color: "#e9b3b9", o: 0.35 },
                { cx: 800, cy: 470, rx: 700, ry: 90, color: "#fbe3cc", o: 0.6 },
              ]}
            />
          </Art>
        </Layer>
        <div aria-hidden="true" className="absolute inset-0" style={{ opacity: `calc(0.5 * var(--p))` }}>
          <svg viewBox={VB} preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="lGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f2b8a0" stopOpacity="0" />
                <stop offset="0.62" stopColor="#f6c48e" />
                <stop offset="1" stopColor="#f6c48e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect width="1600" height="1000" fill="url(#lGold)" />
          </svg>
        </div>
        <Layer move={`translateY(calc(-6% * var(--d) * var(--p))) ${grow(0.05)}`}>
          <div className="drift absolute inset-0">
            <Art slot="clouds">
              <Clouds
                items={[
                  { cx: 240, cy: 180, rx: 300, ry: 44, color: "#e99ea0", o: 0.5 },
                  { cx: 540, cy: 250, rx: 230, ry: 30, color: "#f2a983", o: 0.45 },
                  { cx: 1230, cy: 160, rx: 330, ry: 50, color: "#e99ea0", o: 0.42 },
                  { cx: 1320, cy: 262, rx: 250, ry: 28, color: "#f2a983", o: 0.5 },
                  { cx: 820, cy: 360, rx: 420, ry: 22, color: "#f6c3ad", o: 0.5 },
                ]}
              />
            </Art>
          </div>
        </Layer>
        <Layer move={grow(0.09)}>
          <Art slot="farHills">
            <PaintedHill seed={3} points={[[0, 562], [380, 532], [760, 556], [1160, 522], [1600, 550]]} base="#cbb6c2" strokes={["#bba7b8", "#d6c3c9", "#c2b0c0"]} density={0.25} angle={-2} />
            <PaintedHill seed={4} points={[[0, 610], [300, 590], [700, 614], [1100, 592], [1600, 606]]} base="#bfc5a8" strokes={["#aab394", "#c9cdb0", "#b5bd9d"]} density={0.3} angle={-3} />
          </Art>
        </Layer>

        {/* light gathering where the path ends: grows toward the invitation */}
        <Layer move={grow(0.26)}>
          <svg viewBox={VB} preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" style={{ opacity: `calc(0.25 + 0.65 * ${ramp(0.6, 0.95)})` }}>
            <ellipse cx="800" cy="640" rx="380" ry="150" fill="url(#warmGlow)" />
          </svg>
        </Layer>

        {/* ---- midground: rolling hills, hedges, trees, far end of the path ---- */}
        <Layer move={grow(0.26)}>
          <Art slot="midground">
            <PaintedHill seed={5} points={[[0, 664], [260, 634], [560, 670], [900, 644], [1250, 664], [1600, 638]]} base="#a9b97f" strokes={["#93a96c", "#b9c48a", "#7f9a66", "#c2c98f"]} density={0.55} angle={-6} />
            <g filter="url(#wash)" fill="#58775a" opacity="0.55">
              <path d="M0 670 C 120 652, 260 644, 420 658 C 380 674, 160 682, 0 686 Z" />
              <path d="M1080 664 C 1200 642, 1340 638, 1500 650 C 1440 666, 1220 678, 1080 682 Z" />
            </g>
            <TreeClump x={290} y={650} s={0.9} />
            <TreeClump x={350} y={656} s={0.65} tone="#6f8a5a" />
            <TreeClump x={560} y={668} s={0.55} tone="#6f8a5a" />
            <TreeClump x={1170} y={646} s={1} />
            <TreeClump x={1240} y={652} s={0.7} tone="#6f8a5a" />
            <TreeClump x={1430} y={644} s={0.8} />
            {/* the path's far end, tucked beneath the meadow ridge */}
            <path d="M796 650 C 786 668, 812 684, 800 704 C 790 722, 772 738, 780 760 L 830 760 C 822 740, 830 722, 838 704 C 848 684, 816 668, 806 650 Z" fill="#efdcbd" filter="url(#wash)" />
            <Wildflowers seed={11} count={90} x={[0, 1600]} y={[660, 760]} size={[1, 2.4]} colors={["#fbf3ea", "#f2b8a0", "#e3bf73", "#c9b8d8"]} />
          </Art>
        </Layer>

        {/* ---- near meadow: wildflowers and the path coming toward us ---- */}
        <Layer move={grow(0.58)}>
          <Art slot="meadow">
            <PaintedHill seed={6} points={[[0, 744], [320, 720], [700, 740], [1040, 716], [1600, 736]]} base="#b2c085" strokes={["#9db274", "#c4cb8c", "#87a067", "#d1cf96", "#6f8f62"]} density={0.85} angle={-10} />
            <g filter="url(#wash)">
              <path d="M792 732 C 770 762, 840 782, 820 818 C 796 862, 700 892, 730 942 C 745 972, 790 990, 790 1000 L 940 1000 C 925 960, 845 930, 862 890 C 882 850, 930 812, 880 776 C 850 754, 826 746, 818 732 Z" fill="#f2e3c4" />
            </g>
            <Wildflowers seed={21} count={280} x={[0, 1600]} y={[752, 1000]} size={[1.4, 7]} colors={["#f2b8a0", "#e9afab", "#fbf3ea", "#fbf3ea", "#e3bf73", "#c9b8d8", "#d9776a"]} />
          </Art>
        </Layer>

        {/* ---- flower bed: rises in as the garden grows closer (Moment 3) ---- */}
        <Layer
          className="absolute inset-x-0 bottom-0 h-[34%]"
          origin="50% 100%"
          move={`translateY(calc(72% * (1 - ${ramp(0.3, 0.62)}))) ${grow(0.14, 0.7, 1)}`}
        >
          <Art slot="flowerBed" viewBox="0 0 1600 400" fit="object-cover object-bottom">
            <GrassBlades seed={41} count={220} x={[0, 1600]} bottom={400} height={[60, 240]} colors={GREENS} keep={(x) => Math.abs(x - 830) > 120} />
            <Wildflowers seed={42} count={120} x={[0, 1600]} y={[230, 400]} size={[5, 12]} colors={BLOSSOMS} keep={(x) => Math.abs(x - 830) > 130} />
            <ForegroundStems seed={43} xs={[520, 600, 680, 990, 1060, 1140]} bottom={400} height={260} colors={BLOSSOMS} />
          </Art>
        </Layer>

        {/* ---- foreground frame: rises, then parts as we step through ---- */}
        <Layer
          className="absolute bottom-0 left-0 aspect-[3/4] w-[clamp(170px,34vw,560px)]"
          origin="0% 100%"
          move={`translateX(calc(-16% * var(--d) * ${ramp(0.74, 1)})) translateY(calc(20% * (1 - ${ramp(0, 0.6)}))) ${grow(0.14, 0.3, 1)}`}
        >
          <Art slot="foregroundLeft" viewBox="0 0 600 800" align="xMinYMax meet" fit="object-contain object-left-bottom">
            <ForegroundCluster seed={61} />
          </Art>
        </Layer>
        <Layer
          className="absolute right-0 bottom-0 aspect-[3/4] w-[clamp(170px,34vw,560px)]"
          origin="100% 100%"
          move={`translateX(calc(16% * var(--d) * ${ramp(0.74, 1)})) translateY(calc(24% * (1 - ${ramp(0.05, 0.65)}))) ${grow(0.14, 0.3, 1)}`}
        >
          <Art slot="foregroundRight" viewBox="0 0 600 800" align="xMaxYMax meet" fit="object-contain object-right-bottom">
            <ForegroundCluster seed={71} flip />
          </Art>
        </Layer>

        {/* ---- Moment 1: Arrival ---- */}
        <Moment opacity={`calc(1 - ${ramp(0.08, 0.15)})`} still className="inset-x-0 top-[max(5.5rem,15vh)] px-5 text-center">
          <h1 className="font-serif text-[clamp(2.9rem,8.2vw,6.6rem)] leading-[0.96] font-medium tracking-tight text-ink">{copy.welcome.title}</h1>
          <p className="mt-3 font-hand text-[clamp(1.7rem,3.2vw,2.4rem)] leading-none text-rose">{copy.welcome.name}</p>
          <p className="mt-3 text-[0.8rem] font-semibold tracking-[0.24em] text-ink/80 uppercase sm:text-sm">{copy.welcome.descriptor}</p>
        </Moment>
        <div style={{ opacity: `calc(1 - ${ramp(0, 0.05)})` }} className="journey-text pointer-events-none absolute inset-x-0 bottom-[6vh] flex flex-col items-center gap-1 text-ink [text-shadow:0_1px_16px_rgb(251_247_238/0.95)]">
          <span className="font-hand text-2xl">{copy.welcome.hint}</span>
          <svg viewBox="0 0 24 36" className="h-8 w-5 motion-safe:animate-bounce" aria-hidden="true">
            <path d="M12 2 V32 M4 24 L12 32 L20 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* ---- Moment 2: A little seed (left) ---- */}
        <Moment opacity={fade(0.18, 0.25, 0.37, 0.43)} className="top-[max(6rem,20vh)] left-[6vw] max-w-[min(30rem,82vw)] text-left">
          <svg viewBox="0 0 60 50" className="mb-2 h-10 w-12" aria-hidden="true" focusable="false">
            <g filter="url(#paint)">
              <ellipse cx="30" cy="42" rx="12" ry="6" fill="#a27a5e" />
              <path d="M30 40 C 30 30, 29 24, 30 16" stroke="#5f7d55" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M30 22 C 22 14, 12 16, 10 20 C 18 24, 26 24, 30 22 Z" fill="#87a067" />
              <path d="M30 18 C 38 8, 48 10, 50 14 C 42 20, 34 20, 30 18 Z" fill="#9db274" />
            </g>
          </svg>
          <p className={statement}>{copy.seed}</p>
        </Moment>

        {/* ---- Moment 3: Design philosophy (right) ---- */}
        <Moment opacity={fade(0.46, 0.53, 0.65, 0.71)} className="top-[max(6rem,20vh)] right-[6vw] max-w-[min(30rem,82vw)] text-right">
          <p className={`${statement} italic`}>{copy.philosophy}</p>
        </Moment>

        {/* ---- Moment 4: Invitation ---- */}
        <Moment opacity={fade(0.76, 0.84)} className="inset-x-0 top-[max(6rem,19vh)] px-5 text-center">
          <p className={`mx-auto max-w-3xl ${statement}`}>{copy.invitation}</p>
          <Link
            href="/work"
            onFocus={toEnd}
            className="pointer-events-none mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-forest px-8 py-3 font-medium text-paper shadow-[0_12px_28px_-12px_rgb(64_88_60/0.85)] transition [text-shadow:none] group-data-[end=true]:pointer-events-auto hover:bg-[#344a31]"
          >
            {copy.cta} <span aria-hidden="true">→</span>
          </Link>
        </Moment>
      </div>
    </section>
  );
}
