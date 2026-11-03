"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef } from "react";
import { landingScenes as copy } from "@/data/site";
import { landingArt, type LandingArtSlot } from "@/data/landingArt";
import { ridgePath, seeded } from "../garden/scatter";
import { Clouds, ForegroundStems, GrassBlades, LeafSpray, PaintedHill, Wildflowers } from "../garden/Painted";

// The Landing is one tall painting (1600 × 4000 units) that the visitor travels
// down. A sticky full-viewport stage holds the painting; native scrolling sets
// one CSS variable, --p (0 → 1), and the painting slides up by --p × --pan.
// The top of the painting is distant sky and hills; further down everything is
// nearer and larger, so moving down reads as walking forward along the path.
// Layers drift a few percent against each other (scaled by --d: 1 on desktop,
// 0.5 on phones, 0 with reduced motion), each lined up exactly at its anchor.
// Composition, timeline and art spec: docs/LANDING-ART-SPEC.md.

const W = 1600;
const H = 4000;

/** 0 before `a`, 1 after `b`, linear in between. */
const ramp = (a: number, b: number) => `clamp(0, (var(--p) - ${a}) / ${b - a}, 1)`;

/** Pan a layer with the painting; `drift` is its extra speed, zero at progress `anchor`. */
const pan = (drift = 0, anchor = 0) =>
  `translateY(calc(-1 * var(--pan) * (var(--p) + ${drift} * var(--d) * (var(--p) - ${anchor}))))`;

const GREENS = ["#6f8f5a", "#87a067", "#9db274", "#5f7d55", "#b3c180"];
const BLOSSOMS = ["#fbf3ea", "#f2b8a0", "#e9afab", "#fbf3ea", "#e3bf73", "#d9776a"];
const MEADOW_FLOWERS = ["#f2b8a0", "#e9afab", "#fbf3ea", "#fbf3ea", "#e3bf73", "#c9b8d8", "#d9776a"];

// ---- the path: one winding ribbon from the horizon to the visitor's feet ----

// [y, x] control points: right of centre at the seed note, left at the
// philosophy note, right again at the observation note, centred at the arch.
const PATH: [number, number][] = [
  [650, 800], [1000, 860], [1300, 960], [1650, 900], [1950, 760], [2250, 640],
  [2550, 660], [2850, 840], [3100, 930], [3400, 890], [3700, 820], [4000, 805],
];

function pathX(y: number) {
  let i = 0;
  while (i < PATH.length - 2 && y > PATH[i + 1][0]) i++;
  const p0 = PATH[Math.max(i - 1, 0)][1];
  const [y1, p1] = PATH[i];
  const [y2, p2] = PATH[i + 1];
  const p3 = PATH[Math.min(i + 2, PATH.length - 1)][1];
  const t = Math.min(1, Math.max(0, (y - y1) / (y2 - y1)));
  return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
}
const pathHalfWidth = (y: number) => 4 + ((y - 650) / (H - 650)) * 215;
const offPath = (pad: number) => (x: number, y: number) => Math.abs(x - pathX(y)) > pathHalfWidth(y) + pad;

function pathD(y0: number, y1: number) {
  const left: string[] = [];
  const right: string[] = [];
  for (let y = y0; y <= y1; y += 25) {
    const x = pathX(y);
    const w = pathHalfWidth(y);
    left.push(`${(x - w).toFixed(1)} ${y}`);
    right.push(`${(x + w).toFixed(1)} ${y}`);
  }
  return `M${left.join(" L")} L${right.reverse().join(" L")} Z`;
}

function Path({ y0, y1 }: { y0: number; y1: number }) {
  return (
    <g>
      <path d={pathD(y0, y1)} fill="#f0dfbf" filter="url(#wash)" />
      <Wildflowers seed={y0} count={Math.round((y1 - y0) / 14)} x={[300, 1300]} y={[y0, y1]} size={[1, 4]} colors={["#e6cfa6", "#d9c09a", "#f6ead2"]} keep={(x, y) => !offPath(-10)(x, y)} />
    </g>
  );
}

