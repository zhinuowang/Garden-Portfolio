// Deterministic pseudo-random scatter so server and client render the same flowers.

export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Speck = { x: number; y: number; r: number; color: string };

export function scatterFlowers(opts: {
  seed: number;
  count: number;
  x: [number, number];
  y: [number, number];
  colors: string[];
  /** Radius at the far (top) and near (bottom) edge, for perspective. */
  size: [number, number];
  /** Optional mask: return false to skip a point. */
  keep?: (x: number, y: number) => boolean;
}): Speck[] {
  const rand = seeded(opts.seed);
  const out: Speck[] = [];
  let guard = 0;
  while (out.length < opts.count && guard++ < opts.count * 6) {
    // Bias toward the foreground so flowers thicken as they come closer.
    const t = Math.pow(rand(), 0.7);
    const y = opts.y[0] + t * (opts.y[1] - opts.y[0]);
    const x = opts.x[0] + rand() * (opts.x[1] - opts.x[0]);
    if (opts.keep && !opts.keep(x, y)) continue;
    const r = opts.size[0] + t * (opts.size[1] - opts.size[0]) * (0.6 + rand() * 0.6);
    out.push({ x, y, r, color: opts.colors[Math.floor(rand() * opts.colors.length)] });
  }
  return out;
}

export type Stroke = { d: string; color: string; w: number; o: number };

/**
 * Short curved brush strokes, like visible oil-paint dabs. `inside` decides
 * whether a point belongs to the area being painted (e.g. under a hill line).
 */
export function brushStrokes(opts: {
  seed: number;
  count: number;
  x: [number, number];
  y: [number, number];
  colors: string[];
  length: [number, number];
  width: [number, number];
  /** Base angle in degrees (0 = horizontal) and random spread. */
  angle?: number;
  spread?: number;
  inside?: (x: number, y: number) => boolean;
}): Stroke[] {
  const rand = seeded(opts.seed);
  const out: Stroke[] = [];
  let guard = 0;
  while (out.length < opts.count && guard++ < opts.count * 8) {
    const x = opts.x[0] + rand() * (opts.x[1] - opts.x[0]);
    const y = opts.y[0] + rand() * (opts.y[1] - opts.y[0]);
    if (opts.inside && !opts.inside(x, y)) continue;
    // Strokes grow toward the foreground.
    const depth = (y - opts.y[0]) / Math.max(1, opts.y[1] - opts.y[0]);
    const len = (opts.length[0] + rand() * (opts.length[1] - opts.length[0])) * (0.6 + depth * 0.8);
    const a = (((opts.angle ?? 0) + (rand() - 0.5) * (opts.spread ?? 30)) * Math.PI) / 180;
    const dx = Math.cos(a) * len;
    const dy = Math.sin(a) * len;
    const bend = (rand() - 0.5) * len * 0.5;
    const d = `M${(x - dx / 2).toFixed(1)} ${(y - dy / 2).toFixed(1)} q${(dx / 2 - dy * 0.1).toFixed(1)} ${(dy / 2 + bend).toFixed(1)} ${dx.toFixed(1)} ${dy.toFixed(1)}`;
    out.push({
      d,
      color: opts.colors[Math.floor(rand() * opts.colors.length)],
      w: (opts.width[0] + rand() * (opts.width[1] - opts.width[0])) * (0.7 + depth * 0.6),
      o: 0.35 + rand() * 0.45,
    });
  }
  return out;
}

/** Height of a smooth ridge line at x, from control points [[x, y], …]. */
export function ridge(points: [number, number][]) {
  return (x: number) => {
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[i + 1];
      if (x >= x0 && x <= x1) {
        const t = (x - x0) / (x1 - x0);
        const s = t * t * (3 - 2 * t);
        return y0 + (y1 - y0) * s;
      }
    }
    return points[points.length - 1][1];
  };
}

/** SVG path for the area under a ridge, down to `bottom`. */
export function ridgePath(points: [number, number][], bottom: number, step = 20) {
  const f = ridge(points);
  const x0 = points[0][0];
  const x1 = points[points.length - 1][0];
  let d = `M${x0} ${bottom} L${x0} ${f(x0).toFixed(1)}`;
  for (let x = x0 + step; x <= x1; x += step) d += ` L${x} ${f(x).toFixed(1)}`;
  return `${d} L${x1} ${bottom} Z`;
}
