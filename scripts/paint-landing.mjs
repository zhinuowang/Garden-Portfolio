// Paints the Landing garden: ONE tall painting in three scenes, rendered as
// watercolor washes and opaque oil-style bristle and palette-knife strokes,
// then sliced into three scene images so the joins are seamless.
//
// Impasto: every mark also builds up a hidden height map (thick in the focal
// foreground, thin in the sky and distant hills, raised at stroke edges and
// along bristle ridges). At the end that relief is lit from the upper left,
// so the paint catches light and casts small shadows, like oil on canvas.
//
// Decorative artwork only (Category A), never project work. These renders are
// interim placeholders until hand-painted artwork exists (docs/LANDING-ART-SPEC.md).
//
//   node scripts/paint-landing.mjs                   → public/assets/garden/landing/*.webp
//                                                       + src/data/landing-anchors.json
//   node scripts/paint-landing.mjs --preview         → small preview JPGs in $PREVIEW_DIR
//   node scripts/paint-landing.mjs --only=desktop    → one composition only

import { createCanvas, Path2D } from "@napi-rs/canvas";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("public/assets/garden/landing");
const ANCHORS = path.resolve("src/data/landing-anchors.json");
const PREVIEW = process.argv.includes("--preview");
const PREVIEW_DIR = process.env.PREVIEW_DIR || OUT;
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice(7);

// ---------------------------------------------------------------- utilities

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (x, y, s) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
};
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}
function fbm(x, y, s, oct = 4) {
  let t = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) {
    t += amp * vnoise(x * f, y * f, s + i * 13);
    amp *= 0.5;
    f *= 2.03;
  }
  return t;
}
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const grey = (v, a = 1) => `rgba(${v | 0},${v | 0},${v | 0},${a})`;
/** Multi-stop gradient lookup: stops = [[t, "#hex"], ...] */
function ramp(stops, t) {
  t = clamp(t);
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (t <= t1) return mix(hex(c0), hex(c1), (t - t0) / Math.max(1e-6, t1 - t0));
  }
  return hex(stops[stops.length - 1][1]);
}

const WARM = hex("#fff0d2");
const SHADOW = hex("#3d5238");

// ---------------------------------------------------------------- paint body (impasto)

// The height map being built and how thick the current paint is (0 thin wash … 1 heavy impasto).
const PAINT = { hx: null, th: 0.4 };
const withThickness = (th, fn) => {
  const prev = PAINT.th;
  PAINT.th = th;
  fn();
  PAINT.th = prev;
};

/** Canvas weave in the height map: shows only where the paint is thin. */
function primeCanvas(hx, W, H) {
  const tile = createCanvas(96, 96);
  const tc = tile.getContext("2d");
  const id = tc.createImageData(96, 96);
  const r = rng(77);
  for (let y = 0; y < 96; y++)
    for (let x = 0; x < 96; x++) {
      const v = 34 + Math.sin((x * Math.PI) / 2) * Math.sin((y * Math.PI) / 2) * 9 + (r() - 0.5) * 8;
      const i = (y * 96 + x) * 4;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
      id.data[i + 3] = 255;
    }
  tc.putImageData(id, 0, 0);
  hx.fillStyle = hx.createPattern(tile, "repeat");
  hx.fillRect(0, 0, W, H);
}

/**
 * Light the paint relief: the height map's slopes facing the upper-left light
 * brighten (and catch a little warm highlight), slopes facing away darken.
 */
function lightRelief(cv, hcv, W, H, strength = 1) {
  const ctx = cv.getContext("2d");
  // soften the relief a touch so ridges read as paint, not as pixels
  const soft = createCanvas(W, H);
  const sc = soft.getContext("2d");
  sc.filter = "blur(0.9px)";
  sc.drawImage(hcv, 0, 0);
  const h = sc.getImageData(0, 0, W, H).data;
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const k = 0.0042 * strength;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = (y * W + x) * 4;
      const gx = h[i + 4] - h[i - 4];
      const gy = h[i + W * 4] - h[i - W * 4];
      let s = (gx + gy) * k; // light from the upper left
      s = s / (1 + Math.abs(s) * 1.4); // soft roll-off: no hard emboss
      if (s >= 0) {
        const spec = Math.max(0, s - 0.18) * 0.9;
        d[i] = Math.min(255, d[i] * (1 + s * 0.55) + spec * 255);
        d[i + 1] = Math.min(255, d[i + 1] * (1 + s * 0.5) + spec * 240);
        d[i + 2] = Math.min(255, d[i + 2] * (1 + s * 0.42) + spec * 210);
      } else {
        d[i] = d[i] * (1 + s * 0.62);
        d[i + 1] = d[i + 1] * (1 + s * 0.6);
        d[i + 2] = d[i + 2] * (1 + s * 0.52);
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

// ---------------------------------------------------------------- brushes

/**
 * One oil-paint stroke: a body of colour carrying streaks from individual
 * bristles, with ragged ends and slightly raised edges. `texture` 0 gives a
 * plain dab (petals, small details).
 */
function stroke(ctx, r, x, y, ang, len, w, col, alpha, texture = 3) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const nx = -dy, ny = dx;
  const bend = (r() - 0.5) * len * 0.35;
  const pt = (t, off) => {
    const b = Math.sin(Math.PI * t) * bend;
    return [x + dx * len * t + nx * (b + off), y + dy * len * t + ny * (b + off)];
  };
  const steps = 7;
  const left = [], right = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const hw = (w / 2) * (0.45 + 0.55 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05)), 0.6));
    left.push(pt(t, -hw));
    right.push(pt(t, hw));
  }
  const body = new Path2D();
  body.moveTo(left[0][0], left[0][1]);
  for (const p of left) body.lineTo(p[0], p[1]);
  for (let i = right.length - 1; i >= 0; i--) body.lineTo(right[i][0], right[i][1]);
  body.closePath();
  ctx.fillStyle = rgba(col, texture ? alpha * 0.6 : alpha);
  ctx.fill(body);

  const hx = PAINT.hx, th = PAINT.th;
  const ha = Math.min(1, alpha * 1.15);
  const hBase = 50 + th * 120 * (0.75 + r() * 0.25);
  if (hx) {
    hx.fillStyle = grey(hBase, ha);
    hx.fill(body);
    if (th > 0.25) {
      // paint pushed up at the stroke's edges
      hx.strokeStyle = grey(hBase + th * 45, ha * 0.8);
      hx.lineWidth = Math.max(1, w * 0.09);
      hx.stroke(body);
    }
  }
  if (!texture) return;
  // bristles: each hair drags its own slightly different pigment and leaves a ridge
  ctx.lineCap = "round";
  if (hx) hx.lineCap = "round";
  const n = Math.min(14, Math.max(3, Math.round(w / 2.2)));
  for (let k = 0; k < n; k++) {
    const off = (-0.5 + (k + 0.2 + r() * 0.6) / n) * w * 0.92;
    const t0 = r() * 0.18, t1 = 0.62 + r() * 0.38;
    const shade = r() < 0.55 ? mix(col, WARM, r() * 0.16) : mix(col, SHADOW, r() * 0.14);
    const a = pt(t0, off), m = pt((t0 + t1) / 2, off), b = pt(t1, off);
    const lw = Math.max(0.7, (w / n) * (0.9 + r() * 0.7));
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.quadraticCurveTo(m[0], m[1], b[0], b[1]);
    ctx.strokeStyle = rgba(shade, alpha * (0.45 + r() * 0.5));
    ctx.lineWidth = lw;
    ctx.stroke();
    if (hx && th > 0.15) {
      hx.beginPath();
      hx.moveTo(a[0], a[1]);
      hx.quadraticCurveTo(m[0], m[1], b[0], b[1]);
      hx.strokeStyle = grey(hBase + (r() < 0.5 ? 1 : -1) * th * 38, ha * 0.8);
      hx.lineWidth = lw * 0.7;
      hx.stroke();
    }
  }
}

/** Palette-knife deposit: a flat, sharp-edged slab of paint with a ridge where the knife lifted. */
function knife(ctx, r, x, y, ang, len, w, col, alpha = 0.95) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const nx = -dy, ny = dx;
  const sk = (r() - 0.5) * w * 0.6;
  const pts = [
    [x - nx * w / 2, y - ny * w / 2],
    [x + dx * len - nx * w / 2 + dx * sk, y + dy * len - ny * w / 2 + dy * sk],
    [x + dx * len * 0.92 + nx * w / 2, y + dy * len * 0.92 + ny * w / 2],
    [x + nx * w / 2 + dx * w * 0.2, y + ny * w / 2 + dy * w * 0.2],
  ];
  const p = new Path2D();
  p.moveTo(pts[0][0], pts[0][1]);
  for (const q of pts.slice(1)) p.lineTo(q[0], q[1]);
  p.closePath();
  ctx.fillStyle = rgba(col, alpha);
  ctx.fill(p);
  // a few scraped streaks along the knife
  ctx.lineWidth = Math.max(0.6, w * 0.05);
  for (let i = 0; i < 4; i++) {
    const o = (r() - 0.5) * w * 0.8;
    ctx.beginPath();
    ctx.moveTo(x + nx * o, y + ny * o);
    ctx.lineTo(x + dx * len * (0.6 + r() * 0.35) + nx * o, y + dy * len * (0.6 + r() * 0.35) + ny * o);
    ctx.strokeStyle = rgba(mix(col, r() < 0.5 ? WARM : SHADOW, 0.15), 0.5);
    ctx.stroke();
  }
  const hx = PAINT.hx, th = PAINT.th;
  if (hx) {
    const g = 60 + th * 135;
    hx.fillStyle = grey(g, alpha);
    hx.fill(p);
    hx.beginPath();
    hx.moveTo(pts[1][0], pts[1][1]);
    hx.lineTo(pts[2][0], pts[2][1]);
    hx.strokeStyle = grey(g + th * 80, 0.9);
    hx.lineWidth = Math.max(1.2, w * 0.12);
    hx.stroke();
  }
}

/** Soft round dab (blossoms, pigment spots): domed in the height map. */
function dab(ctx, x, y, rx, ry, rot, col, alpha, raised = true) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.3, rx), Math.max(0.3, ry), rot, 0, Math.PI * 2);
  ctx.fillStyle = rgba(col, alpha);
  ctx.fill();
  const hx = PAINT.hx, th = PAINT.th;
  if (hx && raised && alpha > 0.4) {
    const g = 55 + th * 120;
    hx.beginPath();
    hx.ellipse(x, y, Math.max(0.3, rx), Math.max(0.3, ry), rot, 0, Math.PI * 2);
    hx.fillStyle = grey(g, alpha);
    hx.fill();
    hx.beginPath();
    hx.ellipse(x - rx * 0.12, y - ry * 0.12, Math.max(0.3, rx * 0.55), Math.max(0.3, ry * 0.55), rot, 0, Math.PI * 2);
    hx.fillStyle = grey(g + th * 50, alpha);
    hx.fill();
  }
}
/** Clip both the colour and the relief to a shape (so hidden strokes leave no relief behind). */
function clipBoth(ctx, p) {
  ctx.save();
  ctx.clip(p);
  if (PAINT.hx) { PAINT.hx.save(); PAINT.hx.clip(p); }
}
function unclipBoth(ctx) {
  ctx.restore();
  if (PAINT.hx) PAINT.hx.restore();
}
/** A wash that is not part of the paint body (glows, cast shadows). */
const glaze = (ctx, x, y, rx, ry, col, alpha) => dab(ctx, x, y, rx, ry, 0, col, alpha, false);

// ---------------------------------------------------------------- the painting