// ---- rolling bands of hills that get nearer (bigger brushwork) going down ----

function ridgeAt(y: number, seed: number, amp: number): [number, number][] {
  const r = seeded(seed);
  return [0, 320, 640, 960, 1280, 1600].map((x) => [x, Math.round(y + (r() - 0.5) * 2 * amp)]);
}

/**
 * One rolling hill. Its crest catches the light and its far foot, where the next
 * hill rises in front, sinks into shadow; that is what makes the bands read as
 * hills coming toward you rather than a flat lawn. `overlap` is how much of its
 * bottom the next band covers.
 */
function Band({ y, next, overlap, seed, base, strokes, scale, hedge }: { y: number; next: number; overlap: number; seed: number; base: string; strokes: string[]; scale: number; hedge?: boolean }) {
  const points = ridgeAt(y, seed, 26 + scale * 8);
  const top = Math.min(...points.map((p) => p[1]));
  const foot = (next - overlap - top) / (next - top);
  const id = `band${seed}`;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4efc6" stopOpacity="0.32" />
          <stop offset={(foot * 0.35).toFixed(3)} stopColor="#f4efc6" stopOpacity="0" />
          <stop offset={(foot * 0.7).toFixed(3)} stopColor="#3f5a3a" stopOpacity="0" />
          <stop offset={foot.toFixed(3)} stopColor="#3f5a3a" stopOpacity="0.3" />
          <stop offset="1" stopColor="#3f5a3a" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <PaintedHill seed={seed} points={points} bottom={next} base={base} strokes={strokes} density={0.8} angle={-8} scale={scale} />
      <path d={ridgePath(points, next)} fill={`url(#${id})`} filter="url(#wash)" />
      {hedge && (
        <path d={ridgePath(points.map(([x, py]) => [x, py + 4 * scale]), y + 40 * scale)} fill="#58775a" opacity="0.45" filter="url(#wash)" />
      )}
    </g>
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

/** A tilled patch with seedlings, beside the first note. */
function Seedbed({ x, y }: { x: number; y: number }) {
  const sprouts = [[-110, 4], [-60, -8], [-10, 6], [40, -6], [90, 5], [-85, 30], [-30, 34], [20, 28], [70, 32]];
  return (
    <g transform={`translate(${x} ${y})`}>
      <g filter="url(#wash)">
        <ellipse cx="0" cy="16" rx="170" ry="46" fill="#a98a6a" opacity="0.85" />
        <ellipse cx="-10" cy="10" rx="140" ry="30" fill="#b99a78" opacity="0.7" />
      </g>
      <g filter="url(#paint)">
        {sprouts.map(([sx, sy], i) => (
          <g key={i} transform={`translate(${sx} ${sy}) scale(${1.5 + (i % 3) * 0.3})`}>
            <path d="M0 0 C 0 -8, -1 -14, 0 -22" stroke="#5f7d55" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M0 -16 C -8 -24, -18 -22, -20 -18 C -12 -14, -5 -14, 0 -16 Z" fill="#87a067" />
            <path d="M0 -20 C 8 -30, 18 -28, 20 -24 C 12 -18, 5 -18, 0 -20 Z" fill="#9db274" />
          </g>
        ))}
      </g>
    </g>
  );
}

/** The rose-covered arch the path walks through at the end. */
function GardenArch() {
  const r = seeded(77);
  const roses = Array.from({ length: 26 }, (_, i) => {
    const t = i / 25;
    const a = Math.PI * (1 - t);
    const round = (v: number) => Math.round(v * 10) / 10;
    return { x: round(810 + Math.cos(a) * 250 + (r() - 0.5) * 30), y: round(3640 - Math.sin(a) * 170 + (r() - 0.5) * 30), c: ["#e9afab", "#d9776a", "#fbf3ea", "#f2b8a0"][i % 4], s: round(9 + r() * 7) };
  });
  return (
    <g>
      <ellipse cx="810" cy="3700" rx="360" ry="260" fill="url(#warmGlow)" opacity="0.85" />
      <g filter="url(#paint)">
        <path d="M548 4000 L552 3650 L580 3650 L578 4000 Z" fill="#8a6e55" />
        <path d="M1042 4000 L1040 3650 L1068 3650 L1072 4000 Z" fill="#8a6e55" />
        <path d="M562 3650 C 600 3420, 1020 3420, 1056 3650" stroke="#8a6e55" strokeWidth="24" fill="none" strokeLinecap="round" />
        <path d="M570 3660 C 620 3470, 1000 3470, 1048 3660" stroke="#6f8a5a" strokeWidth="9" fill="none" strokeDasharray="22 14" strokeLinecap="round" />
      </g>
      <g filter="url(#paint)">
        {roses.map((p, i) => (
          <g key={i}>
            <ellipse cx={p.x - p.s} cy={p.y + p.s * 0.6} rx={p.s * 0.9} ry={p.s * 0.45} fill="#6f8a5a" transform={`rotate(-30 ${p.x} ${p.y})`} />
            <circle cx={p.x} cy={p.y} r={p.s} fill={p.c} />
            <circle cx={p.x} cy={p.y} r={p.s * 0.45} fill="#fbf3ea" opacity="0.45" />
          </g>
        ))}
      </g>
    </g>
  );
}

function Layer({ move, children }: { move: string; children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="absolute top-0 left-1/2 will-change-transform"
      style={{ width: `calc(${W} * var(--u))`, height: `calc(${H} * var(--u))`, marginLeft: `calc(-${W / 2} * var(--u))`, transform: move }}
    >
      {children}
    </div>
  );
}

/** A painted image when one has been supplied for the slot, otherwise the code-drawn placeholder. */
function Art({ slot, children }: { slot: LandingArtSlot; children: React.ReactNode }) {
  const src = landingArt[slot];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- decorative layer; sizing is handled by CSS
    return <img src={src} alt="" className="absolute inset-0 h-full w-full" />;
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" focusable="false" data-placeholder={slot}>
      {children}
    </svg>
  );
}

