"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { landingScenes as copy } from "@/data/site";
import { Greenhouse, Cottage, Windmill } from "../garden/GardenObjects";
import { Clouds, ForegroundStems, PaintedHill, Wildflowers } from "../garden/Painted";

// One continuous, native-scroll journey: a tall section with a sticky viewport
// whose painted layers rise into place as the visitor scrolls. Nothing traps
// the scroll. The scroll handler writes one CSS variable, --p (0 → 1), and every
// layer and statement derives its position and opacity from it in CSS.
// Reduced motion (globals.css) keeps layers still and only fades the text.

const VB = "0 0 1600 1000";

/** 0 before `a`, 1 after `b`, linear in between. */
const ramp = (a: number, b: number) => `clamp(0, (var(--p) - ${a}) / ${b - a}, 1)`;
/** Fade in over a→b, hold, fade out over c→d. */
const fade = (a: number, b: number, c?: number, d?: number) =>
  c === undefined || d === undefined ? ramp(a, b) : `calc(${ramp(a, b)} * (1 - ${ramp(c, d)}))`;
/** Start `from` percent lower and settle at 0 between a and b. */
const rise = (from: number, a: number, b: number) => `translateY(calc(${from}% * (1 - ${ramp(a, b)})))`;

function Layer({ move, children, className = "" }: { move?: string; children: React.ReactNode; className?: string }) {
  return (
    <div aria-hidden="true" className={`journey-move absolute inset-0 will-change-transform ${className}`} style={{ transform: move }}>
      {children}
    </div>
  );
}

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" focusable="false">
      {children}
    </svg>
  );
}

function Scene({ opacity, lift = true, children, className = "" }: { opacity: string; lift?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div
      style={{ opacity, transform: lift ? `translateY(calc(24px * (1 - ${opacity})))` : undefined }}
      className={`journey-text pointer-events-none absolute inset-x-0 top-[17vh] px-5 text-center [text-shadow:0_1px_28px_rgb(251_247_238/0.95)] ${className}`}
    >
      {children}
    </div>
  );
}