function paint(F) {
  const { W, S, k } = F; // width, scene height, brush scale
  const H = S * 3;
  const cv = createCanvas(W, H);
  const ctx = cv.getContext("2d");
  const hcv = createCanvas(W, H);
  const hx = hcv.getContext("2d");
  primeCanvas(hx, W, H);
  PAINT.hx = hx;
  const X = (f) => f * W;
  const Y = (f) => f * S;
  const L = F.layout;

  // ---- shapes known before painting (text placement depends on them)
  const ridgeFn = (pts, amp, freq, seed) => (x) => {
    const xf = x / W;
    let i = 0;
    while (i < pts.length - 2 && xf > pts[i + 1][0]) i++;
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const t = clamp((xf - x0) / (x1 - x0));
    const s = t * t * (3 - 2 * t);
    return Y(lerp(y0, y1, s)) + amp * S * fbm(x * freq / W * 6, 0.5, seed, 3);
  };
  const slope = (f, x) => (f(x + 4) - f(x - 4)) / 8;
  const moundTop = (cxf, topf, rxf, hf, seed) => (x) => {
    const cx = X(cxf), rx = X(rxf), d = (x - cx) / rx;
    const base = Y(topf + hf);
    const n = 0.012 * S * fbm(x / W * 7, 1.7, seed, 3);
    if (Math.abs(d) <= 1) return base - Y(hf) * Math.pow(1 - d * d, 0.55) + n;
    return base + (Math.abs(d) - 1) * rx * 0.55 + n;
  };
  const moundTops = L.mounds.map(([cxf, topf, rxf, hf], i) => moundTop(cxf, topf, rxf, hf, 31 + i));
  const tops = {};
  L.mounds.forEach((m, i) => { if (m[6]) tops[m[6]] = moundTops[i]; });

  // scene 2 notes: laid along chosen hill slopes, just below the crest
  const anchors = { phrases: [], sign: null };
  // Each note is written along a gentle curve that follows its hill: the chord's
  // tilt is limited, and the contour's bend is softened, so the words drift with
  // the grass without warping. Paths are in scene-2 pixels of this composition.
  for (const ph of L.phrases) {
    const top = moundTops[ph.mound];
    const xs0 = X(ph.x - ph.span / 2), xs1 = X(ph.x + ph.span / 2), xc = X(ph.x);
    const cy = (x) => top(x) + Y(ph.dy);
    const chord = (x) => cy(xs0) + ((cy(xs1) - cy(xs0)) * (x - xs0)) / (xs1 - xs0);
    const maxM = Math.tan((ph.maxTilt * Math.PI) / 180);
    const m = clamp((cy(xs1) - cy(xs0)) / (xs1 - xs0), -maxM, maxM);
    const ymid = (cy(xs0) + cy(xs1)) / 2;
    const lines = [];
    for (let l = 0; l < ph.lines; l++) {
      const pts = [];
      for (let i = 0; i <= 28; i++) {
        const x = lerp(xs0, xs1, i / 28);
        const dev = clamp(cy(x) - chord(x), -Y(0.022), Y(0.022)) * ph.bend;
        pts.push(`${x.toFixed(1)} ${(ymid + m * (x - xc) + dev + l * Y(ph.gap) - S).toFixed(1)}`);
      }
      lines.push(`M${pts.join(" L")}`);
    }
    anchors.phrases.push({ x: ph.x, y: +(ymid / S - 1 + (ph.gap * (ph.lines - 1)) / 2).toFixed(4), lines });
  }
  anchors.viewBox = [W, S];

  // calm zones: thinner, lighter paint where words sit
  const zones = [
    ...L.zones.map((z) => ({ cx: X(z.x), cy: Y(z.y), rx: X(z.rx), ry: Y(z.ry), light: z.light && hex(z.light), amt: z.amt })),
    ...anchors.phrases.map((a) => ({ cx: X(a.x), cy: Y(a.y + 1), rx: X(L.phraseZone[0]), ry: Y(L.phraseZone[1]), light: hex("#cfd9a6"), amt: 0.5 })),
  ];
  const calm = (x, y) => {
    let c = 0, light = null;
    for (const z of zones) {
      const d = ((x - z.cx) / z.rx) ** 2 + ((y - z.cy) / z.ry) ** 2;
      if (d < 1 && (1 - d) * z.amt > c) { c = (1 - d) * z.amt; light = z.light; }
    }
    return [c, light];
  };

  /** Wash + strokes for one land or sky form. */
  function form(o) {
    const r = rng(o.seed);
    const p = o.path;
    const [bx0, by0, bx1, by1] = o.bbox;
    // 1 · watercolor wash with a darker pooled edge
    ctx.save();
    ctx.filter = `blur(${(o.soft ?? 2.5) * k}px)`;
    const g = ctx.createLinearGradient(0, by0, 0, by1);
    for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, rgba(o.color((bx0 + bx1) / 2, lerp(by0, by1, i / 8), 0)));
    ctx.fillStyle = g;
    ctx.fill(p);
    if (o.edge !== false) {
      ctx.filter = `blur(${4 * k}px)`;
      ctx.strokeStyle = rgba(mix(o.color((bx0 + bx1) / 2, by0 + 10, 0), SHADOW, 0.25), 0.22);
      ctx.lineWidth = 5 * k;
      ctx.stroke(p);
    }
    ctx.restore();
    // 2 · faint watercolor blooms
    ctx.save();
    ctx.clip(p);
    ctx.filter = `blur(${28 * k}px)`;
    const blooms = Math.round(((bx1 - bx0) * (by1 - by0)) / (260 * 260 * k * k));
    for (let i = 0; i < blooms; i++) {
      const x = lerp(bx0, bx1, r()), y = lerp(by0, by1, r());
      glaze(ctx, x, y, (60 + r() * 140) * k, (30 + r() * 70) * k, mix(o.color(x, y, 1), r() < 0.5 ? WARM : SHADOW, 0.25), 0.18);
    }
    ctx.restore();
    // 3 · oil strokes following the form's direction field
    const [l0, l1] = o.len;
    const [w0, w1] = o.width;
    const tries = Math.round(((bx1 - bx0) * (by1 - by0) * (o.cover ?? 1.1)) / (((l0 + l1) / 2) * ((w0 + w1) / 2) * k * k));
    for (let i = 0; i < tries; i++) {
      const x = lerp(bx0, bx1, r()), y = lerp(by0, by1, r());
      if (!ctx.isPointInPath(p, x, y)) continue;
      const sz = o.size ? o.size(x, y) : 1;
      let col = o.color(x, y, 1);
      const v = o.vary ?? 0.14;
      col = mix(col, r() < 0.6 ? WARM : SHADOW, r() * v * 0.6);
      if (o.accents && r() < 0.06) col = mix(col, hex(o.accents[Math.floor(r() * o.accents.length)]), 0.35);
      let alpha = lerp(o.alpha[0], o.alpha[1], r());
      const [c, zl] = calm(x, y);
      let th = o.thick ? o.thick(x, y) : 0.4;
      if (c > 0) {
        if (zl) col = mix(col, zl, c * 0.5);
        alpha *= 1 - c * 0.35;
        th *= 1 - c * 0.75;
      }
      let ang = o.angle(x, y) + (r() - 0.5) * (o.spread ?? 0.35);
      let lk = 0.55 + r() * r() * 1.3;
      if (o.grass && r() < o.grass(x, y)) { ang = -Math.PI / 2 + (r() - 0.5) * 1.6; lk *= 0.5; col = mix(col, WARM, 0.12); }
      PAINT.th = th;
      if (o.knife && c < 0.2 && r() < o.knife(x, y)) {
        knife(ctx, r, x, y, ang, lerp(l0, l1, r()) * k * sz * 0.8, lerp(w0, w1, r()) * k * sz * 1.3, mix(col, WARM, 0.08));
      } else {
        stroke(ctx, r, x, y, ang, lerp(l0, l1, r()) * k * sz * lk, lerp(w0, w1, r()) * k * sz * (0.7 + r() * 0.5), col, alpha, o.bristles ?? 3);
      }
    }
    PAINT.th = 0.4;
  }

  const landPath = (top, bottomY, x0 = -40, x1 = W + 40) => {
    const p = new Path2D();
    p.moveTo(x0, bottomY);
    for (let x = x0; x <= x1; x += 6) p.lineTo(x, top(x));
    p.lineTo(x1, bottomY);
    p.closePath();
    return p;
  };
  const hillColor = (top, stops, depth, opts = {}) => (x, y, detail) => {
    const t = clamp((y - top(x)) / (depth * S));
    let c = ramp(stops, Math.pow(t, 0.75));
    const sl = slope(top, x);
    c = mix(c, WARM, clamp(-sl * 0.9) * 0.22);
    c = mix(c, SHADOW, clamp(sl * 0.9) * 0.18);
    if (t < 0.05) c = mix(c, hex("#f1e2b3"), (1 - t / 0.05) * 0.35);
    if (detail) c = mix(c, hex(opts.alt ?? "#8ea56a"), clamp(fbm(x / 240, y / 240, 5) * 0.8 + 0.25) * 0.3);
    if (opts.haze) c = mix(c, hex(opts.hazeCol ?? "#f3d9cc"), opts.haze);
    c = mix(c, hex("#e9c3a6"), clamp(1 - y / S) * 0.22);
    return c;
  };
  const hillAngle = (top, flat = 0.6) => (x, y) => {
    const t = clamp((y - top(x)) / (0.2 * S));
    return Math.atan(slope(top, x)) * (1 - t * flat) + fbm(x / 400, y / 400, 9) * 0.25;
  };

  // ---- painted objects -------------------------------------------------

  /** Foliage canopy built from many short strokes, lit from the upper left. */
  function canopy(x, y, s, seed, pal, blobs, n = 110, extra) {
    const r = rng(seed);
    // the canopy's mass first: soft, darker underneath, so the leaves sit on a volume
    ctx.save();
    ctx.filter = `blur(${s * 0.06}px)`;
    for (const [bx, by, br] of blobs) {
      glaze(ctx, x + bx * s + s * 0.05, y + by * s + s * 0.08, br * s * 1.05, br * s * 0.95, ramp(pal, 0.2), 0.9);
      glaze(ctx, x + bx * s - s * 0.08, y + by * s - s * 0.1, br * s * 0.7, br * s * 0.6, ramp(pal, 0.65), 0.6);
    }
    ctx.restore();
    for (let j = 0; j < n; j++) {
      const [bx, by, br] = blobs[j % blobs.length];
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * br;
      const px = x + (bx + Math.cos(a) * d) * s, py = y + (by + Math.sin(a) * d) * s;
      const light = clamp(0.5 - (px - x) / (s * 2) - (py - (y + by * s)) / (s * 2.2) + (r() - 0.5) * 0.3);
      let col = mix(ramp(pal, light), WARM, light * 0.12);
      if (extra && r() < extra.p) col = ramp(extra.pal, r());
      if (r() < 0.35) dab(ctx, px, py, s * (0.025 + r() * 0.025), s * (0.018 + r() * 0.015), r() * 3, col, 0.95);
      else stroke(ctx, r, px, py, r() * Math.PI * 2, s * (0.06 + r() * 0.07), s * (0.035 + r() * 0.03), col, 0.9, 2);
    }
  }
  const GREEN_LEAVES = [[0, "#3f5a3c"], [0.5, "#5f7d4f"], [1, "#9cb36b"]];
  const AUTUMN = [[0, "#8a4f2a"], [0.3, "#b8692e"], [0.6, "#d99a3f"], [0.85, "#f0c35e"], [1, "#f8dd92"]];
  const TREE_BLOBS = [[0, -1.25, 0.8], [-0.55, -0.95, 0.6], [0.55, -1.0, 0.62], [0.12, -1.75, 0.55], [-0.3, -1.55, 0.5]];

  function tree(x, y, s, seed, kind = "green", lit = 1) {
    const r = rng(seed);
    withThickness(0.85, () => {
      glaze(ctx, x + s * 0.35, y + s * 0.05, s * 1.3, s * 0.22, SHADOW, 0.25);
      for (let i = 0; i < 6; i++) stroke(ctx, r, x + (r() - 0.5) * s * 0.12, y, -Math.PI / 2 + (r() - 0.5) * 0.12, s * (0.95 + r() * 0.3), s * 0.14, mix(hex("#5e4a3a"), i < 3 ? WARM : SHADOW, 0.15), 0.9, 3);
      stroke(ctx, r, x, y - s * 0.7, -Math.PI / 2 - 0.6, s * 0.5, s * 0.07, hex("#5e4a3a"), 0.9, 2);
      stroke(ctx, r, x, y - s * 0.75, -Math.PI / 2 + 0.55, s * 0.45, s * 0.06, hex("#5e4a3a"), 0.9, 2);
      const n = Math.round((s * s) / (40 * k * k) + 80);
      if (kind === "autumn") canopy(x, y, s, seed + 1, AUTUMN, TREE_BLOBS, n, { p: 0.18, pal: GREEN_LEAVES });
      else if (kind === "turning") canopy(x, y, s, seed + 1, GREEN_LEAVES, TREE_BLOBS, n, { p: 0.22, pal: AUTUMN });
      else canopy(x, y, s, seed + 1, GREEN_LEAVES, TREE_BLOBS, n);
      // warm rim of light on the sun side
      for (let j = 0; j < n * 0.12 * lit; j++) {
        const [bx, by, br] = TREE_BLOBS[j % TREE_BLOBS.length];
        const a = Math.PI * (1.0 + r() * 0.5), d = br * (0.55 + r() * 0.4);
        const px = x + (bx + Math.cos(a) * d) * s, py = y + (by + Math.sin(a) * d) * s;
        dab(ctx, px, py, s * (0.018 + r() * 0.015), s * 0.014, r() * 3, mix(kind === "autumn" ? hex("#f8dd92") : hex("#c9d38a"), WARM, 0.35), 0.9);
      }
    });
  }

  function fallenLeaves(cx, cy, rx, ry, n, seed) {
    const r = rng(seed);
    withThickness(0.7, () => {
      for (let i = 0; i < n; i++) {
        const g = () => (r() + r() - 1);
        const x = cx + g() * rx, y = cy + g() * ry;
        const s = (5 + r() * 6) * k * (0.6 + y / Y(3) * 0.6);
        const col = ramp(AUTUMN, 0.25 + r() * 0.7);
        dab(ctx, x, y, s, s * 0.5, r() * 3, col, 0.9);
        dab(ctx, x - s * 0.2, y - s * 0.15, s * 0.4, s * 0.2, 0, mix(col, WARM, 0.5), 0.7);
      }
    });
  }

  const shrub = (x, y, s, seed, bloom = [[0, "#c97a7c"], [0.5, "#e9a9aa"], [1, "#fbe2d8"]], blooms = 120) => {
    const r = rng(seed);
    ctx.save();
    ctx.filter = `blur(${12 * k}px)`;
    glaze(ctx, x + s * 0.35, y + s * 0.15, s * 1.1, s * 0.28, SHADOW, 0.35);
    ctx.restore();
    withThickness(0.85, () => {
      for (let j = 0; j < 260; j++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r());
        const px = x + Math.cos(a) * s * d, py = y - s * 0.55 + Math.sin(a) * s * 0.6 * d;
        const light = clamp(0.55 - (px - x) / (s * 1.6) - (py - (y - s * 0.55)) / (s * 1.4));
        const col = mix(ramp(GREEN_LEAVES, light), WARM, light * 0.12);
        stroke(ctx, r, px, py, r() * Math.PI * 2, s * (0.12 + r() * 0.12), s * (0.06 + r() * 0.05), col, 0.8, 2);
      }
      for (let j = 0; j < blooms; j++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r());
        const px = x + Math.cos(a) * s * d * 0.95, py = y - s * 0.6 + Math.sin(a) * s * 0.55 * d;
        const light = clamp(0.6 - (px - x) / (s * 1.6) - (py - (y - s * 0.6)) / (s * 1.2));
        const col = mix(ramp(bloom, light), WARM, light * 0.2);
        const br = s * (0.035 + r() * 0.03);
        dab(ctx, px + br * 0.3, py + br * 0.35, br, br * 0.8, 0, mix(col, SHADOW, 0.35), 0.5, false);
        for (let q = 0; q < 3; q++) stroke(ctx, r, px - br * 0.6, py + (q - 1) * br * 0.45, (r() - 0.5) * 0.8, br * 1.5, br * 0.75, mix(col, q === 0 ? WARM : col, 0.3), 0.9, 0);
      }
    });
  };

  // ---- flowers
  const daisy = (x, y, rr, r, tint = "#fbf6ec") => {
    const petals = 9 + Math.floor(r() * 4);
    const rot = r() * Math.PI;
    glaze(ctx, x + rr * 0.25, y + rr * 0.3, rr * 1.05, rr * 0.7, SHADOW, 0.2);
    for (let i = 0; i < petals; i++) {
      const a = rot + (i / petals) * Math.PI * 2;
      stroke(ctx, r, x, y, a, rr * (0.85 + r() * 0.3), rr * 0.42, mix(hex(tint), hex("#f2c9c4"), r() * 0.35), 0.92, 1);
    }
    dab(ctx, x, y, rr * 0.34, rr * 0.3, 0, hex("#d99a3e"), 1);
    dab(ctx, x - rr * 0.1, y - rr * 0.1, rr * 0.16, rr * 0.13, 0, hex("#f6d27c"), 0.9);
  };
  const cosmos = (x, y, rr, r) => {
    const base = ramp([[0, "#d9827f"], [0.5, "#eba3a6"], [1, "#f6c7c3"]], r());
    glaze(ctx, x + rr * 0.25, y + rr * 0.3, rr * 1.1, rr * 0.75, SHADOW, 0.18);
    const rot = r() * Math.PI;
    for (let i = 0; i < 8; i++) stroke(ctx, r, x, y, rot + (i / 8) * Math.PI * 2, rr * 0.95, rr * 0.62, mix(base, WARM, r() * 0.25), 0.9, 2);
    dab(ctx, x, y, rr * 0.22, rr * 0.2, 0, hex("#e3b04f"), 1);
  };
  const spike = (x, y, h, r) => {
    stroke(ctx, r, x, y, -Math.PI / 2, h, h * 0.05, hex("#6f8a5a"), 0.8, 1);
    for (let i = 0; i < 9; i++) {
      const t = 0.45 + (i / 9) * 0.55;
      dab(ctx, x + (r() - 0.5) * h * 0.06, y - h * t, h * 0.05 * (1.1 - t * 0.5), h * 0.035, 0, mix(hex("#9d8bc0"), hex("#d4c4e6"), r() * 0.6), 0.9);
    }
  };
  const tinyFlower = (x, y, rr, r) => {
    const col = [hex("#fbf3ea"), hex("#f2b8a0"), hex("#e9afab"), hex("#e3bf73"), hex("#d4c4e6")][Math.floor(r() * 5)];
    dab(ctx, x, y, rr, rr * 0.8, r(), col, 0.9);
    dab(ctx, x - rr * 0.3, y - rr * 0.3, rr * 0.4, rr * 0.35, 0, WARM, 0.5);
  };
  const cluster = (cl) => {
    const r = rng(cl.seed);
    const items = [];
    for (let i = 0; i < cl.n; i++) {
      const g = () => (r() + r() + r() - 1.5) / 1.5;
      items.push([X(cl.x) + g() * X(cl.rx), Y(cl.y) + g() * Y(cl.ry)]);
    }
    items.sort((a, b) => a[1] - b[1]);
    withThickness(cl.th ?? 0.85, () => {
      if (cl.foliage) {
        for (let i = 0; i < cl.n * 2.5; i++) {
          const g = () => (r() + r() + r() - 1.5) / 1.5;
          const x = X(cl.x) + g() * X(cl.rx) * 1.1, y = Y(cl.y) + g() * Y(cl.ry) * 1.1;
          const light = r();
          const col = mix(ramp([[0, "#3c5639"], [0.6, "#5d7a4c"], [1, "#93ac68"]], light), WARM, light * 0.1);
          stroke(ctx, r, x, y, -Math.PI / 2 + (r() - 0.5) * 2.2, cl.size[1] * 2.4 * k * (0.6 + r() * 0.6), cl.size[1] * 0.75 * k, col, 0.8, 2);
        }
      }
      for (const [x, y] of items) {
        const depth = clamp((y - Y(cl.y - cl.ry)) / Y(cl.ry * 2));
        const rr = lerp(cl.size[0], cl.size[1], depth * 0.6 + r() * 0.4) * k;
        if (cl.stems) stroke(ctx, r, x, y + rr * 0.5, Math.PI / 2 + (r() - 0.5) * 0.3, rr * 3, rr * 0.18, hex("#6f8a5a"), 0.7, 1);
        const kind = cl.kinds[Math.floor(r() * cl.kinds.length)];
        if (kind === "daisy") daisy(x, y, rr, r);
        else if (kind === "cosmos") cosmos(x, y, rr, r);
        else if (kind === "spike") spike(x, y + rr, rr * 5, r);
        else tinyFlower(x, y, rr * 0.5, r);
      }
    });
  };

  function grassClump(x0, x1, y0, y1, n, seed, hRange = [120, 340]) {
    const r = rng(seed);
    withThickness(0.9, () => {
      ctx.save();
      ctx.filter = `blur(${26 * k}px)`;
      glaze(ctx, (x0 + x1) / 2, y1, (x1 - x0) * 0.6, (y1 - y0) * 0.5, SHADOW, 0.35);
      ctx.restore();
      for (let j = 0; j < n; j++) {
        const x = lerp(x0, x1, r()), y = lerp(y0, y1, r());
        const h = lerp(hRange[0], hRange[1], r()) * k;
        const col = mix(ramp([[0, "#4d6a44"], [0.6, "#6f8f5a"], [1, "#a7bd78"]], r()), WARM, r() * 0.12);
        stroke(ctx, r, x, y, -Math.PI / 2 + (r() - 0.5) * 0.8, h, (8 + r() * 10) * k, col, 0.85, 2);
      }
    });
  }

  /** A cream cottage with a terracotta roof, warm windows and roses by the door. */
  function cottage(cx, base, w, seed) {
    const r = rng(seed);
    const h = w * 0.5;
    const x0 = cx - w / 2, x1 = cx + w / 2, top = base - h;
    const side = w * 0.26; // the side wall, turned away from the sun
    ctx.save();
    ctx.filter = `blur(${10 * k}px)`;
    glaze(ctx, cx + w * 0.25, base + w * 0.03, w * 0.75, w * 0.07, SHADOW, 0.45);
    ctx.restore();
    withThickness(1, () => {
      // front wall: palette-knife plaster (kept inside the walls)
      const walls = new Path2D();
      walls.rect(x0, top, w, h);
      clipBoth(ctx, walls);
      for (let i = 0; i < 70; i++) {
        const x = lerp(x0, x1 - side, r()), y = lerp(top, base - w * 0.04, r());
        const col = mix(ramp([[0, "#fbf1dd"], [1, "#e8d6b6"]], (y - top) / h + (x - x0) / w * 0.3), WARM, 0.1);
        knife(ctx, r, x, y, (r() - 0.5) * 0.6, w * (0.08 + r() * 0.08), w * (0.05 + r() * 0.04), col);
      }
      // side wall in shade
      for (let i = 0; i < 40; i++) {
        const x = lerp(x1 - side, x1, r()), y = lerp(top + w * 0.06, base - w * 0.04, r());
        knife(ctx, r, x, y, (r() - 0.5) * 0.4, w * 0.07, w * 0.05, mix(hex("#cdb898"), hex("#b9a383"), r()));
      }
      unclipBoth(ctx);
      // roof: rows of terracotta strokes, front gable plus side slope
      const ridgeY = top - w * 0.3;
      const roof = new Path2D();
      roof.moveTo(x0 - w * 0.05, top + w * 0.02);
      roof.lineTo((x0 + x1 - side) / 2, ridgeY);
      roof.lineTo(x1 + w * 0.02, ridgeY + w * 0.06);
      roof.lineTo(x1 + w * 0.04, top + w * 0.08);
      roof.closePath();
      clipBoth(ctx, roof);
      for (let row = 0; row < 14; row++) {
        const y = ridgeY + row * (w * 0.03);
        for (let i = 0; i < 26; i++) {
          const x = x0 - w * 0.06 + i * (w * 0.045) + (row % 2) * w * 0.02;
          const lit = clamp(1 - (x - x0) / w);
          const col = mix(ramp([[0, "#9c5541"], [0.5, "#bf6e52"], [1, "#d98d6a"]], lit * 0.8 + r() * 0.2), WARM, 0.05);
          stroke(ctx, r, x, y, 0.15 + (r() - 0.5) * 0.2, w * 0.05, w * 0.028, col, 0.95, 2);
        }
      }
      unclipBoth(ctx);
      // eave shadow
      glaze(ctx, cx, top + w * 0.05, w * 0.55, w * 0.025, SHADOW, 0.3);
      // chimney + a breath of smoke
      const chx = x1 - side * 0.6;
      for (let i = 0; i < 6; i++) knife(ctx, r, chx - w * 0.03 + r() * w * 0.04, ridgeY - w * 0.1 + i * w * 0.025, 0, w * 0.06, w * 0.03, mix(hex("#a85f48"), WARM, r() * 0.2));
      ctx.save();
      ctx.filter = `blur(${8 * k}px)`;
      for (let i = 0; i < 5; i++) glaze(ctx, chx + i * w * 0.05, ridgeY - w * 0.16 - i * w * 0.07, w * (0.05 + i * 0.015), w * 0.03, hex("#f7ece6"), 0.35 - i * 0.05);
      ctx.restore();
      // door (dusty blue) and windows with warm light
      const dx = x0 + (w - side) * 0.42;
      knife(ctx, r, dx - w * 0.055, base - w * 0.04, -Math.PI / 2, w * 0.2, w * 0.1, hex("#6c8088"));
      dab(ctx, dx + w * 0.03, base - w * 0.12, w * 0.008, w * 0.008, 0, hex("#e3bf73"), 1);
      for (const wx of [x0 + (w - side) * 0.16, x0 + (w - side) * 0.72]) {
        dab(ctx, wx, top + h * 0.42, w * 0.055, w * 0.06, 0, hex("#f4cf7f"), 1);
        glaze(ctx, wx, top + h * 0.42, w * 0.09, w * 0.09, hex("#ffe2a0"), 0.25);
        stroke(ctx, r, wx - w * 0.055, top + h * 0.42, 0, w * 0.11, w * 0.01, hex("#fbf3e4"), 1, 0);
        stroke(ctx, r, wx, top + h * 0.42 - w * 0.06, Math.PI / 2, w * 0.12, w * 0.01, hex("#fbf3e4"), 1, 0);
        knife(ctx, r, wx - w * 0.1, top + h * 0.42 - w * 0.06, Math.PI / 2, w * 0.12, w * 0.035, hex("#8ea58a"));
        knife(ctx, r, wx + w * 0.065, top + h * 0.42 - w * 0.06, Math.PI / 2, w * 0.12, w * 0.035, hex("#8ea58a"));
        // window box flowers
        for (let i = 0; i < 6; i++) dab(ctx, wx - w * 0.05 + i * w * 0.02, top + h * 0.42 + w * 0.075, w * 0.012, w * 0.01, 0, [hex("#e9a9aa"), hex("#d47a78"), hex("#fbe6dc")][i % 3], 1);
      }
      // climbing roses at the corner and a few in the side bed
      for (let i = 0; i < 40; i++) {
        const y = lerp(top + h * 0.1, base, r()), x = x0 + (r() - 0.3) * w * 0.08;
        stroke(ctx, r, x, y, r() * 6.28, w * 0.04, w * 0.02, ramp(GREEN_LEAVES, r()), 0.9, 1);
        if (r() < 0.45) dab(ctx, x, y, w * 0.013, w * 0.012, 0, [hex("#e9a9aa"), hex("#d47a78"), hex("#fbe6dc")][i % 3], 1);
      }
    });
  }

  /**
   * A small dog seen from the side, at ground point (x, y), length s, facing `dir`.
   * Built as a clear silhouette (body, chest, head, muzzle, legs, tail) and then
   * painted inside it with short fur strokes, lit from the upper left.
   */
  function dog(x, y, s, pose, coat, dir, seed) {
    const r = rng(seed);
    const [base, darkC, lightC] = coat.map(hex);
    const px = (u) => x + dir * u * s, py = (v) => y + v * s;
    // [cx, cy, rx, ry, rot] in units of s (facing right, ground at 0)
    const POSES = {
      trot: { body: [0, -0.42, 0.3, 0.14, 0], chest: [0.22, -0.5, 0.13, 0.14, 0], head: [0.36, -0.7, 0.12, 0.11], muzzle: [0.48, -0.66, 0.08, 0.055], ear: [0.31, -0.68, 0.045, 0.1, 0.35],
        legs: [[0.2, -0.4, 0.3, -0.02], [0.14, -0.4, 0.08, 0], [-0.2, -0.4, -0.3, -0.02], [-0.15, -0.4, -0.06, 0]], tail: [[-0.28, -0.48], [-0.4, -0.62], [-0.46, -0.78]] },
      bow: { body: [0, -0.36, 0.3, 0.14, 0.3], chest: [0.2, -0.28, 0.13, 0.12, 0], head: [0.36, -0.36, 0.12, 0.11], muzzle: [0.48, -0.33, 0.08, 0.055], ear: [0.3, -0.36, 0.045, 0.1, 0.5],
        legs: [[0.24, -0.22, 0.42, -0.01], [0.18, -0.22, 0.36, 0], [-0.2, -0.5, -0.24, -0.01], [-0.14, -0.48, -0.14, 0]], tail: [[-0.28, -0.56], [-0.36, -0.74], [-0.3, -0.9]] },
      sit: { body: [-0.06, -0.36, 0.2, 0.24, -0.35], chest: [0.08, -0.52, 0.13, 0.16, 0], head: [0.16, -0.82, 0.12, 0.11], muzzle: [0.28, -0.78, 0.08, 0.055], ear: [0.11, -0.8, 0.045, 0.1, 0.35],
        legs: [[0.12, -0.42, 0.14, 0], [0.06, -0.42, 0.07, 0], [-0.22, -0.12, -0.04, -0.02]], tail: [[-0.24, -0.06], [-0.38, -0.04], [-0.48, -0.1]] },
    };
    const P = POSES[pose];
    const ell = (pth, [cx, cy, rx, ry, rot = 0]) => pth.ellipse(px(cx), py(cy), rx * s, ry * s, dir * rot, 0, Math.PI * 2);
    const sil = new Path2D();
    for (const part of [P.body, P.chest, P.head, P.muzzle]) { sil.moveTo(px(part[0] + part[2]), py(part[1])); ell(sil, part); }
    glaze(ctx, x, y + s * 0.02, s * 0.5, s * 0.07, SHADOW, 0.3);
    withThickness(0.95, () => {
      // legs (far ones a little darker), then the tail
      ctx.lineCap = "round";
      P.legs.forEach(([ax, ay, bx, by], i) => {
        ctx.beginPath();
        ctx.moveTo(px(ax), py(ay));
        ctx.lineTo(px(bx), py(by));
        ctx.strokeStyle = rgba(i % 2 ? mix(base, darkC, 0.35) : base);
        ctx.lineWidth = s * 0.075;
        ctx.stroke();
        dab(ctx, px(bx + 0.02), py(by - 0.01), s * 0.045, s * 0.025, 0, mix(base, lightC, 0.3), 1);
      });
      const [t0, t1, t2] = P.tail;
      ctx.beginPath();
      ctx.moveTo(px(t0[0]), py(t0[1]));
      ctx.quadraticCurveTo(px(t1[0]), py(t1[1]), px(t2[0]), py(t2[1]));
      ctx.strokeStyle = rgba(mix(base, darkC, 0.15));
      ctx.lineWidth = s * 0.055;
      ctx.stroke();
      // body silhouette, then fur inside it
      ctx.fillStyle = rgba(base);
      ctx.fill(sil);
      if (PAINT.hx) { PAINT.hx.fillStyle = grey(150); PAINT.hx.fill(sil); }
      clipBoth(ctx, sil);
      const [bx, by, brx, bry, brot] = P.body;
      for (let i = 0; i < 70; i++) {
        const u = bx + (r() - 0.5) * 2.2 * brx, v = by + (r() - 0.5) * 2.4 * bry - 0.05;
        const lit = clamp(0.6 - (v - by) * 3 - dir * 0 + (r() - 0.5) * 0.3);
        const col = lit > 0.55 ? mix(base, lightC, 0.45) : lit < 0.3 ? mix(base, darkC, 0.4) : base;
        stroke(ctx, r, px(u), py(v), dir > 0 ? Math.PI + brot * 0.8 + (r() - 0.5) * 0.4 : brot * -0.8 + (r() - 0.5) * 0.4, s * (0.08 + r() * 0.06), s * 0.035, col, 0.85, 1);
      }
      const [hxp, hyp] = P.head;
      for (let i = 0; i < 18; i++) {
        stroke(ctx, r, px(hxp + (r() - 0.6) * 0.18), py(hyp + (r() - 0.6) * 0.14), r() * 6.28, s * 0.05, s * 0.03, r() < 0.5 ? mix(base, lightC, 0.5) : base, 0.85, 0);
      }
      // a light chest, belly in shadow
      glaze(ctx, px(P.chest[0] + 0.03), py(P.chest[1] + 0.03), s * 0.07, s * 0.09, lightC, 0.55);
      glaze(ctx, px(bx), py(by + bry * 0.9), s * brx * 0.9, s * 0.05, darkC, 0.3);
      unclipBoth(ctx);
      // ear, eye, nose, a red collar
      const [ex, ey, erx, ery, erot] = P.ear;
      dab(ctx, px(ex), py(ey), erx * s, ery * s, dir * erot, darkC, 1);
      dab(ctx, px(hxp + 0.06), py(hyp - 0.02), s * 0.018, s * 0.02, 0, hex("#2b2420"), 1);
      dab(ctx, px(P.muzzle[0] + 0.07), py(P.muzzle[1] - 0.01), s * 0.03, s * 0.025, 0, hex("#2b2420"), 1);
      stroke(ctx, r, px(P.chest[0] + 0.02), py(P.head[1] + 0.12), dir > 0 ? 1.3 : Math.PI - 1.3, s * 0.1, s * 0.035, hex("#c0473f"), 1, 0);
    });
  }

  /** A small red ball for the dogs. */
  const ball = (x, y, s) => withThickness(0.9, () => {
    glaze(ctx, x + s * 0.3, y + s * 0.6, s * 1.1, s * 0.3, SHADOW, 0.3);
    dab(ctx, x, y, s, s, 0, hex("#c95a4e"), 1);
    dab(ctx, x - s * 0.3, y - s * 0.3, s * 0.35, s * 0.3, 0, hex("#f2a68f"), 0.9);
  });

  // ---- the tea table and its things
  function teaTable(cx, topY, R, seed) {
    const r = rng(seed);
    const ry = R * 0.32; // the round top in perspective
    const drop = R * 0.62; // how far the cloth hangs
    // shadow under the table on the grass
    ctx.save();
    ctx.filter = `blur(${14 * k}px)`;
    glaze(ctx, cx + R * 0.2, topY + drop + R * 0.12, R * 1.25, R * 0.22, SHADOW, 0.45);
    ctx.restore();
    withThickness(0.95, () => {
      // legs (wrought iron) showing below the cloth
      for (const lx of [-0.55, 0.5, -0.1]) stroke(ctx, r, cx + lx * R, topY + drop * 0.9, Math.PI / 2 + lx * 0.15, drop * 0.45, R * 0.035, hex("#3f4d43"), 0.95, 1);
      // the cloth: top ellipse + a skirt with a wavy hem
      const cloth = new Path2D();
      cloth.ellipse(cx, topY, R * 1.04, ry * 1.04, 0, Math.PI, 0);
      const hemPts = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const x = cx + R * 1.04 * Math.cos(t * Math.PI);
        hemPts.push([x, topY + Math.sin(t * Math.PI) * ry + drop + Math.sin(t * Math.PI * 7) * R * 0.035]);
      }
      cloth.lineTo(hemPts[0][0], hemPts[0][1]);
      for (const p of hemPts) cloth.lineTo(p[0], p[1]);
      cloth.closePath();
      clipBoth(ctx, cloth);
      ctx.fillStyle = rgba(hex("#fbf6ef"));
      ctx.fill(cloth);
      // gingham: soft pink bands both ways, deeper where they cross; the top in perspective,
      // the skirt hanging straight
      const cell = R * 0.085;
      const band = rgba(hex("#e59a9f"), 0.42);
      ctx.fillStyle = band;
      for (let gx = -R * 1.2; gx < R * 1.2; gx += cell * 2) {
        ctx.beginPath();
        ctx.moveTo(cx + gx * 0.92, topY - ry);
        ctx.lineTo(cx + (gx + cell) * 0.92, topY - ry);
        ctx.lineTo(cx + gx + cell, topY + ry + drop + R * 0.06);
        ctx.lineTo(cx + gx, topY + ry + drop + R * 0.06);
        ctx.fill();
      }
      for (let gy = topY - ry; gy < topY + ry * 0.95; gy += cell * 0.64) ctx.fillRect(cx - R * 1.2, gy, R * 2.4, cell * 0.32);
      for (let gy = topY + ry * 0.95 + cell; gy < topY + ry + drop + cell; gy += cell * 2) {
        ctx.beginPath();
        for (let x = cx - R * 1.1; x <= cx + R * 1.1 + 1; x += R * 0.05) {
          const yy = gy + Math.sqrt(Math.max(0, 1 - ((x - cx) / (R * 1.05)) ** 2)) * ry * 0.9 - ry * 0.9;
          if (x === cx - R * 1.1) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        for (let x = cx + R * 1.1; x >= cx - R * 1.1 - 1; x -= R * 0.05) ctx.lineTo(x, gy + cell + Math.sqrt(Math.max(0, 1 - ((x - cx) / (R * 1.05)) ** 2)) * ry * 0.9 - ry * 0.9);
        ctx.fill();
      }
      // painted over lightly with the knife, so the cloth has body but the check still reads
      for (let i = 0; i < 90; i++) {
        const x = cx + (r() * 2 - 1) * R * 1.05, y = topY - ry + r() * (ry * 2 + drop);
        const onSkirt = y > topY + ry * 0.7;
        knife(ctx, r, x, y, onSkirt ? Math.PI / 2 + (r() - 0.5) * 0.15 : (r() - 0.5) * 0.4, R * (0.1 + r() * 0.1), R * 0.05, hex("#fffaf3"), 0.22);
      }
      // fold shadows and lights hanging from the table edge
      for (let i = 0; i < 11; i++) {
        const fx = cx - R + (i + 0.5) * (2 * R / 11);
        stroke(ctx, r, fx, topY + ry * 0.85, Math.PI / 2 + (r() - 0.5) * 0.08, drop * 1.0, R * 0.07, hex("#a8938a"), 0.28, 2);
        stroke(ctx, r, fx + R * 0.06, topY + ry * 0.9, Math.PI / 2, drop * 0.9, R * 0.03, hex("#fffdf8"), 0.4, 1);
      }
      // the cloth's right side in shade
      const sg = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
      sg.addColorStop(0, "rgba(255,240,215,0.18)");
      sg.addColorStop(0.55, "rgba(0,0,0,0)");
      sg.addColorStop(1, "rgba(60,70,55,0.28)");
      ctx.fillStyle = sg;
      ctx.fillRect(cx - R * 1.2, topY - ry * 1.2, R * 2.4, ry * 2.4 + drop);
      unclipBoth(ctx);

      const on = (fx, fy) => [cx + fx * R, topY + fy * ry];
      const shadowOn = (x, y, w) => glaze(ctx, x + w * 0.25, y + w * 0.1, w * 0.7, w * 0.18, SHADOW, 0.22);

      // cake stand with little cakes
      {
        const [x, y] = on(-0.45, -0.15);
        const w = R * 0.34;
        shadowOn(x, y, w);
        stroke(ctx, r, x, y, -Math.PI / 2, w * 0.7, w * 0.06, hex("#d8cfc2"), 1, 1);
        for (const [py, pw] of [[0, 1], [-0.65, 0.7]]) {
          dab(ctx, x, y + py * w, pw * w, pw * w * 0.22, 0, hex("#f4efe8"), 1);
          stroke(ctx, r, x - pw * w, y + py * w, 0, pw * w * 2, w * 0.04, hex("#c9bfb2"), 0.8, 0);
          for (let i = 0; i < Math.round(4 * pw); i++) {
            const ccx = x + (i - (pw * 4 - 1) / 2) * w * 0.38, ccy = y + py * w - w * 0.1;
            const cake = [hex("#f3c1c4"), hex("#f6e1b8"), hex("#e9a6a9"), hex("#fbf1e6")][(i + Math.round(py * 3)) & 3];
            knife(ctx, r, ccx - w * 0.14, ccy, 0, w * 0.28, w * 0.18, cake);
            dab(ctx, ccx, ccy - w * 0.12, w * 0.13, w * 0.07, 0, mix(cake, WARM, 0.5), 1);
            dab(ctx, ccx + w * 0.02, ccy - w * 0.2, w * 0.05, w * 0.05, 0, hex("#c84f4c"), 1);
          }
        }
      }
      // teapot
      {
        const [x, y] = on(0.05, -0.2);
        const w = R * 0.26;
        shadowOn(x, y, w * 1.4);
        stroke(ctx, r, x + w * 0.8, y - w * 0.6, -0.7, w * 0.6, w * 0.16, hex("#e8e0d6"), 1, 1); // spout
        ctx.save();
        ctx.lineWidth = w * 0.12;
        ctx.strokeStyle = rgba(hex("#ddd3c6"));
        ctx.beginPath();
        ctx.ellipse(x - w * 0.9, y - w * 0.55, w * 0.35, w * 0.4, 0, Math.PI * 0.5, Math.PI * 1.5);
        ctx.stroke();
        ctx.restore();
        dab(ctx, x, y - w * 0.55, w * 0.95, w * 0.72, 0, hex("#f3ede6"), 1);
        dab(ctx, x - w * 0.35, y - w * 0.8, w * 0.35, w * 0.25, 0, hex("#fffdf8"), 0.9);
        glaze(ctx, x + w * 0.45, y - w * 0.35, w * 0.45, w * 0.4, hex("#b9b0a8"), 0.35);
        for (let i = 0; i < 7; i++) dab(ctx, x + (r() - 0.5) * w * 1.2, y - w * (0.3 + r() * 0.5), w * 0.08, w * 0.07, 0, [hex("#e39a9c"), hex("#8fb08a")][i % 2], 1);
        dab(ctx, x, y - w * 1.22, w * 0.5, w * 0.14, 0, hex("#e8e0d6"), 1);
        dab(ctx, x, y - w * 1.36, w * 0.12, w * 0.1, 0, hex("#e3a5a7"), 1);
      }
      // two cups on saucers
      for (const [fx, fy] of [[0.55, -0.05], [-0.05, 0.45]]) {
        const [x, y] = on(fx, fy);
        const w = R * 0.15;
        shadowOn(x, y, w * 1.6);
        dab(ctx, x, y, w * 1.25, w * 0.38, 0, hex("#f4efe8"), 1);
        knife(ctx, r, x - w * 0.62, y - w * 0.05, -Math.PI / 2, w * 0.62, w * 1.22, hex("#f6f1ea"));
        dab(ctx, x, y - w * 0.66, w * 0.62, w * 0.2, 0, hex("#b7805a"), 1); // tea
        stroke(ctx, r, x - w * 0.62, y - w * 0.66, 0, w * 1.24, w * 0.08, hex("#e7a3a6"), 0.9, 0);
        ctx.save();
        ctx.lineWidth = w * 0.12;
        ctx.strokeStyle = rgba(hex("#e6ddd2"));
        ctx.beginPath();
        ctx.ellipse(x + w * 0.72, y - w * 0.35, w * 0.2, w * 0.2, 0, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.restore();
      }
      // a plate of fruit: peaches and strawberries
      {
        const [x, y] = on(0.55, 0.42);
        const w = R * 0.2;
        shadowOn(x, y, w * 1.4);
        dab(ctx, x, y, w * 1.2, w * 0.36, 0, hex("#f2ede6"), 1);
        for (let i = 0; i < 3; i++) {
          const px = x + (i - 1) * w * 0.55, py = y - w * 0.25 - (i === 1 ? w * 0.15 : 0);
          dab(ctx, px, py, w * 0.3, w * 0.28, 0, hex("#f1a978"), 1);
          dab(ctx, px - w * 0.1, py - w * 0.1, w * 0.12, w * 0.1, 0, hex("#fbd3a6"), 0.9);
          glaze(ctx, px + w * 0.12, py + w * 0.05, w * 0.1, w * 0.12, hex("#d9705c"), 0.6);
        }
        for (let i = 0; i < 4; i++) {
          const px = x + (r() - 0.5) * w * 1.6, py = y + w * 0.02 - r() * w * 0.12;
          dab(ctx, px, py, w * 0.14, w * 0.17, 0, hex("#c8423f"), 1);
          dab(ctx, px, py - w * 0.15, w * 0.1, w * 0.04, 0, hex("#6f8a5a"), 1);
        }
      }
      // a little vase of flowers
      {
        const [x, y] = on(0.22, -0.55);
        const w = R * 0.12;
        knife(ctx, r, x - w * 0.4, y, -Math.PI / 2, w * 1.1, w * 0.8, hex("#b9cfd2"));
        dab(ctx, x - w * 0.15, y - w * 0.6, w * 0.12, w * 0.35, 0, hex("#eaf3f2"), 0.8);
        for (let i = 0; i < 6; i++) {
          const a = -Math.PI / 2 + (i - 2.5) * 0.28;
          const sx = x + Math.cos(a) * w * 1.6, sy = y - w * 1.1 + Math.sin(a) * w * 1.6;
          stroke(ctx, r, x, y - w * 1.0, a, w * 1.6, w * 0.08, hex("#6f8a5a"), 1, 0);
          if (i % 2) daisy(sx, sy, w * 0.42, r); else cosmos(sx, sy, w * 0.4, r);
        }
      }
    });
  }

  /**
   * A painted wooden garden chair: cream paint over wood, a slatted back and a
   * small gingham cushion, built from the same knife slabs and bristle strokes
   * as the table and gate. (x, y) is the ground under it; s is its height.
   */
  function gardenChair(x, y, s, dir, seed) {
    const r = rng(seed);
    const px = (u) => x + dir * u * s;
    const paint = (lit) => mix(ramp([[0, "#a99c86"], [0.5, "#e6dcc8"], [1, "#fbf4e6"]], lit), WARM, lit * 0.1);
    ctx.save();
    ctx.filter = `blur(${10 * k}px)`;
    glaze(ctx, x + s * 0.12, y + s * 0.02, s * 0.5, s * 0.07, SHADOW, 0.45);
    ctx.restore();
    withThickness(1, () => {
      const leg = (u0, v0, u1, v1, lit, w = 0.06) => {
        const ax = px(u0), ay = y - v0 * s, bx = px(u1), by = y - v1 * s;
        knife(ctx, r, ax - (w * s) / 2, ay, Math.atan2(by - ay, bx - ax), Math.hypot(bx - ax, by - ay), w * s, paint(lit));
        stroke(ctx, r, ax - (w * s) * 0.35, ay, Math.atan2(by - ay, bx - ax), Math.hypot(bx - ax, by - ay), w * s * 0.25, paint(Math.min(1, lit + 0.3)), 0.7, 1);
      };
      // back legs and posts (further away, a little greyer)
      leg(-0.2, 1.0, -0.2, 0.04, 0.45);
      leg(0.32, 0.98, 0.32, 0.06, 0.3);
      // back slats and a gently arched top rail
      for (let i = 0; i < 4; i++) {
        const u = -0.12 + i * 0.12;
        knife(ctx, r, px(u) - 0.03 * s, y - 0.93 * s, Math.PI / 2, 0.44 * s, 0.065 * s, paint(0.75 - i * 0.1));
      }
      for (let i = 0; i < 4; i++) {
        stroke(ctx, r, px(-0.23), y - (0.98 - i * 0.012) * s + Math.sin(i) * 2, dir > 0 ? -0.04 : Math.PI + 0.04, 0.58 * s, 0.07 * s, paint(0.85 - i * 0.1), 0.95, 3);
      }
      // seat in perspective, lit on its top, darker front edge
      const seat = new Path2D();
      seat.moveTo(px(-0.22), y - 0.5 * s);
      seat.lineTo(px(0.34), y - 0.5 * s);
      seat.lineTo(px(0.26), y - 0.41 * s);
      seat.lineTo(px(-0.32), y - 0.41 * s);
      seat.closePath();
      clipBoth(ctx, seat);
      for (let i = 0; i < 18; i++) knife(ctx, r, px(-0.36 + r() * 0.7), y - (0.41 + r() * 0.09) * s, (r() - 0.5) * 0.08, 0.22 * s, 0.05 * s, paint(0.7 + r() * 0.3));
      unclipBoth(ctx);
      knife(ctx, r, px(-0.32), y - 0.41 * s, dir > 0 ? 0 : Math.PI, 0.58 * s, 0.035 * s, paint(0.25));
      // a little gingham cushion, to belong with the tablecloth
      dab(ctx, px(0.02), y - 0.5 * s, 0.24 * s, 0.06 * s, 0, hex("#f5dcdc"), 1);
      for (let i = -2; i <= 2; i++) stroke(ctx, r, px(0.02 + i * 0.08), y - 0.55 * s, Math.PI / 2, 0.09 * s, 0.035 * s, hex("#e59a9f"), 0.6, 0);
      stroke(ctx, r, px(-0.2), y - 0.5 * s, dir > 0 ? 0 : Math.PI, 0.44 * s, 0.03 * s, hex("#e59a9f"), 0.5, 0);
      glaze(ctx, px(0.1), y - 0.47 * s, 0.16 * s, 0.025 * s, hex("#b68a8a"), 0.35);
      // front legs, nearest and brightest
      leg(-0.3, 0.41, -0.31, 0, 0.85, 0.065);
      leg(0.24, 0.41, 0.25, 0.01, 0.55, 0.065);
      // a stretcher between the front legs
      stroke(ctx, r, px(-0.3), y - 0.16 * s, dir > 0 ? 0 : Math.PI, 0.54 * s, 0.03 * s, paint(0.5), 0.9, 1);
    });
  }

  /** A low clipped hedge with a gap and a small open wooden gate. */
  function hedgeWithGate(x0, x1, topY, botY, gap0, gap1, seed) {
    const r = rng(seed);
    // warm light beyond the gate
    const gx = (gap0 + gap1) / 2;
    const g = ctx.createRadialGradient(gx, topY + (botY - topY) * 0.4, 0, gx, topY + (botY - topY) * 0.4, (gap1 - gap0) * 1.4);
    g.addColorStop(0, "rgba(255,244,214,0.9)");
    g.addColorStop(1, "rgba(255,232,196,0)");
    ctx.fillStyle = g;
    ctx.fillRect(gap0 - (gap1 - gap0), topY - (botY - topY), (gap1 - gap0) * 3, (botY - topY) * 2.5);
    const bump = (x) => topY + Math.sin(x / (X(0.03))) * (botY - topY) * 0.06 + fbm(x / 200, 3, 11) * (botY - topY) * 0.08;
    withThickness(0.85, () => {
      for (const [a, b] of [[x0, gap0], [gap1, x1]]) {
        ctx.save();
        ctx.filter = `blur(${14 * k}px)`;
        glaze(ctx, (a + b) / 2, botY, (b - a) * 0.6, (botY - topY) * 0.25, SHADOW, 0.4);
        ctx.restore();
        const n = Math.round(((b - a) * (botY - topY)) / (90 * k * k));
        for (let i = 0; i < n; i++) {
          const x = lerp(a, b, r()), y = lerp(bump(x), botY, Math.pow(r(), 0.8));
          const t = (y - topY) / (botY - topY);
          const col = mix(ramp([[0, "#9db66d"], [0.35, "#5f7d4f"], [1, "#344d36"]], t + (r() - 0.5) * 0.25), WARM, (1 - t) * 0.1);
          stroke(ctx, r, x, y, r() * Math.PI * 2, (14 + r() * 18) * k, (8 + r() * 7) * k, col, 0.9, 2);
        }
        for (let i = 0; i < n * 0.06; i++) {
          const x = lerp(a, b, r()), y = lerp(bump(x), botY, r() * 0.7);
          dab(ctx, x, y, 4 * k, 3.5 * k, 0, [hex("#fbf3ea"), hex("#f2c9c4")][i % 2], 0.95);
        }
      }
      // gate posts and an open picket gate
      const ph = (botY - topY) * 1.25;
      for (const px of [gap0, gap1]) {
        for (let i = 0; i < 5; i++) knife(ctx, r, px - 10 * k + r() * 8 * k, botY - ph + i * ph * 0.2, Math.PI / 2, ph * 0.22, 22 * k, mix(hex("#8a6a4e"), i % 2 ? WARM : SHADOW, 0.15));
        dab(ctx, px, botY - ph - 6 * k, 16 * k, 9 * k, 0, hex("#9b7a5c"), 1);
      }
      const gw = (gap1 - gap0) * 0.42;
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const px = gap0 + 14 * k + t * gw, skew = t * 18 * k;
        knife(ctx, r, px - 5 * k, botY - ph * 0.85 + skew, Math.PI / 2, ph * 0.8, 12 * k, mix(hex("#efe5d2"), SHADOW, t * 0.12));
      }
      stroke(ctx, r, gap0 + 10 * k, botY - ph * 0.7, Math.atan2(18 * k, gw), gw + 10 * k, 10 * k, hex("#e3d6be"), 1, 1);
      stroke(ctx, r, gap0 + 10 * k, botY - ph * 0.25, Math.atan2(18 * k, gw), gw + 10 * k, 10 * k, hex("#e3d6be"), 1, 1);
    });
  }

  /** The post and arm the wooden sign hangs from. Returns the sign anchor. */
  function signPost(postX, groundY, armY, armTo, seed) {
    const r = rng(seed);
    withThickness(0.95, () => {
      glaze(ctx, postX + 30 * k, groundY + 4 * k, 60 * k, 12 * k, SHADOW, 0.35);
      for (let i = 0; i < 9; i++) knife(ctx, r, postX - 13 * k + (i % 3) * 8 * k, armY - 12 * k + (groundY - armY) * (Math.floor(i / 3) / 3), Math.PI / 2, (groundY - armY) * 0.38, 13 * k, mix(hex("#7c5c42"), i % 3 === 0 ? WARM : SHADOW, 0.18));
      for (let i = 0; i < 3; i++) knife(ctx, r, postX + 8 * k, armY - 8 * k + i * 6 * k, Math.PI, postX - armTo + 10 * k, 12 * k, mix(hex("#86664a"), i === 0 ? WARM : SHADOW, 0.15));
      stroke(ctx, r, postX - 4 * k, armY + 40 * k, Math.atan2(-40 * k, -(postX - armTo) * 0.35), (postX - armTo) * 0.42, 9 * k, hex("#6e513b"), 1, 1);
      dab(ctx, postX, armY - 16 * k, 14 * k, 8 * k, 0, hex("#9b7a5c"), 1);
      // a little vine with a flower twining up the post
      for (let i = 0; i < 14; i++) stroke(ctx, r, postX + (r() - 0.5) * 22 * k, lerp(groundY, armY + 60 * k, i / 14), r() * 6.28, 16 * k, 8 * k, ramp(GREEN_LEAVES, r()), 0.9, 1);
      cosmos(postX + 8 * k, armY + 90 * k, 12 * k, r);
    });
  }

  // ================================================== SCENE 1 — a living garden
  // sky: thin, soft paint
  const skyStops = L.skyStops;
  const skyPath = new Path2D();
  skyPath.rect(-40, -40, W + 80, Y(L.skyEnd) + 40);
  form({
    seed: 1, path: skyPath, bbox: [0, 0, W, Y(L.skyEnd)], edge: false, soft: 0,
    color: (x, y) => {
      let c = ramp(skyStops, y / S);
      const sd = Math.hypot((x - X(L.sun[0])) / W, ((y - Y(L.sun[1])) / S) * 1.6);
      return mix(c, hex("#fff1d6"), clamp(1 - sd / 0.45) * 0.55);
    },
    angle: (x, y) => fbm(x / 600, y / 300, 3) * 0.18, spread: 0.12,
    len: [70, 170], width: [14, 30], alpha: [0.12, 0.28], cover: 0.9, vary: 0.08, bristles: 4,
    thick: () => 0.08,
  });

  // clouds: rounded lobes, pink and lilac on top, gold underneath; thicker at their edges
  for (const [i, cl] of L.clouds.entries()) {
    const r = rng(100 + i);
    const cx = X(cl.x), cy = Y(cl.y), rx = X(cl.rx), ry = Y(cl.ry);
    const lobes = [];
    const nL = 5 + Math.floor(r() * 4);
    for (let j = 0; j < nL; j++) {
      const t = (j + 0.5) / nL;
      const lr = ry * (0.55 + Math.sin(Math.PI * t) * 0.65) * (0.8 + r() * 0.4);
      lobes.push([cx - rx + t * 2 * rx + (r() - 0.5) * rx * 0.15, cy - Math.sin(Math.PI * t) * ry * 0.35 + (r() - 0.5) * ry * 0.2, lr]);
    }
    ctx.save();
    ctx.filter = `blur(${10 * k}px)`;
    for (const [lx, ly, lr] of lobes) glaze(ctx, lx, ly, lr * 1.25, lr, hex(cl.col), 0.75);
    glaze(ctx, cx, cy + ry * 0.25, rx * 1.05, ry * 0.45, hex(cl.col), 0.7);
    ctx.restore();
    const n = (cl.strokes ?? 260) * 2.2 * (W / 2400);
    for (let j = 0; j < n; j++) {
      const [lx, ly, lr] = lobes[Math.floor(r() * lobes.length)];
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.78;
      const x = lx + Math.cos(a) * lr * 1.25 * d, y = ly + Math.sin(a) * lr * d;
      const under = clamp((y - (ly - lr)) / (2 * lr));
      let col = mix(hex(cl.top ?? "#e4a9bb"), hex(cl.col), clamp(under * 1.4));
      col = mix(col, hex("#ffe6c4"), clamp(under - 0.55) * 1.6 * (cl.glow ?? 1));
      col = mix(col, hex(cl.shade), clamp(0.35 - under) * 0.5);
      const tilt = Math.cos(a) * -Math.sin(a) * 0.35 + (r() - 0.5) * 0.15;
      PAINT.th = 0.12 + d * 0.3; // a little body where the cloud edges catch light
      const [c] = calm(x, y);
      stroke(ctx, r, x - 20 * k, y, tilt, (40 + r() * 80) * k, (9 + r() * 14) * k, col, (0.3 + r() * 0.3) * (1 - c * 0.5), 3);
    }
    PAINT.th = 0.4;
  }

  // the low sun behind the hills
  {
    const g = ctx.createRadialGradient(X(L.sun[0]), Y(L.sun[1]), 0, X(L.sun[0]), Y(L.sun[1]), X(0.42));
    g.addColorStop(0, "rgba(255,244,214,0.85)");
    g.addColorStop(0.35, "rgba(255,226,190,0.35)");
    g.addColorStop(1, "rgba(255,226,190,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, Y(L.skyEnd + 0.15));
  }

  // distant ranges: thin, hazy
  const far1 = ridgeFn(L.far1, 0.02, 1.4, 11);
  form({
    seed: 11, path: landPath(far1, Y(L.skyEnd + 0.2)), bbox: [0, Y(L.far1[0][1] - 0.08), W, Y(L.skyEnd + 0.2)],
    color: hillColor(far1, [[0, "#cdb4c4"], [1, "#bba9bd"]], 0.1, { haze: 0.25, alt: "#c4b0c6" }),
    angle: hillAngle(far1, 0.9), len: [40, 90], width: [9, 16], alpha: [0.25, 0.45], cover: 1, vary: 0.06, soft: 3, thick: () => 0.12,
  });
  const far2 = ridgeFn(L.far2, 0.018, 1.8, 12);
  form({
    seed: 12, path: landPath(far2, Y(L.skyEnd + 0.25)), bbox: [0, Y(L.far2[0][1] - 0.06), W, Y(L.skyEnd + 0.25)],
    color: hillColor(far2, [[0, "#c7c7ad"], [1, "#a9b293"]], 0.12, { haze: 0.22, alt: "#b7bda0" }),
    angle: hillAngle(far2, 0.9), len: [45, 100], width: [10, 18], alpha: [0.3, 0.5], cover: 1.1, vary: 0.08, soft: 3, thick: () => 0.16,
  });
  {
    const r = rng(13);
    for (let i = 0; i < 70 * (W / 2400); i++) {
      const x = r() * W;
      if (r() < 0.5) continue;
      const s = (5 + r() * 9) * k;
      glaze(ctx, x, far2(x) + 4 * k - s * 0.6, s * 0.7, s, mix(hex("#8e9a7e"), hex("#f3d9cc"), 0.3), 0.6);
    }
  }

  // middle rolling hills
  const midL = moundTop(L.midL[0], L.midL[1], L.midL[2], L.midL[3], 21);
  const midR = moundTop(L.midR[0], L.midR[1], L.midR[2], L.midR[3], 22);
  for (const [i, top] of [midR, midL].entries()) {
    form({
      seed: 21 + i, path: landPath(top, Y(L.skyEnd + 0.45)), bbox: [0, Y(L.midL[1] - 0.04), W, Y(L.skyEnd + 0.45)],
      color: hillColor(top, [[0, "#b9c58f"], [0.5, "#a3b47c"], [1, "#8ea26c"]], 0.22, { haze: 0.1, alt: "#9cb07a" }),
      angle: hillAngle(top), len: [55, 120], width: [11, 20], alpha: [0.45, 0.7], cover: 1.15, vary: 0.12, thick: () => 0.28,
    });
  }
  for (const [i, t] of L.midTrees.entries()) {
    const top = t[0] < 0.5 ? midL : midR;
    tree(X(t[0]), top(X(t[0])) + 6 * k, t[1] * W, 300 + i, t[2] ?? "green");
  }

  // ================================================== the ground, top to bottom
  const PALETTES = {
    sage: [[0, "#c4cc93"], [0.3, "#a7b97c"], [0.7, "#7f9a62"], [1, "#5b7853"]],
    moss: [[0, "#c9ca86"], [0.3, "#adb872"], [0.7, "#86985a"], [1, "#5d744d"]],
    cool: [[0, "#bac895"], [0.32, "#98af7e"], [0.7, "#728d66"], [1, "#526d58"]],
  };
  for (const [i, m] of L.mounds.entries()) {
    const [, topf, , hf, depth, pal] = m;
    const top = moundTops[i];
    const bottom = Y(Math.min(3.06, topf + hf + 0.95));
    form({
      seed: 31 + i, path: landPath(top, bottom), bbox: [0, Y(topf - 0.01), W, bottom],
      color: hillColor(top, PALETTES[pal], depth, { alt: pal === "cool" ? "#86a27a" : "#9bb06e" }),
      angle: hillAngle(top, 0.45), len: [60, 140], width: [14, 26], alpha: [0.7, 0.92], cover: 1.7, vary: 0.16, spread: 0.55,
      accents: ["#d9b77a", "#e7b2a2", "#6f9a8a", "#c2cf7e"],
      grass: (x, y) => clamp((y - top(x)) / (depth * S) - 0.45) * 0.22,
      size: (x, y) => 0.75 + clamp(y / H) * 0.9,
      // paint gets thicker toward the viewer, and heaviest just under each lit crest
      thick: (x, y) => 0.3 + clamp(y / H) * 0.35 + (y - top(x) < 0.03 * S ? 0.2 : 0),
      knife: (x, y) => (y - top(x) < 0.04 * S ? 0.1 : 0.025),
    });
  }

  // ================================================== the path
  const pathPts = L.path;
  const pathAt = (yf) => {
    let i = 0;
    while (i < pathPts.length - 2 && yf > pathPts[i + 1][1]) i++;
    const p0 = pathPts[Math.max(0, i - 1)], p1 = pathPts[i], p2 = pathPts[i + 1], p3 = pathPts[Math.min(pathPts.length - 1, i + 2)];
    const t = clamp((yf - p1[1]) / (p2[1] - p1[1]));
    const cr = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
    return [cr(p0[0], p1[0], p2[0], p3[0]), lerp(p1[2], p2[2], t)];
  };
  {
    const yf0 = pathPts[0][1], yf1 = pathPts[pathPts.length - 1][1];
    const p = new Path2D();
    const L1 = [], R1 = [];
    for (let yf = yf0; yf <= yf1 + 1e-6; yf += 0.003) {
      const [xf, hw] = pathAt(yf);
      const wob = 0.004 * fbm(yf * 30, 2, 41);
      L1.push([X(xf - hw + wob), Y(yf)]);
      R1.push([X(xf + hw + wob * 0.6), Y(yf)]);
    }
    p.moveTo(L1[0][0], L1[0][1]);
    for (const q of L1) p.lineTo(q[0], q[1]);
    for (let i = R1.length - 1; i >= 0; i--) p.lineTo(R1[i][0], R1[i][1]);
    p.closePath();
    const ground = ctx.getImageData(0, 0, W, H).data;
    const lumAt = (x, y) => {
      const i = ((Math.round(clamp(y, 0, H - 1)) * W) + Math.round(clamp(x, 0, W - 1))) * 4;
      return (ground[i] * 0.3 + ground[i + 1] * 0.59 + ground[i + 2] * 0.11) / 255;
    };
    const sideX = (y, side) => { const [xf, hw] = pathAt(y / S); return X(xf + side * hw * 1.6); };
    form({
      seed: 51, path: p, bbox: [0, Y(yf0), W, Y(yf1)], soft: 2,
      color: (x, y) => {
        const [xf, hw] = pathAt(y / S);
        const across = clamp((x / W - (xf - hw)) / (2 * hw));
        let c = ramp([[0, "#e2c9a0"], [0.45, "#f3e4c6"], [1, "#cfb38c"]], across);
        c = mix(c, hex("#f7e6c9"), clamp(fbm(x / 200, y / 200, 7) + 0.2) * 0.3);
        const lum = (lumAt(sideX(y, -1), y) + lumAt(sideX(y, 1), y)) / 2;
        return mix(c, hex("#8d7a5e"), clamp((0.62 - lum) * 1.6) * 0.6);
      },
      angle: (x, y) => {
        const a = pathAt(y / S - 0.01)[0], b = pathAt(y / S + 0.01)[0];
        return Math.atan2(Y(0.02), X(b - a)) + Math.PI / 2 + fbm(x / 100, y / 100, 3) * 0.3;
      },
      len: [30, 70], width: [8, 16], alpha: [0.35, 0.6], cover: 1.4, vary: 0.1, spread: 0.6,
      size: (x, y) => 0.6 + (y / S) * 0.45,
      thick: (x, y) => {
        const [xf, hw] = pathAt(y / S);
        const edge = Math.abs(x / W - xf) / hw; // gravel heaped at the edges
        return 0.3 + clamp(edge - 0.6) * 0.9 + (y / H) * 0.2;
      },
    });
    const r = rng(52);
    withThickness(0.7, () => {
      for (let yf = yf0; yf < yf1; yf += 0.0025) {
        const [xf, hw] = pathAt(yf);
        for (const side of [-1, 1]) {
          if (r() < 0.4) continue;
          const x = X(xf + side * hw * (0.9 + r() * 0.2)), y = Y(yf);
          stroke(ctx, r, x, y, -Math.PI / 2 + side * 0.3 + (r() - 0.5) * 0.5, (14 + r() * 22) * k * (0.5 + yf * 0.4), (4 + r() * 4) * k, mix(hex("#7f9a5f"), WARM, r() * 0.2), 0.55, 1);
        }
      }
    });
  }

  // wet-into-wet: soften the colour without flattening the relief
  {
    const copy = createCanvas(W, H);
    copy.getContext("2d").drawImage(cv, 0, 0);
    ctx.save();
    ctx.filter = `blur(${2.2 * k}px)`;
    ctx.globalAlpha = 0.45;
    ctx.drawImage(copy, 0, 0);
    ctx.restore();
  }

  /** A short white picket fence. h is its height in px. */
  function fence(x0, x1, base, h, seed) {
    const r = rng(seed);
    ctx.save();
    ctx.filter = `blur(${8 * k}px)`;
    glaze(ctx, (x0 + x1) / 2 + h * 0.2, base + h * 0.05, (x1 - x0) * 0.55, h * 0.12, SHADOW, 0.3);
    ctx.restore();
    withThickness(0.9, () => {
      stroke(ctx, r, x0, base - h * 0.7, 0, x1 - x0, h * 0.08, hex("#ddd2bd"), 0.95, 2);
      stroke(ctx, r, x0, base - h * 0.3, 0, x1 - x0, h * 0.08, hex("#d6cab4"), 0.95, 2);
      for (let x = x0; x <= x1; x += h * 0.32) {
        const lit = clamp(0.8 - (x - x0) / (x1 - x0) * 0.4 + (r() - 0.5) * 0.2);
        knife(ctx, r, x - h * 0.06, base, -Math.PI / 2 + (r() - 0.5) * 0.04, h * (0.92 + r() * 0.08), h * 0.13, mix(hex("#cfc2aa"), hex("#fbf4e6"), lit));
        dab(ctx, x, base - h * 0.98, h * 0.065, h * 0.05, 0, mix(hex("#e9dfcc"), WARM, 0.3), 1);
      }
      for (let i = 0; i < (x1 - x0) / (h * 0.25); i++) stroke(ctx, r, lerp(x0, x1, r()), base, -Math.PI / 2 + (r() - 0.5) * 0.8, h * (0.25 + r() * 0.35), h * 0.07, ramp(GREEN_LEAVES, r()), 0.85, 1);
    });
  }

  /** Flowers and leaves edging both sides of the path between two heights. */
  function pathBorder(yf0, yf1, seed) {
    const r = rng(seed);
    withThickness(0.85, () => {
      for (let yf = yf0; yf < yf1; yf += 0.0045) {
        const [xf, hw] = pathAt(yf);
        for (const side of [-1, 1]) {
          if (r() < 0.45) continue;
          const x = X(xf + side * (hw + 0.006 + r() * 0.014)), y = Y(yf);
          const rr = (3 + yf * 7) * k * (0.8 + r() * 0.5);
          stroke(ctx, r, x, y + rr, -Math.PI / 2 + (r() - 0.5) * 1.6, rr * 2.4, rr * 0.7, ramp(GREEN_LEAVES, 0.3 + r() * 0.6), 0.85, 1);
          const kind = r();
          if (kind < 0.35) daisy(x, y, rr, r);
          else if (kind < 0.6) cosmos(x, y, rr, r);
          else if (kind < 0.75) spike(x, y + rr, rr * 4, r);
          else tinyFlower(x, y, rr * 0.6, r);
        }
      }
    });
  }

  // ---- scene 1 life: trees, cottage, fences, shrubs, dogs, leaves, flowers
  for (const [i, t] of L.trees1.entries()) {
    const top = tops.near;
    tree(X(t.x), t.y ? Y(t.y) : top(X(t.x)) + 6 * k, t.s * W, 410 + i, t.kind);
    if (t.leaves) fallenLeaves(X(t.x + 0.02), Y(t.leaves[0]), X(t.leaves[1]), Y(t.leaves[2]), t.leaves[3], 420 + i);
  }
  for (const [i, sb] of L.shrubs1.entries()) shrub(X(sb[0]), Y(sb[1]), sb[2] * W, 430 + i, sb[3] === "white" ? [[0, "#c9b9a6"], [0.5, "#efe6d8"], [1, "#fffaf0"]] : undefined, 90);
  cottage(X(L.cottage[0]), Y(L.cottage[1]), L.cottage[2] * W, 440);
  for (const [i, f] of (L.fences ?? []).entries()) fence(X(f[0]), X(f[1]), Y(f[2]), Y(f[3]), 445 + i);
  for (const b of L.borders ?? []) pathBorder(b[0], b[1], b[2]);
  for (const cl of L.clusters1) cluster(cl);
  for (const [i, d] of L.dogs.entries()) dog(X(d.x), Y(d.y), d.s * W, d.pose, d.coat, d.dir, 450 + i);
  if (L.ball) ball(X(L.ball[0]), Y(L.ball[1]), L.ball[2] * W);
  for (const fl of L.leaves1) fallenLeaves(X(fl[0]), Y(fl[1]), X(fl[2]), Y(fl[3]), fl[4], 460 + fl[4]);
  for (const g of L.grass1 ?? []) grassClump(X(g[0]), X(g[1]), Y(g[2]), Y(g[2] + 0.08), g[3], g[4], [60, 170]);

  // ---- scene 2: the shrub and flowers (landscape unchanged)
  shrub(X(L.shrub[0]), tops.shrubHill(X(L.shrub[0])) + Y(0.03), L.shrub[1] * W, 501);
  for (const cl of L.clusters2) cluster(cl);

  // ================================================== SCENE 3 — afternoon tea
  {
    const T = L.tea;
    // the shade tree, its dappled shade, and a few leaves already falling
    ctx.save();
    ctx.filter = `blur(${30 * k}px)`;
    glaze(ctx, X(T.tree[0] + 0.12), Y(T.tree[1] + 0.03), X(0.26), Y(0.07), SHADOW, 0.35);
    ctx.restore();
    {
      const r = rng(601);
      for (let i = 0; i < 26; i++) glaze(ctx, X(T.tree[0] + 0.12) + (r() - 0.5) * X(0.4), Y(T.tree[1] + 0.03) + (r() - 0.5) * Y(0.1), 26 * k, 12 * k, hex("#f6e7b8"), 0.25);
    }
    tree(X(T.tree[0]), Y(T.tree[1]), T.tree[2] * W, 610, "turning");
    fallenLeaves(X(T.tree[0] + 0.12), Y(T.tree[1] + 0.06), X(0.18), Y(0.04), 40, 611);
    for (const cl of L.clusters3) cluster(cl);
    hedgeWithGate(X(T.hedge[0]), X(T.hedge[1]), Y(T.hedge[2]), Y(T.hedge[3]), X(T.gate[0]), X(T.gate[1]), 620);
    signPost(X(T.post[0]), Y(T.post[1]), Y(T.sign.y), X(T.post[2]), 630);
    anchors.sign = { x: T.sign.x, y: +(T.sign.y - 2).toFixed(4), w: T.sign.w };
    if (T.chairBack) gardenChair(X(T.chairBack[0]), Y(T.chairBack[1]), T.chairBack[2] * W, -1, 640);
    teaTable(X(T.table[0]), Y(T.table[1]), T.table[2] * W, 650);
    if (T.chairFront) gardenChair(X(T.chairFront[0]), Y(T.chairFront[1]), T.chairFront[2] * W, 1, 641);
    for (const fg of L.foreground) grassClump(X(fg[0]), X(fg[1]), Y(fg[2]), Y(3.02), fg[3], fg[4]);
    for (const cl of L.clustersFront) cluster(cl);
  }

  // ================================================== light, relief, surface
  lightRelief(cv, hcv, W, H, 1);
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  const lg = ctx.createLinearGradient(0, 0, W, H * 0.35);
  lg.addColorStop(0, "rgba(255,214,170,0.45)");
  lg.addColorStop(1, "rgba(255,214,170,0)");
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, W, H);
  const sg = ctx.createLinearGradient(0, 0, W, 0);
  sg.addColorStop(0, "rgba(40,50,35,0.3)");
  sg.addColorStop(0.1, "rgba(40,50,35,0)");
  sg.addColorStop(0.9, "rgba(40,50,35,0)");
  sg.addColorStop(1, "rgba(40,50,35,0.3)");
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  PAINT.hx = null;
  return { cv, anchors };
}