/** A handwritten annotation written into the painting at height `y`. */
function Note({ text, y, side }: { text: string; y: number; side: "left" | "right" }) {
  return (
    <p
      data-note
      data-shown="false"
      style={{ top: `${(y / H) * 100}%` }}
      className={`garden-note absolute isolate max-w-[min(28rem,84vw)] font-hand text-[clamp(2.1rem,4.4vw,3.5rem)] leading-[1.05] text-ink ${
        side === "left" ? "left-[6vw] -rotate-2 text-left" : "right-[6vw] rotate-2 text-right"
      }`}
    >
      {text.split(" ").map((word, i) => (
        <Fragment key={i}>
          <span className="note-word" style={{ transitionDelay: `${i * 110}ms` }}>
            {word}
          </span>{" "}
        </Fragment>
      ))}
    </p>
  );
}

const MID_BANDS = [
  { y: 668, base: "#adbb86", strokes: ["#9cad7a", "#bcc596", "#a3b38d"], scale: 0.6 },
  { y: 850, base: "#a7b880", strokes: ["#93a96c", "#b9c48a", "#8aa26e"], scale: 0.8 },
  { y: 1070, base: "#a3b57a", strokes: ["#8fa76a", "#b5c286", "#7f9a66", "#c2c98f"], scale: 1 },
  { y: 1320, base: "#a8b97c", strokes: ["#93a96c", "#bfc98d", "#7f9a66", "#d0cf98"], scale: 1.25 },
  { y: 1600, base: "#9fb376", strokes: ["#8aa565", "#b3c180", "#6f8f5a", "#c9cf93"], scale: 1.5 },
  { y: 1900, base: "#a5b77a", strokes: ["#8aa565", "#b8c486", "#6f8f5a", "#d1cf96"], scale: 1.75 },
  { y: 2200, base: "#9db274", strokes: ["#87a067", "#b3c180", "#6f8f62", "#c4cb8c"], scale: 2 },
];
const NEAR_BANDS = [
  { y: 2360, base: "#a2b678", strokes: ["#87a067", "#b9c48a", "#6f8f5a", "#d1cf96"], scale: 2.2 },
  { y: 2640, base: "#9db274", strokes: ["#82a063", "#b3c180", "#5f7d55", "#c9cf93"], scale: 2.5 },
  { y: 2930, base: "#a3b67a", strokes: ["#87a067", "#bcc78a", "#6f8f5a", "#d6d39a"], scale: 2.8 },
  { y: 3230, base: "#98ae70", strokes: ["#7f9a60", "#b3c180", "#5f7d55", "#c4cb8c"], scale: 3.1 },
];

