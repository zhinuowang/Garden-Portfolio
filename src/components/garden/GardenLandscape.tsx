// The continuous two-region garden landscape (Category A, code-drawn).
// One sky, one land; a winding path divides the warmer Creative Corner (left)
// from the open, sage Growing Grounds (right). viewBox is 1600 × 900.

import { brushStrokes, ridge, scatterFlowers, type Stroke } from "./scatter";

// Centre line of the path at a given y, used to keep flowers off it.
function pathCenter(y: number) {
  const t = (y - 400) / 500;
  return 800 + Math.sin(t * Math.PI * 1.6) * 60 + t * 120;
}
function pathHalfWidth(y: number) {
  return 10 + ((y - 400) / 500) * 95;
}
const offPath = (x: number, y: number) => Math.abs(x - pathCenter(y)) > pathHalfWidth(y) + 14;

const leftFlowers = scatterFlowers({
  seed: 11, count: 340, x: [0, 790], y: [470, 900],
  colors: ["#f2b8a0", "#e9afab", "#f8d6c4", "#fbf3ea", "#e3bf73", "#d98f86"],
  size: [1.2, 6], keep: offPath,
});
const rightFlowers = scatterFlowers({
  seed: 23, count: 300, x: [810, 1600], y: [470, 900],
  colors: ["#fbf3ea", "#fbf3ea", "#e3bf73", "#c9b8d8", "#e9afab", "#f6e3b0"],
  size: [1.2, 5.5], keep: offPath,
});

// Oil-paint strokes over each land mass so the meadows read as brushwork.
const rightRidge = ridge([[760, 540], [1000, 480], [1330, 384], [1600, 410]]);
const leftRidge = ridge([[0, 470], [380, 470], [920, 520]]);
const rightStrokes = brushStrokes({
  seed: 41, count: 520, x: [760, 1600], y: [384, 900], length: [14, 40], width: [3, 8], angle: -14,
  colors: ["#93ab78", "#b9c79c", "#7f9a6a", "#a3b98e", "#c6d0a4"],
  inside: (x, y) => y > rightRidge(x) + 6 && offPath(x, y),
});
const leftStrokes = brushStrokes({
  seed: 42, count: 560, x: [0, 900], y: [470, 900], length: [14, 40], width: [3, 8], angle: -6,
  colors: ["#a9b77a", "#c8c98e", "#93a86b", "#d4c690", "#e2b49c"],
  inside: (x, y) => y > leftRidge(x) + 6 && offPath(x, y),
});
const shadowStrokes = brushStrokes({
  seed: 43, count: 120, x: [0, 1600], y: [700, 900], length: [30, 70], width: [6, 12], angle: -18,
  colors: ["#4f6f57", "#5f7d5a"],
  inside: (x, y) => offPath(x, y) && (x < 640 || x > 980),
});

function StrokeLayer({ marks, opacity = 1 }: { marks: Stroke[]; opacity?: number }) {
  return (
    <g filter="url(#paint)" strokeLinecap="round" fill="none" opacity={opacity}>
      {marks.map((m, i) => (
        <path key={i} d={m.d} stroke={m.color} strokeWidth={m.w} opacity={m.o} />
      ))}
    </g>
  );
}

function buildPath() {
  const left: string[] = [];
  const right: string[] = [];
  for (let y = 400; y <= 900; y += 20) {
    const c = pathCenter(y);
    const w = pathHalfWidth(y);
    left.push(`${(c - w).toFixed(1)} ${y}`);
    right.unshift(`${(c + w).toFixed(1)} ${y}`);
  }
  return `M ${left.join(" L ")} L ${right.join(" L ")} Z`;
}
const PATH_D = buildPath();