// ---------------------------------------------------------------- the wooden sign (separate, interactive)

/** The hanging board for "Explore My Work": ropes, two planks, painted with a knife. */
function paintSign() {
  const W = 760, H = 470;
  const cv = createCanvas(W, H);
  const ctx = cv.getContext("2d");
  const hcv = createCanvas(W, H);
  const hx = hcv.getContext("2d");
  PAINT.hx = hx;
  const r = rng(901);
  withThickness(1, () => {
    // ropes
    for (const rx of [190, 570]) {
      for (let i = 0; i < 3; i++) stroke(ctx, r, rx + (i - 1) * 3, 0, Math.PI / 2 + (r() - 0.5) * 0.04, 108, 7, mix(hex("#b89b74"), i === 0 ? WARM : SHADOW, 0.2), 1, 2);
    }
    // board shape
    const board = new Path2D();
    board.roundRect(40, 100, 680, 330, 34);
    ctx.save();
    ctx.shadowColor = "rgba(40,30,20,0.35)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = rgba(hex("#9a734f"));
    ctx.fill(board);
    ctx.restore();
    hx.fillStyle = grey(140);
    hx.fill(board);
    ctx.save();
    ctx.clip(board);
    hx.save();
    hx.clip(board);
    // two planks, knife-laid along the grain, lighter where the sun reaches
    for (const [py, ph] of [[100, 168], [268, 162]]) {
      for (let i = 0; i < 120; i++) {
        const x = 30 + r() * 700, y = py + 8 + r() * (ph - 16);
        const lit = clamp(0.7 - (x - 40) / 900 - (y - 100) / 900 + (r() - 0.5) * 0.3);
        knife(ctx, r, x - 60, y, (r() - 0.5) * 0.04, 80 + r() * 140, 10 + r() * 14, ramp([[0, "#7a5638"], [0.5, "#a37a54"], [1, "#d1a978"]], lit));
      }
      // grain streaks
      for (let i = 0; i < 18; i++) {
        const y = py + 10 + r() * (ph - 20);
        stroke(ctx, r, 40, y, (r() - 0.5) * 0.02, 680, 2.5, hex("#6c4b31"), 0.35, 0);
      }
      // seam shadow
      stroke(ctx, r, 40, py + ph - 2, 0, 680, 7, hex("#4d3524"), 0.75, 0);
    }
    // a lighter, smoother painted panel in the middle for the lettering
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = rgba(hex("#e7cfa6"));
    ctx.beginPath();
    ctx.ellipse(380, 268, 300, 112, 0, 0, Math.PI * 2);
    ctx.filter = "blur(14px)";
    ctx.fill();
    ctx.restore();
    ctx.restore();
    hx.restore();
    // edge highlight and nails
    ctx.lineWidth = 6;
    ctx.strokeStyle = rgba(hex("#c9a274"), 0.7);
    ctx.stroke(board);
    hx.lineWidth = 8;
    hx.strokeStyle = grey(200);
    hx.stroke(board);
    for (const nx of [190, 570]) dab(ctx, nx, 122, 9, 9, 0, hex("#4a4038"), 1);
    // ivy and a small posy tucked at the top-left corner
    for (let i = 0; i < 22; i++) stroke(ctx, r, 40 + r() * 150, 92 + r() * 60, r() * 6.28, 30, 14, ramp([[0, "#3f5a3c"], [0.6, "#5f7d4f"], [1, "#9cb36b"]], r()), 0.95, 1);
  });
  lightRelief(cv, hcv, W, H, 1.2);
  PAINT.hx = null;
  return cv;
}