export default function LandingJourney() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const range = el.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, (window.scrollY - el.offsetTop) / Math.max(1, range)));
      el.style.setProperty("--p", p.toFixed(4));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const toEnd = () => {
    const el = ref.current;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (el) window.scrollTo({ top: el.offsetTop + el.offsetHeight - window.innerHeight, behavior: still ? "auto" : "smooth" });
  };

  return (
    <section ref={ref} aria-label="A walk through the garden" className="relative h-[460vh] [--p:0]">
      <div className="paper-grain sticky top-0 h-[100svh] overflow-hidden">
        {/* sky */}
        <Layer>
          <Svg>
            <defs>
              <linearGradient id="lSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#efc1c3" />
                <stop offset="0.38" stopColor="#f4c4b7" />
                <stop offset="0.66" stopColor="#f8dbc9" />
                <stop offset="1" stopColor="#f7e7d6" />
              </linearGradient>
              <linearGradient id="lGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f2b8a0" stopOpacity="0" />
                <stop offset="0.6" stopColor="#f6c48e" />
                <stop offset="1" stopColor="#f6c48e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect width="1600" height="1000" fill="url(#lSky)" />
          </Svg>
        </Layer>
        <div aria-hidden="true" className="absolute inset-0" style={{ opacity: `calc(0.55 * var(--p))` }}>
          <Svg>
            <rect width="1600" height="1000" fill="url(#lGold)" />
          </Svg>
        </div>
        <Layer move={`translateY(calc(-10% * var(--p)))`}>
          <div className="drift absolute inset-0">
            <Svg>
              <Clouds
                items={[
                  { cx: 260, cy: 170, rx: 320, ry: 48, color: "#e99ea0", o: 0.5 },
                  { cx: 560, cy: 236, rx: 240, ry: 32, color: "#f2a983", o: 0.5 },
                  { cx: 1220, cy: 150, rx: 340, ry: 54, color: "#e99ea0", o: 0.45 },
                  { cx: 1300, cy: 250, rx: 260, ry: 30, color: "#f2a983", o: 0.55 },
                  { cx: 820, cy: 340, rx: 420, ry: 24, color: "#f6c3ad", o: 0.5 },
                  { cx: 140, cy: 330, rx: 200, ry: 20, color: "#f3b2a2", o: 0.4 },
                ]}
              />
            </Svg>
          </div>
        </Layer>

        {/* distant ranges */}
        <Layer move={`translateY(calc(-5% * var(--p)))`}>
          <Svg>
            <PaintedHill seed={3} points={[[0, 560], [380, 530], [760, 552], [1160, 520], [1600, 548]]} base="#cbb6c2" strokes={["#bba7b8", "#d6c3c9", "#c2b0c0"]} density={0.25} angle={-2} />
            <PaintedHill seed={4} points={[[0, 606], [300, 586], [700, 612], [1100, 590], [1600, 604]]} base="#bfc5a8" strokes={["#aab394", "#c9cdb0", "#b5bd9d"]} density={0.3} angle={-3} />
          </Svg>
        </Layer>

        {/* scene 2: greener rolling hills */}
        <Layer move={rise(22, 0, 0.35)}>
          <Svg>
            <PaintedHill seed={5} points={[[0, 660], [260, 630], [560, 668], [900, 640], [1250, 662], [1600, 636]]} base="#a9b97f" strokes={["#93a96c", "#b9c48a", "#7f9a66", "#c2c98f"]} density={0.55} angle={-6} />
            {/* hedgerow */}
            <g filter="url(#wash)" fill="#58775a" opacity="0.55">
              <path d="M0 668 C 120 650, 260 642, 420 656 C 380 672, 160 680, 0 684 Z" />
              <path d="M1080 662 C 1200 640, 1340 636, 1500 648 C 1440 664, 1220 676, 1080 680 Z" />
            </g>
          </Svg>
        </Layer>

        {/* scene 3: wildflower meadow with a winding path */}
        <Layer move={rise(48, 0.12, 0.6)}>
          <Svg>
            <PaintedHill seed={6} points={[[0, 742], [320, 718], [700, 738], [1040, 714], [1600, 734]]} base="#b2c085" strokes={["#9db274", "#c4cb8c", "#87a067", "#d1cf96", "#6f8f62"]} density={0.85} angle={-10} />
            <g filter="url(#wash)">
              <path d="M792 728 C 770 760, 840 780, 820 816 C 796 860, 700 890, 730 940 C 745 970, 790 990, 790 1000 L 930 1000 C 920 960, 840 930, 860 890 C 880 850, 930 812, 880 776 C 848 752, 820 744, 812 728 Z" fill="#f2e3c4" />
            </g>
            <Wildflowers seed={21} count={260} x={[0, 1600]} y={[750, 1000]} size={[1.4, 6]} colors={["#f2b8a0", "#e9afab", "#fbf3ea", "#fbf3ea", "#e3bf73", "#c9b8d8", "#d9776a"]} />
          </Svg>
        </Layer>

        {/* scene 4: the fuller garden, with glimpses of the landmarks from the Work page */}
        <Layer move={rise(62, 0.45, 0.85)}>
          <Svg>
            <PaintedHill seed={8} points={[[0, 852], [300, 826], [640, 860], [960, 836], [1300, 850], [1600, 824]]} base="#9fb676" strokes={["#8aa565", "#b3c180", "#6f8f5a", "#c9cf93"]} density={0.9} angle={-12} />
            <Wildflowers seed={34} count={180} x={[0, 1600]} y={[860, 1000]} size={[3, 9]} colors={["#f2b8a0", "#e9afab", "#fbf3ea", "#fbf3ea", "#e3bf73", "#d9776a"]} />
          </Svg>
          <div className="absolute bottom-[19%] left-[9%] w-[13vw] max-w-44 min-w-20"><Cottage className="w-full" /></div>
          <div className="absolute bottom-[14%] left-[25%] w-[13vw] max-w-44 min-w-20"><Greenhouse className="w-full" /></div>
          <div className="absolute bottom-[17%] right-[11%] w-[8vw] max-w-28 min-w-14"><Windmill className="w-full" /></div>
        </Layer>

        {/* foreground stems frame every scene */}
        <Layer move={rise(26, 0, 0.9)}>
          <Svg>
            <ForegroundStems seed={7} xs={[40, 110, 190, 300, 1290, 1380, 1460, 1540]} bottom={1000} height={210} colors={["#fbf3ea", "#f2b8a0", "#e9afab", "#fbf3ea", "#e3bf73"]} />
          </Svg>
        </Layer>

        {/* ---- the four statements ---- */}
        <Scene opacity={`calc(1 - ${ramp(0.1, 0.17)})`} lift={false} className="top-[15vh]">
          <p className="text-sm font-semibold tracking-[0.3em] text-ink/75 uppercase">{copy.welcome.eyebrow}</p>
          <h1 className="mt-3 font-serif text-[clamp(2.9rem,8vw,6.2rem)] leading-[0.98] font-medium tracking-tight text-ink">{copy.welcome.title}</h1>
          <p className="mt-4 text-sm font-medium tracking-wide text-ink-soft">{copy.welcome.descriptor}</p>
          <p className="mx-auto mt-3 max-w-xl font-serif text-[clamp(1.15rem,2.2vw,1.5rem)] text-ink/85 italic">{copy.welcome.subtitle}</p>
        </Scene>
        <div style={{ opacity: `calc(1 - ${ramp(0, 0.05)})` }} className="journey-text pointer-events-none absolute inset-x-0 bottom-[7vh] flex flex-col items-center gap-2 text-ink/80">
          <span className="font-hand text-2xl">{copy.welcome.hint}</span>
          <svg viewBox="0 0 24 36" className="h-8 w-5 motion-safe:animate-bounce" aria-hidden="true">
            <path d="M12 2 V32 M4 24 L12 32 L20 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <Scene opacity={fade(0.2, 0.27, 0.38, 0.45)}>
          <p className="mx-auto max-w-3xl font-serif text-[clamp(2rem,5vw,3.6rem)] leading-tight text-ink">{copy.seed}</p>
        </Scene>
        <Scene opacity={fade(0.47, 0.54, 0.64, 0.71)}>
          <p className="mx-auto max-w-3xl font-serif text-[clamp(2rem,5vw,3.6rem)] leading-tight text-ink italic">{copy.philosophy}</p>
        </Scene>
        <Scene opacity={fade(0.75, 0.83)} className="pointer-events-auto">
          <p className="mx-auto max-w-3xl font-serif text-[clamp(2rem,5vw,3.6rem)] leading-tight text-ink">{copy.invitation}</p>
          <Link
            href="/work"
            onFocus={toEnd}
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-forest px-8 py-3 font-medium text-paper [text-shadow:none] shadow-[0_12px_28px_-12px_rgb(64_88_60/0.85)] transition hover:bg-[#344a31]"
          >
            {copy.cta} <span aria-hidden="true">→</span>
          </Link>
        </Scene>
      </div>
    </section>
  );
}