export default function GardenLandscape({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efc2c0" />
          <stop offset="0.45" stopColor="#f5d2c6" />
          <stop offset="1" stopColor="#f9e5d6" />
        </linearGradient>
        <radialGradient id="sunHaze" cx="0.5" cy="0.45" r="0.5">
          <stop offset="0" stopColor="#fbe3c8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fbe3c8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="leftLand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bfc58e" />
          <stop offset="1" stopColor="#a7b77c" />
        </linearGradient>
        <linearGradient id="rightLand" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b2c398" />
          <stop offset="1" stopColor="#9db187" />
        </linearGradient>
      </defs>

      {/* sky */}
      <rect width="1600" height="900" fill="url(#sky)" />
      <ellipse cx="800" cy="390" rx="760" ry="260" fill="url(#sunHaze)" />
      <g className="drift">
        <g filter="url(#cloud)">
          <ellipse cx="260" cy="120" rx="230" ry="46" fill="#eaa5a6" opacity="0.55" />
          <ellipse cx="420" cy="170" rx="180" ry="30" fill="#f3b694" opacity="0.5" />
          <ellipse cx="1180" cy="110" rx="260" ry="50" fill="#eaa5a6" opacity="0.5" />
          <ellipse cx="1360" cy="190" rx="200" ry="28" fill="#f3b694" opacity="0.55" />
          <ellipse cx="800" cy="250" rx="300" ry="22" fill="#f6c6b0" opacity="0.5" />
        </g>
      </g>

      {/* distant hazy ranges */}
      <g filter="url(#wash)">
        <path d="M0 400 C 200 360, 380 380, 560 370 S 900 350, 1100 372 S 1450 352, 1600 380 V 520 H 0 Z" fill="#cdbac4" opacity="0.75" />
        <path d="M0 430 C 240 400, 420 425, 640 410 S 1000 400, 1240 420 S 1500 405, 1600 415 V 560 H 0 Z" fill="#c3c6b3" opacity="0.85" />
      </g>

      {/* right hill rising toward the windmill */}
      <g filter="url(#wash)">
        <path d="M760 540 C 1000 480, 1200 400, 1330 384 C 1420 374, 1520 392, 1600 410 V 900 H 760 Z" fill="url(#rightLand)" />
        <path d="M1000 500 C 1120 452, 1260 420, 1400 424" stroke="#6f8a5a" strokeWidth="18" fill="none" opacity="0.25" />
      </g>
      {/* left rolling hills, warmer */}
      <g filter="url(#wash)">
        <path d="M0 470 C 120 440, 260 452, 380 470 C 520 492, 700 490, 920 520 V 900 H 0 Z" fill="url(#leftLand)" />
        <ellipse cx="300" cy="640" rx="360" ry="120" fill="#f2b8a0" opacity="0.16" />
      </g>
      {/* hedgerows */}
      <g filter="url(#wash)" fill="#5d7a5a" opacity="0.55">
        <path d="M0 480 C 90 470, 180 466, 300 476 C 280 490, 120 496, 0 498 Z" />
        <path d="M1040 470 C 1130 440, 1230 424, 1320 420 C 1290 438, 1150 462, 1040 482 Z" />
      </g>

      {/* foreground meadow, split softly by colour around the path */}
      <g filter="url(#wash)">
        <path d="M0 600 C 240 570, 520 580, 840 600 V 900 H 0 Z" fill="#b7bf86" />
        <path d="M780 602 C 1060 584, 1340 570, 1600 586 V 900 H 800 Z" fill="#a8bb8c" />
        <ellipse cx="200" cy="820" rx="300" ry="90" fill="#e9afab" opacity="0.14" />
        <path d="M0 760 C 200 730, 420 760, 640 820" stroke="#4f6f57" strokeWidth="40" fill="none" opacity="0.18" />
        <path d="M1600 740 C 1380 720, 1180 760, 980 830" stroke="#4f6f57" strokeWidth="36" fill="none" opacity="0.16" />
      </g>

      <StrokeLayer marks={rightStrokes} />
      <StrokeLayer marks={leftStrokes} />
      <StrokeLayer marks={shadowStrokes} opacity={0.35} />

      {/* the winding path */}
      <g filter="url(#wash)">
        <path d={PATH_D} fill="#f3e6cc" />
        <path d={PATH_D} fill="none" stroke="#dcc9a4" strokeWidth="4" opacity="0.7" />
      </g>

      {/* wildflowers: warm on the left, white/honey/lavender on the right */}
      <g>
        {leftFlowers.map((f, i) => (
          <circle key={`l${i}`} cx={f.x} cy={f.y} r={f.r} fill={f.color} opacity="0.92" />
        ))}
        {rightFlowers.map((f, i) => (
          <circle key={`r${i}`} cx={f.x} cy={f.y} r={f.r} fill={f.color} opacity="0.92" />
        ))}
      </g>

      {/* foreground grass, gently swaying */}
      <g stroke="#5f7d55" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7">
        {[40, 150, 330, 520, 640, 1020, 1180, 1330, 1480, 1570].map((x, i) => (
          <g key={x} className="sway" style={{ animationDelay: `${(i % 4) * 0.7}s` }}>
            <path d={`M${x} 900 C ${x - 6} 870, ${x - 14} 850, ${x - 24} 830`} />
            <path d={`M${x + 8} 900 C ${x + 8} 866, ${x + 10} 846, ${x + 14} 820`} />
            <path d={`M${x + 16} 900 C ${x + 22} 876, ${x + 30} 862, ${x + 42} 850`} />
          </g>
        ))}
      </g>
    </svg>
  );
}