/** A small flower that sits on the sign's corner and responds when the sign is hovered. */
function paintSignFlower() {
  const W = 200, H = 200;
  const cv = createCanvas(W, H);
  const ctx = cv.getContext("2d");
  const hcv = createCanvas(W, H);
  PAINT.hx = hcv.getContext("2d");
  const r = rng(911);
  withThickness(1, () => {
    for (let i = 0; i < 5; i++) stroke(ctx, r, 100, 100, (i / 5) * Math.PI * 2 + 0.6, 70, 26, ramp([[0, "#5f7d4f"], [1, "#9cb36b"]], r()), 0.95, 2);
    const base = hex("#eba3a6");
    for (let i = 0; i < 8; i++) stroke(ctx, r, 100, 100, (i / 8) * Math.PI * 2, 62, 40, mix(base, i < 4 ? WARM : hex("#d9827f"), 0.3), 0.97, 3);
    dab(ctx, 100, 100, 18, 17, 0, hex("#e3b04f"), 1);
    dab(ctx, 94, 94, 8, 7, 0, hex("#f8dc8a"), 1);
  });
  lightRelief(cv, hcv, W, H, 1.2);
  PAINT.hx = null;
  return cv;
}

// ---------------------------------------------------------------- layouts

// Landscape: 2400 × 1800 per scene (4:3). Portrait: 1080 × 2340 per scene.
// x is a fraction of the width; y a fraction of ONE scene's height, 0–3 down the painting.
const DESKTOP = {
  name: "desktop", W: 2400, S: 1800, k: 1,
  layout: {
    // less sky: the horizon is higher and the land fills the lower half; the title sits
    // at the centre of the first view (≈ 0.33–0.5 of scene 1) on quiet sky and soft hills
    skyStops: [[0, "#e3a5b4"], [0.16, "#eab1b6"], [0.3, "#f0c0b5"], [0.4, "#f6d0bb"], [0.46, "#fadfc6"], [0.54, "#fbe7d0"]],
    skyEnd: 0.56,
    sun: [0.6, 0.47],
    clouds: [
      { x: 0.15, y: 0.13, rx: 0.17, ry: 0.05, col: "#efb5b8", shade: "#d98f9a", strokes: 280 },
      { x: 0.85, y: 0.08, rx: 0.2, ry: 0.065, col: "#f1bdb8", shade: "#d9929d", strokes: 380 },
      { x: 0.5, y: 0.035, rx: 0.12, ry: 0.02, col: "#f3c4bd", shade: "#e4a1a6", strokes: 120 },
      { x: 0.08, y: 0.35, rx: 0.1, ry: 0.014, col: "#f7d3bf", shade: "#eab0a4", strokes: 90 },
      { x: 0.92, y: 0.37, rx: 0.09, ry: 0.013, col: "#f9dcc4", shade: "#eab0a4", strokes: 80, glow: 1.4 },
    ],
    far1: [[0, 0.465], [0.22, 0.44], [0.45, 0.46], [0.7, 0.435], [1, 0.455]],
    far2: [[0, 0.495], [0.3, 0.48], [0.55, 0.5], [0.8, 0.485], [1, 0.495]],
    midL: [0.2, 0.505, 0.42, 0.04],
    midR: [0.82, 0.52, 0.4, 0.04],
    midTrees: [[0.36, 0.008], [0.39, 0.006], [0.66, 0.007], [0.7, 0.006]],
    // [centre x, crest y, half-width, height, shade depth, palette, name]
    mounds: [
      [0.5, 0.555, 0.85, 0.035, 0.32, "sage", "near"],
      [0.95, 0.66, 0.3, 0.06, 0.2, "moss"],
      [0.06, 0.91, 0.38, 0.08, 0.22, "moss"],
      [0.7, 1.0, 0.38, 0.13, 0.26, "cool"],
      [0.32, 1.3, 0.3, 0.12, 0.24, "sage"],
      [0.9, 1.28, 0.26, 0.14, 0.28, "moss", "shrubHill"],
      [0.06, 1.58, 0.34, 0.14, 0.3, "sage"],
      [0.6, 1.66, 0.36, 0.13, 0.28, "cool"],
      [0.22, 1.9, 0.38, 0.12, 0.26, "moss"],
      [0.85, 1.93, 0.34, 0.13, 0.26, "sage"],
      [0.5, 2.18, 0.95, 0.04, 0.7, "moss"],
    ],
    // the path leaves the cottage door, winds down the hills, and ends at the garden gate
    path: [[0.15, 0.594, 0.008], [0.24, 0.63, 0.01], [0.36, 0.68, 0.013], [0.47, 0.76, 0.016], [0.54, 0.86, 0.02], [0.56, 0.97, 0.024], [0.6, 1.15, 0.034], [0.55, 1.35, 0.044], [0.5, 1.55, 0.055], [0.6, 1.75, 0.065], [0.55, 1.98, 0.07], [0.62, 2.16, 0.062], [0.72, 2.36, 0.056], [0.81, 2.55, 0.052], [0.85, 2.7, 0.05], [0.85, 2.78, 0.05]],
    cottage: [0.13, 0.598, 0.15],
    fences: [[0.2, 0.3, 0.622, 0.032]],
    trees1: [
      { x: 0.88, s: 0.095, kind: "autumn", leaves: [0.655, 0.09, 0.02, 70], y: 0.65 },
      { x: 0.03, s: 0.05, kind: "autumn", leaves: [0.6, 0.04, 0.01, 25], y: 0.59 },
      { x: 0.33, s: 0.03, kind: "turning", y: 0.565 },
      { x: 0.62, s: 0.036, kind: "autumn", leaves: [0.605, 0.04, 0.01, 20], y: 0.6 },
    ],
    shrubs1: [[0.06, 0.625, 0.035, "pink"], [0.22, 0.612, 0.03, "white"], [0.45, 0.62, 0.028, "pink"], [0.72, 0.645, 0.032, "white"], [0.97, 0.69, 0.04, "pink"]],
    dogs: [
      { x: 0.6, y: 0.78, s: 0.068, pose: "trot", coat: ["#c9935e", "#7a5234", "#f0d3a8"], dir: 1 },
      { x: 0.77, y: 0.76, s: 0.062, pose: "bow", coat: ["#f3e6cf", "#b59c7c", "#fffaf0"], dir: -1 },
      { x: 0.69, y: 0.845, s: 0.058, pose: "sit", coat: ["#6b5243", "#3b2c24", "#e9dccb"], dir: 1 },
    ],
    ball: [0.68, 0.772, 0.009],
    leaves1: [[0.5, 0.9, 0.4, 0.05, 50], [0.4, 0.72, 0.08, 0.03, 14], [0.3, 0.95, 0.2, 0.03, 20]],
    clusters1: [
      { seed: 701, x: 0.26, y: 0.645, rx: 0.05, ry: 0.012, n: 30, size: [4, 7], kinds: ["cosmos", "daisy", "tiny"] },
      { seed: 702, x: 0.12, y: 0.94, rx: 0.12, ry: 0.04, n: 70, size: [9, 16], kinds: ["daisy", "cosmos", "tiny", "spike"], foliage: true, stems: true },
      { seed: 703, x: 0.9, y: 0.95, rx: 0.1, ry: 0.035, n: 60, size: [9, 16], kinds: ["daisy", "daisy", "tiny", "cosmos"], foliage: true, stems: true },
      { seed: 704, x: 0.45, y: 0.69, rx: 0.1, ry: 0.015, n: 50, size: [2.5, 4.5], kinds: ["tiny"] },
      { seed: 705, x: 0.84, y: 0.87, rx: 0.1, ry: 0.02, n: 50, size: [3, 6], kinds: ["tiny", "daisy"] },
      { seed: 706, x: 0.3, y: 0.8, rx: 0.1, ry: 0.03, n: 45, size: [6, 11], kinds: ["cosmos", "daisy", "tiny"], foliage: true },
    ],
    borders: [[0.6, 0.95, 607]],
    grass1: [[-0.02, 0.2, 0.92, 120, 811], [0.8, 1.02, 0.93, 110, 812]],
    shrub: [0.84, 0.075],
    clusters2: [
      { seed: 711, x: 0.66, y: 1.6, rx: 0.06, ry: 0.035, n: 40, size: [6, 11], kinds: ["cosmos", "cosmos", "daisy", "tiny"], foliage: true },
      { seed: 712, x: 0.22, y: 1.86, rx: 0.12, ry: 0.06, n: 70, size: [8, 15], kinds: ["daisy", "daisy", "daisy", "tiny"], foliage: true },
      { seed: 713, x: 0.9, y: 1.62, rx: 0.06, ry: 0.05, n: 28, size: [8, 14], kinds: ["spike", "daisy", "tiny"] },
      { seed: 714, x: 0.42, y: 1.45, rx: 0.12, ry: 0.025, n: 90, size: [2.5, 5], kinds: ["tiny"] },
      { seed: 715, x: 0.75, y: 1.82, rx: 0.1, ry: 0.03, n: 70, size: [3, 6], kinds: ["tiny", "daisy"] },
    ],
    // scene 2 notes: on which hill, where along it, how far below the crest
    phrases: [
      { mound: 3, x: 0.78, dy: 0.065, span: 0.4, lines: 2, gap: 0.042, bend: 0.7, maxTilt: 8 },
      { mound: 4, x: 0.24, dy: 0.06, span: 0.4, lines: 2, gap: 0.042, bend: 0.7, maxTilt: 8 },
      { mound: 7, x: 0.79, dy: 0.06, span: 0.4, lines: 2, gap: 0.042, bend: 0.7, maxTilt: 8 },
    ],
    phraseZone: [0.22, 0.07],
    tea: {
      tree: [0.11, 2.6, 0.17],
      table: [0.37, 2.57, 0.16],
      chairBack: [0.585, 2.63, 0.13],
      chairFront: null,
      hedge: [0.66, 1.06, 2.72, 2.9],
      gate: [0.79, 0.92],
      post: [0.965, 2.74, 0.77],
      sign: { x: 0.865, y: 2.43, w: 0.17 },
    },
    clusters3: [
      { seed: 721, x: 0.37, y: 2.82, rx: 0.2, ry: 0.035, n: 80, size: [12, 20], kinds: ["daisy", "cosmos", "tiny", "spike"], foliage: true, stems: true },
      { seed: 722, x: 0.45, y: 2.16, rx: 0.1, ry: 0.02, n: 40, size: [4, 8], kinds: ["tiny", "daisy"] },
      { seed: 723, x: 0.6, y: 2.4, rx: 0.05, ry: 0.025, n: 30, size: [7, 12], kinds: ["cosmos", "daisy"], foliage: true },
    ],
    foreground: [[-0.02, 0.2, 2.86, 220, 801]],
    clustersFront: [
      { seed: 731, x: 0.1, y: 2.94, rx: 0.1, ry: 0.035, n: 40, size: [16, 28], kinds: ["daisy", "cosmos", "daisy"], stems: true, foliage: true, th: 1 },
      { seed: 732, x: 0.88, y: 2.95, rx: 0.1, ry: 0.035, n: 36, size: [16, 28], kinds: ["daisy", "cosmos", "spike"], stems: true, foliage: true, th: 1 },
    ],
    zones: [
      { x: 0.5, y: 0.41, rx: 0.36, ry: 0.11, amt: 0.6 }, // title
      { x: 0.74, y: 2.11, rx: 0.24, ry: 0.05, light: "#d6dfae", amt: 0.55 }, // invitation
    ],
  },
};

