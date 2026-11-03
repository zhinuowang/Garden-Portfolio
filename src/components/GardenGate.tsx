import Link from "next/link";
import { scatterFlowers } from "./garden/scatter";

// First screen: a painted sunset sky over rolling hills, with a path winding
// up the near hill (echoing reference 1). Headline sits in clear sky.

const flowers = scatterFlowers({
  seed: 5, count: 220, x: [0, 1600], y: [700, 1000],
  colors: ["#f2b8a0", "#e9afab", "#fbf3ea", "#fbf3ea", "#e3bf73", "#c9b8d8", "#d9776a"],
  size: [1.5, 9],
});

function GateLandscape() {
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="gateSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1c6c6" />
          <stop offset="0.35" stopColor="#f3c2b8" />
          <stop offset="0.62" stopColor="#f8dccc" />
          <stop offset="1" stopColor="#f6e6d6" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#gateSky)" />
      <g className="drift">
        <g filter="url(#cloud)">
          <ellipse cx="300" cy="200" rx="320" ry="50" fill="#e99e9f" opacity="0.5" />
          <ellipse cx="560" cy="250" rx="240" ry="34" fill="#f2a983" opacity="0.5" />
          <ellipse cx="1220" cy="180" rx="340" ry="56" fill="#e99e9f" opacity="0.45" />
          <ellipse cx="1300" cy="270" rx="260" ry="30" fill="#f2a983" opacity="0.55" />
          <ellipse cx="820" cy="360" rx="420" ry="26" fill="#f6c3ad" opacity="0.5" />
        </g>
      </g>
      <g filter="url(#wash)">
        <path d="M0 560 C 260 520, 520 548, 780 530 S 1300 520, 1600 545 V 760 H 0 Z" fill="#cbb6c2" opacity="0.7" />
        <path d="M0 610 C 300 580, 600 610, 900 596 S 1400 590, 1600 600 V 800 H 0 Z" fill="#c0c7a9" opacity="0.85" />
        <path d="M0 660 C 220 640, 420 650, 640 668 S 1100 650, 1600 660 V 1000 H 0 Z" fill="#aebc84" />
        {/* the near hill with its winding ridge path */}
        <path d="M640 1000 C 760 860, 900 760, 1060 700 C 1200 660, 1400 672, 1600 700 V 1000 Z" fill="#9fb56e" />
        <path d="M640 1000 C 760 860, 860 790, 960 760 C 900 820, 840 900, 820 1000 Z" fill="#4e7262" opacity="0.55" />
        <path d="M1060 704 C 1010 740, 1120 760, 1080 800 C 1040 840, 1180 880, 1160 1000 L 1240 1000 C 1250 900, 1110 860, 1150 812 C 1190 770, 1080 740, 1100 704 Z" fill="#e7dfa8" opacity="0.9" />
      </g>
      <g>
        {flowers.map((f, i) => (
          <circle key={i} cx={f.x} cy={f.y} r={f.r} fill={f.color} opacity="0.92" />
        ))}
      </g>
      <g stroke="#5f7d55" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7">
        {[60, 220, 420, 600, 1300, 1460].map((x, i) => (
          <g key={x} className="sway" style={{ animationDelay: `${i * 0.6}s` }}>
            <path d={`M${x} 1000 C ${x - 6} 960, ${x - 16} 935, ${x - 28} 910`} />
            <path d={`M${x + 10} 1000 C ${x + 10} 955, ${x + 12} 930, ${x + 16} 900`} />
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function GardenGate() {
  return (
    <section aria-labelledby="gate-title" className="paper-grain relative flex min-h-[100svh] items-start overflow-hidden">
      <GateLandscape />
      <div className="relative z-10 mx-auto w-full max-w-4xl px-5 pt-[clamp(7rem,18vh,11rem)] text-center">
        <p className="text-sm font-semibold tracking-[0.3em] text-ink/75 uppercase">Zhinuo Wang</p>
        <h1 id="gate-title" className="mt-4 font-serif text-[clamp(2.9rem,8vw,6.2rem)] leading-[0.98] font-medium tracking-tight text-ink">
          A Garden of Ideas
        </h1>
        <p className="mx-auto mt-5 max-w-xl font-serif text-[clamp(1.15rem,2.2vw,1.5rem)] text-ink/85 italic">
          A collection of ideas, stories &amp; little moments.
        </p>
        <p className="mt-3 text-sm font-medium tracking-wide text-ink-soft">UX/UI &amp; Product Design Portfolio</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="#garden" className="inline-flex min-h-12 items-center rounded-full bg-forest px-7 py-3 font-medium text-paper shadow-[0_10px_24px_-12px_rgb(64_88_60/0.8)] transition hover:bg-[#344a31]">
            Explore My Garden
          </Link>
          <Link href="#selected-work" className="inline-flex min-h-12 items-center rounded-full border border-forest/40 bg-paper/70 px-7 py-3 font-medium text-forest transition hover:bg-paper">
            View Selected Work
          </Link>
        </div>
        <p className="mt-6 text-sm text-ink-soft/90">A little space where creativity grows.</p>
      </div>
    </section>
  );
}
