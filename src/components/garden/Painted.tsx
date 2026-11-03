// Painterly building blocks shared by every scene (Category A, decorative).
// A hill is a watercolor wash under a ridge line, overlaid with short oil-paint
// strokes that follow the slope; flowers are loose dabs rather than circles.

import { brushStrokes, ridge, ridgePath, scatterFlowers, seeded } from "./scatter";

type Pt = [number, number];

export function PaintedHill({
  points,
  bottom = 1000,
  base,
  strokes,
  seed,
  density = 1,
  angle = -8,
  wash = true,
}: {
  points: Pt[];
  bottom?: number;
  base: string;
  strokes: string[];
  seed: number;
  density?: number;
  angle?: number;
  wash?: boolean;
}) {
  const f = ridge(points);
  const x0 = points[0][0];
  const x1 = points[points.length - 1][0];
  const top = Math.min(...points.map((p) => p[1]));
  const area = (x1 - x0) * (bottom - top);
  const marks = brushStrokes({
    seed,
    count: Math.round((area / 1400) * density),
    x: [x0, x1],
    y: [top, bottom],
    colors: strokes,
    length: [16, 46],
    width: [3, 9],
    angle,
    spread: 26,
    inside: (x, y) => y > f(x) + 6,
  });
  return (
    <g>
      <path d={ridgePath(points, bottom)} fill={base} filter={wash ? "url(#wash)" : undefined} />
      <g filter="url(#paint)" strokeLinecap="round" fill="none">
        {marks.map((m, i) => (
          <path key={i} d={m.d} stroke={m.color} strokeWidth={m.w} opacity={m.o} />
        ))}
      </g>
    </g>
  );
}

export function Wildflowers({
  seed,
  count,
  x,
  y,
  colors,
  size,
  keep,
}: {
  seed: number;
  count: number;
  x: [number, number];
  y: [number, number];
  colors: string[];
  size: [number, number];
  keep?: (x: number, y: number) => boolean;
}) {
  const flowers = scatterFlowers({ seed, count, x, y, colors, size, keep });
  return (
    <g filter="url(#paint)">
      {flowers.map((f, i) =>
        f.r > 4.5 ? (
          // Near flowers get petals and a honey centre, like the daisies in the references.
          <g key={i} transform={`translate(${f.x.toFixed(1)} ${f.y.toFixed(1)})`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="0" cy={-f.r * 0.8} rx={f.r * 0.5} ry={f.r * 0.85} fill={f.color} transform={`rotate(${a + i * 7})`} />
            ))}
            <circle r={f.r * 0.42} fill="#e3a94f" />
          </g>
        ) : (
          <ellipse key={i} cx={f.x} cy={f.y} rx={f.r * 1.2} ry={f.r * 0.85} fill={f.color} opacity="0.9" transform={`rotate(${(i * 37) % 180} ${f.x} ${f.y})`} />
        ),
      )}
    </g>
  );
}

/** Tall foreground stems with blossoms, swaying gently. */
export function ForegroundStems({ seed, xs, bottom, height, colors }: { seed: number; xs: number[]; bottom: number; height: number; colors: string[] }) {
  return (
    <g>
      {xs.map((x, i) => {
        const h = height * (0.65 + ((seed * (i + 3)) % 7) / 14);
        const lean = ((i % 3) - 1) * 22;
        const c = colors[i % colors.length];
        return (
          <g key={x} className="sway" style={{ animationDelay: `${(i % 5) * 0.5}s`, animationDuration: `${6 + (i % 3)}s` }}>
            <path d={`M${x} ${bottom} C ${x + lean * 0.2} ${bottom - h * 0.5}, ${x + lean * 0.6} ${bottom - h * 0.8}, ${x + lean} ${bottom - h}`} stroke="#5f7d55" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d={`M${x + lean * 0.3} ${bottom - h * 0.45} q -18 -10 -26 -2`} stroke="#6f8a5a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <g transform={`translate(${x + lean} ${bottom - h})`} filter="url(#paint)">
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse key={a} cx="0" cy="-8" rx="5" ry="9" fill={c} transform={`rotate(${a})`} />
              ))}
              <circle r="4.5" fill="#e3a94f" />
            </g>
          </g>
        );
      })}
    </g>
  );
}

/** Painterly cloud bank: blurred ragged washes. */
export function Clouds({ items }: { items: { cx: number; cy: number; rx: number; ry: number; color: string; o: number }[] }) {
  return (
    <g filter="url(#cloud)">
      {items.map((c, i) => (
        <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={c.color} opacity={c.o} />
      ))}
    </g>
  );
}

/** Loose tapering grass blades rising from `bottom`, painted as filled strokes. */
export function GrassBlades({
  seed,
  count,
  x,
  bottom,
  height,
  colors,
  keep,
}: {
  seed: number;
  count: number;
  x: [number, number];
  bottom: number;
  height: [number, number];
  colors: string[];
  keep?: (x: number) => boolean;
}) {
  const rand = seeded(seed);
  const blades: { d: string; c: string; o: number }[] = [];
  let guard = 0;
  while (blades.length < count && guard++ < count * 6) {
    const bx = x[0] + rand() * (x[1] - x[0]);
    if (keep && !keep(bx)) continue;
    const h = height[0] + rand() * (height[1] - height[0]);
    const lean = (rand() - 0.5) * h * 0.7;
    const w = 3 + rand() * 6;
    const tipX = bx + lean;
    const tipY = bottom - h;
    blades.push({
      d: `M${(bx - w).toFixed(1)} ${bottom} Q${(bx + lean * 0.3 - w * 0.4).toFixed(1)} ${(bottom - h * 0.55).toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)} Q${(bx + lean * 0.35 + w * 0.4).toFixed(1)} ${(bottom - h * 0.5).toFixed(1)} ${(bx + w).toFixed(1)} ${bottom} Z`,
      c: colors[Math.floor(rand() * colors.length)],
      o: 0.55 + rand() * 0.4,
    });
  }
  return (
    <g filter="url(#paint)">
      {blades.map((b, i) => (
        <path key={i} d={b.d} fill={b.c} opacity={b.o} />
      ))}
    </g>
  );
}

/** A curved stem with paired, softly painted leaves. */
export function LeafSpray({ x, y, length, angle, color, scale = 1 }: { x: number; y: number; length: number; angle: number; color: string; scale?: number }) {
  const leaves = [0.25, 0.45, 0.62, 0.78, 0.92];
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`} filter="url(#paint)">
      <path d={`M0 0 Q ${length * 0.12} ${-length * 0.5} 0 ${-length}`} stroke="#5f7d55" strokeWidth="3" fill="none" strokeLinecap="round" />
      {leaves.map((t, i) => {
        const side = i % 2 === 0 ? 1 : -1;
        const s = 1.15 - t * 0.6;
        return (
          <path
            key={t}
            d={`M0 ${-length * t} q ${side * 26 * s} ${-14 * s} ${side * 46 * s} ${-4 * s} q ${-side * 20 * s} ${16 * s} ${-side * 46 * s} ${4 * s} Z`}
            fill={color}
            opacity={0.85}
          />
        );
      })}
    </g>
  );
}