const TREES: [number, number, number, string?][] = [
  [240, 676, 0.45], [300, 680, 0.35, "#6f8a5a"], [1180, 664, 0.5], [1250, 670, 0.4, "#6f8a5a"],
  [130, 860, 0.7], [560, 870, 0.55, "#6f8a5a"], [1340, 852, 0.75],
  [1210, 1080, 0.95, "#6f8a5a"], [1460, 1076, 1.1],
  [120, 1600, 1.4, "#6f8a5a"], [1420, 1620, 1.5],
  [1480, 1905, 1.8], [90, 2210, 2.1, "#6f8a5a"],
];

export default function LandingJourney() {
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const stage = stageRef.current;
    if (!el || !stage) return;
    const notes = Array.from(el.querySelectorAll<HTMLElement>("[data-note]"));
    const update = () => {
      const range = el.offsetHeight - stage.offsetHeight;
      const p = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / Math.max(1, range)));
      el.style.setProperty("--p", p.toFixed(4));
      // Each note is written in once it has travelled into the lower three quarters of the view.
      for (const n of notes) {
        if (n.dataset.shown === "true") continue;
        const r = n.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.78 && r.bottom > 0) n.dataset.shown = "true";
      }
    };
    el.dataset.ready = "true";
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Keyboard users who tab to the CTA are carried to the end of the walk, where it is shown.
  const toEnd = () => {
    const el = ref.current;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (el) window.scrollTo({ top: el.offsetTop + el.offsetHeight - window.innerHeight, behavior: still ? "auto" : "smooth" });
  };

  return (
    <section
      ref={ref}
      aria-label="A walk through the garden"
      className="garden-walk relative [--d:0.5] [--p:0] md:[--d:1]"
      style={
        {
          // One painting unit in pixels: the painting always covers the viewport.
          "--u": `max(100vw / ${W}, 100svh / 1000)`,
          // How far the painting travels from top to bottom.
          "--pan": `calc(${H} * var(--u) - 100svh)`,
          // The walk takes a little more scrolling than the painting moves (0.75×).
          height: `calc(100svh + (${H} * var(--u) - 100svh) / 0.75)`,
        } as React.CSSProperties
      }
    >
      <div ref={stageRef} className="paper-grain sticky top-0 h-[100svh] overflow-hidden bg-[#f4c4b7]">
        {/* sky: drifts slightly slower, as the farthest thing */}
        <Layer move={pan(-0.08)}>
          <Art slot="sky">
            <defs>
              <linearGradient id="lSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ebbac1" />
                <stop offset="0.35" stopColor="#f2c3ba" />
                <stop offset="0.62" stopColor="#f8d6c2" />
                <stop offset="1" stopColor="#f8e4cf" />
              </linearGradient>
            </defs>
            <rect width={W} height="700" fill="url(#lSky)" />
            <rect y="690" width={W} height={H - 690} fill="#a9b97f" />
            <Clouds
              items={[
                { cx: 360, cy: 130, rx: 420, ry: 110, color: "#f6d3cf", o: 0.45 },
                { cx: 1200, cy: 100, rx: 380, ry: 100, color: "#e9b3b9", o: 0.35 },
                { cx: 230, cy: 210, rx: 280, ry: 40, color: "#e99ea0", o: 0.5 },
                { cx: 560, cy: 290, rx: 220, ry: 28, color: "#f2a983", o: 0.45 },
                { cx: 1250, cy: 220, rx: 320, ry: 46, color: "#e99ea0", o: 0.42 },
                { cx: 1330, cy: 320, rx: 240, ry: 26, color: "#f2a983", o: 0.5 },
                { cx: 820, cy: 420, rx: 460, ry: 22, color: "#f6c3ad", o: 0.5 },
                { cx: 800, cy: 540, rx: 720, ry: 70, color: "#fbe3cc", o: 0.65 },
              ]}
            />
          </Art>
        </Layer>

        {/* distant ranges */}
        <Layer move={pan(-0.04)}>
          <Art slot="farHills">
            <PaintedHill seed={3} points={[[0, 566], [380, 536], [760, 560], [1160, 528], [1600, 554]]} bottom={900} base="#cbb6c2" strokes={["#bba7b8", "#d6c3c9", "#c2b0c0"]} density={0.25} angle={-2} />
            <PaintedHill seed={4} points={[[0, 616], [300, 594], [700, 618], [1100, 596], [1600, 610]]} bottom={900} base="#bfc5a8" strokes={["#aab394", "#c9cdb0", "#b5bd9d"]} density={0.3} angle={-3} />
          </Art>
        </Layer>

        {/* midground: rolling bands, trees, the seedbed and the path */}
        <Layer move={pan()}>
          <Art slot="midground">
            {MID_BANDS.map((b, i) => (
              <Band key={b.y} y={b.y} next={i === MID_BANDS.length - 1 ? H : MID_BANDS[i + 1].y + 200} overlap={i === MID_BANDS.length - 1 ? H - 2560 : 200} seed={10 + i} base={b.base} strokes={b.strokes} scale={b.scale} hedge={i % 2 === 1} />
            ))}
            {MID_BANDS.slice(1).map((b, i) => (
              <Wildflowers key={b.y} seed={30 + i} count={70} x={[0, W]} y={[b.y + 20, b.y + 260]} size={[0.8 + i * 0.9, 2 + i * 1.5]} colors={MEADOW_FLOWERS} keep={offPath(30)} />
            ))}
            {TREES.map(([x, y, s, tone]) => (
              <TreeClump key={`${x}-${y}`} x={x} y={y} s={s} tone={tone} />
            ))}
            <Path y0={650} y1={2900} />
            <Seedbed x={420} y={1400} />
          </Art>
        </Layer>

        {/* near meadow: closer bands, the path widening, the little daisies */}
        <Layer move={pan(0.03, 0.55)}>
          <Art slot="nearMeadow">
            {NEAR_BANDS.map((b, i) => (
              <Band key={b.y} y={b.y} next={i === NEAR_BANDS.length - 1 ? H : NEAR_BANDS[i + 1].y + 220} overlap={i === NEAR_BANDS.length - 1 ? 300 : 220} seed={50 + i} base={b.base} strokes={b.strokes} scale={b.scale} hedge={i === 1} />
            ))}
            <Path y0={2330} y1={H} />
            {NEAR_BANDS.map((b, i) => (
              <Wildflowers key={b.y} seed={60 + i} count={90} x={[0, W]} y={[b.y + 20, b.y + 300]} size={[4 + i * 1.5, 7 + i * 2]} colors={MEADOW_FLOWERS} keep={offPath(40)} />
            ))}
            <GrassBlades seed={68} count={40} x={[1030, 1480]} bottom={2520} height={[30, 90]} colors={GREENS} />
            <Wildflowers seed={69} count={46} x={[1040, 1460]} y={[2390, 2520]} size={[8, 13]} colors={["#fbf3ea", "#fbf3ea", "#fbf3ea", "#f6e6d4", "#f2b8a0"]} />
          </Art>
        </Layer>

        {/* foreground: tall grass, big flowers and the arch at the path's end */}
        <Layer move={pan(0.06, 1)}>
          <Art slot="foreground">
            <GardenArch />
            <GrassBlades seed={81} count={90} x={[-20, 560]} bottom={H} height={[140, 460]} colors={GREENS} />
            <GrassBlades seed={82} count={90} x={[1060, 1620]} bottom={H} height={[140, 460]} colors={GREENS} />
            <ForegroundStems seed={83} xs={[50, 170, 300, 430, 1180, 1310, 1440, 1550]} bottom={H} height={600} colors={BLOSSOMS} />
            <Wildflowers seed={84} count={70} x={[0, W]} y={[3260, H]} size={[10, 18]} colors={BLOSSOMS} keep={offPath(60)} />
          </Art>
        </Layer>

        {/* leaves at the edges, passing slightly faster */}
        <Layer move={pan(0.1, 0.5)}>
          <Art slot="sideSprigs">
            <LeafSpray x={10} y={1250} length={320} angle={38} color="#7f9a66" scale={1.1} />
            <LeafSpray x={1590} y={1900} length={360} angle={-36} color="#93a96c" scale={1.3} />
            <LeafSpray x={10} y={2650} length={420} angle={34} color="#6f8f5a" scale={1.6} />
            <LeafSpray x={1590} y={3150} length={460} angle={-32} color="#7f9a66" scale={1.9} />
          </Art>
        </Layer>

        {/* words written into the painting; they travel with the midground */}
        <div className="absolute inset-x-0 top-0 will-change-transform" style={{ height: `calc(${H} * var(--u))`, transform: pan() }}>
          <div className="absolute inset-x-0 top-[max(5.5rem,14svh)] px-5 text-center [text-shadow:0_1px_24px_rgb(251_247_238/0.95),0_0_2px_rgb(251_247_238/0.6)]">
            <h1 className="font-serif text-[clamp(2.9rem,8.2vw,6.6rem)] leading-[0.96] font-medium tracking-tight text-ink">{copy.welcome.title}</h1>
            <p className="mt-3 font-hand text-[clamp(1.7rem,3.2vw,2.4rem)] leading-none text-rose">{copy.welcome.name}</p>
            <p className="mt-3 text-[0.8rem] font-semibold tracking-[0.24em] text-ink/80 uppercase sm:text-sm">{copy.welcome.descriptor}</p>
          </div>

          <Note text={copy.seed} y={1170} side="left" />
          <Note text={copy.philosophy} y={2130} side="right" />
          <Note text={copy.observation} y={2740} side="left" />

          {/* the invitation sits in the last view of the painting, above the arch */}
          <div data-note data-shown="false" className="garden-note absolute inset-x-0 top-[calc(100%-100svh+max(6rem,17svh))] px-5 text-center">
            <p className="font-hand text-[clamp(2.4rem,5vw,4rem)] leading-[1.05] text-ink">
              {copy.invitation.split(" ").map((word, i) => (
                <Fragment key={i}>
                  <span className="note-word" style={{ transitionDelay: `${i * 110}ms` }}>
                    {word}
                  </span>{" "}
                </Fragment>
              ))}
            </p>
            <Link
              href="/work"
              onFocus={toEnd}
              className="note-word mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-forest px-8 py-3 font-medium text-paper shadow-[0_12px_28px_-12px_rgb(64_88_60/0.85)] transition hover:bg-[#344a31]"
              style={{ transitionDelay: "700ms" }}
            >
              {copy.cta} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div
          style={{ opacity: `calc(1 - ${ramp(0, 0.04)})` }}
          className="pointer-events-none absolute inset-x-0 bottom-[6vh] flex flex-col items-center gap-1 text-ink [text-shadow:0_1px_16px_rgb(251_247_238/0.95)]"
        >
          <span className="font-hand text-2xl">{copy.welcome.hint}</span>
          <svg viewBox="0 0 24 36" className="h-8 w-5 motion-safe:animate-bounce" aria-hidden="true">
            <path d="M12 2 V32 M4 24 L12 32 L20 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </section>
  );
}
