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
