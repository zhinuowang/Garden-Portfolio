// Painterly building blocks shared by every scene (Category A, decorative).
// A hill is a watercolor wash under a ridge line, overlaid with short oil-paint
// strokes that follow the slope; flowers are loose dabs rather than circles.

import { brushStrokes, ridge, ridgePath, scatterFlowers } from "./scatter";

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