const MOBILE = {
  name: "mobile", W: 1080, S: 2340, k: 0.75,
  layout: {
    ...DESKTOP.layout,
    skyStops: [[0, "#e3a5b4"], [0.18, "#eab1b6"], [0.32, "#f0c0b5"], [0.42, "#f6d0bb"], [0.48, "#fadfc6"], [0.56, "#fbe7d0"]],
    skyEnd: 0.58,
    sun: [0.58, 0.5],
    clouds: [
      { x: 0.2, y: 0.16, rx: 0.32, ry: 0.03, col: "#efb5b8", shade: "#d98f9a", strokes: 200 },
      { x: 0.82, y: 0.08, rx: 0.32, ry: 0.045, col: "#f1bdb8", shade: "#d9929d", strokes: 240 },
      { x: 0.6, y: 0.3, rx: 0.25, ry: 0.012, col: "#f6c9b4", shade: "#e8a69a", strokes: 90 },
    ],
    far1: [[0, 0.5], [0.4, 0.485], [0.7, 0.5], [1, 0.485]],
    far2: [[0, 0.53], [0.5, 0.52], [1, 0.535]],
    midL: [0.15, 0.545, 0.55, 0.03],
    midR: [0.9, 0.56, 0.5, 0.03],
    midTrees: [[0.36, 0.014]],
    mounds: [
      [0.5, 0.59, 1.0, 0.03, 0.3, "sage", "near"],
      [1.0, 0.7, 0.45, 0.05, 0.2, "moss"],
      [0.0, 0.88, 0.55, 0.08, 0.22, "moss"],
      [0.9, 1.02, 0.55, 0.1, 0.26, "cool"],
      [0.2, 1.32, 0.5, 0.09, 0.24, "sage"],
      [1.0, 1.32, 0.4, 0.11, 0.28, "moss", "shrubHill"],
      [0.0, 1.6, 0.5, 0.11, 0.3, "sage"],
      [0.75, 1.68, 0.55, 0.1, 0.28, "cool"],
      [0.12, 1.9, 0.55, 0.09, 0.26, "moss"],
      [0.95, 1.94, 0.5, 0.1, 0.26, "sage"],
      [0.5, 2.18, 1.2, 0.03, 0.7, "moss"],
    ],
    path: [[0.3, 0.712, 0.012], [0.42, 0.76, 0.016], [0.55, 0.84, 0.022], [0.52, 0.92, 0.026], [0.5, 0.97, 0.028], [0.4, 1.15, 0.038], [0.42, 1.35, 0.048], [0.58, 1.55, 0.058], [0.62, 1.75, 0.066], [0.54, 1.98, 0.074], [0.56, 2.12, 0.07], [0.62, 2.32, 0.066], [0.7, 2.52, 0.062], [0.73, 2.7, 0.06], [0.73, 2.78, 0.06]],
    cottage: [0.25, 0.712, 0.32],
    fences: [[0.42, 0.56, 0.728, 0.022]],
    trees1: [
      { x: 0.88, s: 0.13, kind: "autumn", leaves: [0.75, 0.12, 0.015, 40], y: 0.745 },
      { x: 0.6, s: 0.04, kind: "turning", y: 0.63 },
    ],
    shrubs1: [[0.06, 0.725, 0.08, "pink"], [0.47, 0.705, 0.06, "white"], [0.97, 0.79, 0.07, "pink"]],
    dogs: [
      { x: 0.38, y: 0.84, s: 0.15, pose: "trot", coat: ["#c9935e", "#7a5234", "#f0d3a8"], dir: 1 },
      { x: 0.78, y: 0.83, s: 0.14, pose: "bow", coat: ["#f3e6cf", "#b59c7c", "#fffaf0"], dir: -1 },
      { x: 0.6, y: 0.895, s: 0.13, pose: "sit", coat: ["#6b5243", "#3b2c24", "#e9dccb"], dir: 1 },
    ],
    ball: [0.6, 0.835, 0.014],
    leaves1: [[0.5, 0.94, 0.45, 0.03, 30], [0.7, 0.78, 0.15, 0.02, 12]],
    clusters1: [
      { seed: 701, x: 0.2, y: 0.77, rx: 0.14, ry: 0.01, n: 24, size: [5, 8], kinds: ["cosmos", "daisy", "tiny"] },
      { seed: 702, x: 0.14, y: 0.95, rx: 0.16, ry: 0.03, n: 40, size: [10, 16], kinds: ["daisy", "cosmos", "tiny"], foliage: true, stems: true },
      { seed: 703, x: 0.88, y: 0.96, rx: 0.14, ry: 0.03, n: 34, size: [10, 16], kinds: ["daisy", "tiny", "cosmos"], foliage: true, stems: true },
      { seed: 706, x: 0.7, y: 0.76, rx: 0.12, ry: 0.015, n: 30, size: [3, 6], kinds: ["tiny"] },
    ],
    borders: [[0.73, 0.95, 607]],
    grass1: [[-0.05, 0.25, 0.93, 70, 811], [0.75, 1.05, 0.95, 60, 812]],
    shrub: [0.86, 0.15],
    clusters2: [
      { seed: 711, x: 0.74, y: 1.62, rx: 0.12, ry: 0.03, n: 30, size: [8, 13], kinds: ["cosmos", "cosmos", "daisy", "tiny"], foliage: true },
      { seed: 712, x: 0.2, y: 1.84, rx: 0.2, ry: 0.05, n: 45, size: [10, 17], kinds: ["daisy", "daisy", "tiny"], foliage: true },
    ],
    phrases: [
      { mound: 3, x: 0.52, dy: 0.1, span: 0.86, lines: 2, gap: 0.038, bend: 0.6, maxTilt: 5 },
      { mound: 4, x: 0.5, dy: 0.05, span: 0.86, lines: 2, gap: 0.038, bend: 0.6, maxTilt: 5 },
      { mound: 7, x: 0.5, dy: 0.055, span: 0.86, lines: 2, gap: 0.038, bend: 0.6, maxTilt: 5 },
    ],
    phraseZone: [0.5, 0.06],
    tea: {
      tree: [0.14, 2.44, 0.24],
      table: [0.36, 2.52, 0.27],
      chairBack: null,
      chairFront: null,
      hedge: [0.4, 1.1, 2.76, 2.88],
      gate: [0.6, 0.86],
      post: [0.95, 2.78, 0.6],
      sign: { x: 0.74, y: 2.57, w: 0.36 },
    },
    clusters3: [
      { seed: 721, x: 0.3, y: 2.66, rx: 0.26, ry: 0.025, n: 40, size: [12, 20], kinds: ["daisy", "cosmos", "tiny"], foliage: true, stems: true },
    ],
    foreground: [[-0.05, 0.3, 2.92, 120, 801]],
    clustersFront: [
      { seed: 731, x: 0.15, y: 2.96, rx: 0.15, ry: 0.025, n: 18, size: [18, 28], kinds: ["daisy", "cosmos"], stems: true, foliage: true, th: 1 },
    ],
    zones: [
      { x: 0.5, y: 0.5, rx: 0.5, ry: 0.09, amt: 0.6 },
      { x: 0.5, y: 2.13, rx: 0.5, ry: 0.05, light: "#d6dfae", amt: 0.55 },
    ],
  },
};

// ---------------------------------------------------------------- output

fs.mkdirSync(PREVIEW ? PREVIEW_DIR : OUT, { recursive: true });
const allAnchors = fs.existsSync(ANCHORS) ? JSON.parse(fs.readFileSync(ANCHORS, "utf8")) : {};
for (const F of [DESKTOP, MOBILE]) {
  if (ONLY && ONLY !== F.name) continue;
  const t0 = Date.now();
  const { cv, anchors } = paint(F);
  allAnchors[F.name] = anchors;
  if (PREVIEW) {
    const w = Math.round(F.W / 3), h = F.S;
    const pv = createCanvas(w, h);
    pv.getContext("2d").drawImage(cv, 0, 0, w, h);
    fs.writeFileSync(path.join(PREVIEW_DIR, `preview-${F.name}.jpg`), pv.toBuffer("image/jpeg", 85));
  } else {
    const widths = F.name === "desktop" ? [2400, 1600] : [1080, 720];
    for (const s of [1, 2, 3]) {
      for (const w of widths) {
        const h = Math.round((F.S * w) / F.W);
        const out = createCanvas(w, h);
        const oc = out.getContext("2d");
        oc.imageSmoothingQuality = "high";
        oc.drawImage(cv, 0, F.S * (s - 1), F.W, F.S, 0, 0, w, h);
        fs.writeFileSync(path.join(OUT, `scene-${s}-${F.name}-${w}.webp`), out.toBuffer("image/webp", 88));
      }
    }
  }
  console.log(`${F.name}: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
if (!PREVIEW && !ONLY) {
  fs.writeFileSync(path.join(OUT, "sign.webp"), paintSign().toBuffer("image/webp", 90));
  fs.writeFileSync(path.join(OUT, "sign-flower.webp"), paintSignFlower().toBuffer("image/webp", 90));
}
if (!PREVIEW) fs.writeFileSync(ANCHORS, JSON.stringify(allAnchors, null, 2) + "\n");
