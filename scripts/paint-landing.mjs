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
//   node scripts/paint-landing.mjs --work            → the Work page garden, sprites and anchors
//   node scripts/paint-landing.mjs --journal         → the case-study page backdrop
//   node scripts/paint-landing.mjs --title           → the Landing title, one painted layer per letter
//   node scripts/paint-landing.mjs --butterfly       → the Landing butterfly cursor (wings and body layers)
//   node scripts/paint-landing.mjs --lamp            → the Scene 1 lamppost (off and lit)
//   node scripts/paint-landing.mjs --refine          → the navigation wash and the About ornaments and portrait mat

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
  const H = F.H ?? S * 3;
  const cv = createCanvas(W, H);
  let ctx = cv.getContext("2d");
  const hcv = createCanvas(W, H);
  const hx = hcv.getContext("2d");
  primeCanvas(hx, W, H);
  PAINT.hx = hx;
  const X = (f) => f * W;
  const Y = (f) => f * S;
  const L = F.layout;
  const FRONT_POSES = ["turn", "phone", "phone-up", "selfie"]; // the girl turned to the viewer
  const PHONE_TIPS = {}; // where her phone's top ends up, per pose (for the selfie flash)

  // ---- separate, animatable layers --------------------------------------
  // Dogs, grass tufts and the rocking chair are painted onto their own
  // transparent canvases (same brushes, same relief lighting) and are NOT
  // painted into the scene, so they can move without leaving a copy behind.
  const sprites = [];
  function sprite(name, scene, bx, by, bw, bh, pivot, fn, meta = {}) {
    const w = Math.ceil(bw), h = Math.ceil(bh);
    const scv = createCanvas(w, h), shcv = createCanvas(w, h);
    const sctx = scv.getContext("2d"), shx = shcv.getContext("2d");
    sctx.translate(-bx, -by);
    shx.translate(-bx, -by);
    const prev = ctx, prevH = PAINT.hx;
    ctx = sctx;
    PAINT.hx = shx;
    try { fn(); } finally { ctx = prev; PAINT.hx = prevH; }
    lightRelief(scv, shcv, w, h, 1);
    sprites.push({
      name, scene, ...meta,
      x: +(bx / W).toFixed(5), y: +(by / S - (scene - 1)).toFixed(5), w: +(bw / W).toFixed(5), h: +(bh / S).toFixed(5),
      pivot: pivot.map((v) => +v.toFixed(4)), canvas: scv,
    });
  }

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
  // Each line of each note rests just above a real, visible hill edge: its
  // baseline is that hill's crest line (lightly smoothed), raised by a small gap
  // (plus a line height for an upper row), so the words sit in the shaded hollow
  // behind the crest and follow its exact curve. Paths are in scene-2 pixels.
  const NF = L.noteFont;
  for (const ph of L.phrases) {
    const lines = ph.lines.map(({ mound, x0, x1, row }) => {
      const top = moundTops[mound];
      const n = 64, raw = [];
      for (let i = 0; i <= n; i++) {
        const x = lerp(X(x0), X(x1), i / n);
        raw.push([x, top(x) - NF * 0.2 - row * NF * 1.08]);
      }
      const pts = raw.map(([x], i) => {
        let sum = 0, c = 0;
        for (let j = Math.max(0, i - 3); j <= Math.min(n, i + 3); j++) { sum += raw[j][1]; c++; }
        return `${x.toFixed(1)} ${(sum / c - S).toFixed(1)}`;
      });
      return `M${pts.join(" L")}`;
    });
    anchors.phrases.push({ lines });
  }
  anchors.noteFont = NF;
  anchors.viewBox = [W, S];

  // calm zones: thinner, lighter paint where words sit
  const zones = [
    ...L.zones.map((z) => ({ cx: X(z.x), cy: Y(z.y), rx: X(z.rx), ry: Y(z.ry), light: z.light && hex(z.light), amt: z.amt })),
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
  function dog(x, y, s, pose, coat, dir, seed, parts = "all") {
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
    if (parts === "all" || parts === "shadow") glaze(ctx, x, y + s * 0.02, s * 0.5, s * 0.07, SHADOW, 0.3);
    if (parts === "shadow") return;
    withThickness(0.95, () => {
      // legs (far ones a little darker), then the tail
      ctx.lineCap = "round";
      if (parts !== "tail") P.legs.forEach(([ax, ay, bx, by], i) => {
        ctx.beginPath();
        ctx.moveTo(px(ax), py(ay));
        ctx.lineTo(px(bx), py(by));
        ctx.strokeStyle = rgba(i % 2 ? mix(base, darkC, 0.35) : base);
        ctx.lineWidth = s * 0.075;
        ctx.stroke();
        dab(ctx, px(bx + 0.02), py(by - 0.01), s * 0.045, s * 0.025, 0, mix(base, lightC, 0.3), 1);
      });
      const [t0, t1, t2] = P.tail;
      if (parts !== "body") {
      ctx.beginPath();
      ctx.moveTo(px(t0[0]), py(t0[1]));
      ctx.quadraticCurveTo(px(t1[0]), py(t1[1]), px(t2[0]), py(t2[1]));
      ctx.strokeStyle = rgba(mix(base, darkC, 0.15));
      ctx.lineWidth = s * 0.055;
      ctx.stroke();
      if (PAINT.hx) {
        PAINT.hx.beginPath();
        PAINT.hx.moveTo(px(t0[0]), py(t0[1]));
        PAINT.hx.quadraticCurveTo(px(t1[0]), py(t1[1]), px(t2[0]), py(t2[1]));
        PAINT.hx.strokeStyle = grey(150);
        PAINT.hx.lineWidth = s * 0.05;
        PAINT.hx.stroke();
      }
      }
      if (parts === "tail") return;
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

  /** Where each pose's tail joins the body, in units of the dog's length. */
  const DOG_TAIL = { trot: [-0.28, -0.48], bow: [-0.28, -0.56], sit: [-0.24, -0.06] };

  /** A small red ball for the dogs. */
  const ball = (x, y, s, parts = "all") => withThickness(0.9, () => {
    if (parts !== "body") glaze(ctx, x + s * 0.3, y + s * 0.6, s * 1.1, s * 0.3, SHADOW, 0.3);
    if (parts === "shadow") return;
    dab(ctx, x, y, s, s, 0, hex("#c95a4e"), 1);
    dab(ctx, x - s * 0.3, y - s * 0.3, s * 0.35, s * 0.3, 0, hex("#f2a68f"), 0.9);
  });

  // ---- the tea table and its things
  function teaTable(cx, topY, R, seed, parts = "all") {
    const r = rng(seed);
    const ry = R * 0.32; // the round top in perspective
    const drop = R * 0.62; // how far the cloth hangs
    // shadow under the table on the grass
    if (parts !== "table") {
      ctx.save();
      ctx.filter = `blur(${14 * k}px)`;
      glaze(ctx, cx + R * 0.2, topY + drop + R * 0.12, R * 1.25, R * 0.22, SHADOW, 0.45);
      ctx.restore();
    }
    if (parts === "shadow") return;
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

      // a little vase of flowers, at the back right (painted first: furthest back)
      {
        const [x, y] = on(0.62, -0.62);
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
    });
  }

  /**
   * A painted wooden rocking chair seen from the side (three-quarter): its
   * runners curve front-to-back in the picture plane, so a rotation about the
   * point where they touch the ground reads as rocking forward and back. Cream
   * paint over wood, a slatted back, arms and a gingham cushion, in the same
   * knife slabs and bristle strokes as the table and gate. (x, y) is the
   * runners' ground contact; s is the chair's height; dir -1 faces left.
   */
  const ROCKER_R = 1.6;
  function rockingChair(x, y, s, dir, seed, parts = "chair") {
    const r = rng(seed);
    const R = ROCKER_R * s;
    if (parts === "shadow") {
      ctx.save();
      ctx.filter = `blur(${10 * k}px)`;
      glaze(ctx, x + s * 0.05, y + s * 0.01, s * 0.5, s * 0.05, SHADOW, 0.45);
      ctx.restore();
      return;
    }
    // u runs from the chair's front (-) to its back (+), v is height above the ground;
    // facing left (dir -1) the back is to the right, and the far side sits a little up and back
    const P = (u, v, far = 0) => [x - dir * u * s - dir * far * 0.07 * s, y - v * s - far * 0.05 * s];
    const runnerV = (u) => (R - Math.sqrt(Math.max(0, R * R - (u * s) ** 2))) / s;
    const paint = (lit) => mix(ramp([[0, "#a99c86"], [0.5, "#e6dcc8"], [1, "#fbf4e6"]], lit), WARM, lit * 0.1);
    withThickness(1, () => {
      const slab = ([ax, ay], [bx, by], lit, w = 0.055) => {
        const ang = Math.atan2(by - ay, bx - ax), len = Math.hypot(bx - ax, by - ay);
        knife(ctx, r, ax, ay, ang, len, w * s, paint(lit));
        stroke(ctx, r, ax, ay, ang, len, w * s * 0.25, paint(Math.min(1, lit + 0.3)), 0.7, 1);
      };
      const runner = (far, lit) => {
        for (let i = 0; i < 10; i++) {
          const u0 = -0.55 + i * 0.11, u1 = u0 + 0.13;
          slab(P(u0, runnerV(u0), far), P(u1, runnerV(u1), far), lit - Math.abs(u0) * 0.25, 0.05);
        }
      };
      const frame = (far) => {
        const lit = far ? 0.35 : 0.85;
        // front leg, back leg running up into the leaning back post
        slab(P(-0.3, runnerV(-0.3), far), P(-0.31, 0.5, far), lit, 0.06);
        slab(P(0.24, runnerV(0.24), far), P(0.3, 0.52, far), lit - 0.15, 0.06);
        slab(P(0.3, 0.5, far), P(0.42, 1.02, far), lit - 0.1, 0.06);
        // arm and its front support
        slab(P(0.34, 0.76, far), P(-0.34, 0.72, far), lit + 0.05, 0.05);
        slab(P(-0.31, 0.72, far), P(-0.3, 0.5, far), lit, 0.04);
      };
      // far side first (a little up and back, greyer)
      runner(1, 0.3);
      frame(1);
      // back slats spanning the two back posts
      for (let i = 0; i < 5; i++) {
        const t = 0.25 + i * 0.15;
        slab(P(0.3 + 0.12 * t, 0.52 + 0.5 * t, 0), P(0.3 + 0.12 * t, 0.52 + 0.5 * t, 1), 0.6 - i * 0.05, 0.035);
      }
      // seat: a slab seen from the side, its top catching the light
      const seat = new Path2D();
      const s0 = P(-0.36, 0.52, 0), s1 = P(0.32, 0.54, 0), s2 = P(0.32, 0.54, 1), s3 = P(-0.36, 0.52, 1);
      seat.moveTo(s0[0], s0[1]);
      seat.lineTo(s1[0], s1[1]);
      seat.lineTo(s2[0], s2[1]);
      seat.lineTo(s3[0], s3[1]);
      seat.closePath();
      ctx.fillStyle = rgba(paint(0.8));
      ctx.fill(seat);
      clipBoth(ctx, seat);
      for (let i = 0; i < 14; i++) knife(ctx, r, lerp(s0[0], s1[0], r()) - 0.1 * s, lerp(s0[1], s2[1], r()), dir > 0 ? 0 : Math.PI, 0.25 * s, 0.05 * s, paint(0.8 + r() * 0.2));
      unclipBoth(ctx);
      slab(P(-0.36, 0.5, 0), P(0.32, 0.52, 0), 0.45, 0.05);
      // gingham cushions on the seat and against the back
      const c = P(-0.03, 0.58, 0.5);
      dab(ctx, c[0], c[1], 0.27 * s, 0.06 * s, 0, hex("#f5dcdc"), 1);
      for (let i = -3; i <= 3; i++) stroke(ctx, r, c[0] + i * 0.07 * s, c[1] - 0.05 * s, Math.PI / 2, 0.09 * s, 0.03 * s, hex("#e59a9f"), 0.6, 0);
      stroke(ctx, r, c[0] - 0.25 * s, c[1], 0, 0.5 * s, 0.03 * s, hex("#e59a9f"), 0.5, 0);
      const cb = P(0.33, 0.78, 0.5);
      dab(ctx, cb[0], cb[1], 0.07 * s, 0.17 * s, dir * 0.25, hex("#f2d2d2"), 1);
      for (let i = -1; i <= 1; i++) stroke(ctx, r, cb[0] - 0.05 * s, cb[1] + i * 0.08 * s, 0, 0.1 * s, 0.025 * s, hex("#e59a9f"), 0.6, 0);
      // near side, nearest and brightest
      frame(0);
      runner(0, 0.8);
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

  // ================================================== THE WORK GARDEN (one compact scene)
  if (F.work) return paintWork();

  /**
   * The Work page: one compact garden with three project landmarks (fountain,
   * dog house, windmill) and a small guide girl. The ground, sky, paths and
   * trees are painted into the scene; every landmark, the puppy and each pose
   * of the girl are separate layers so the page can highlight and animate them.
   */
  function paintWork() {
    // sky
    const skyPath = new Path2D();
    skyPath.rect(-40, -40, W + 80, Y(L.skyEnd + 0.06) + 40);
    form({
      seed: 1, path: skyPath, bbox: [0, 0, W, Y(L.skyEnd + 0.06)], edge: false, soft: 0,
      color: (x, y) => {
        let c = ramp([[0, "#e6abb6"], [0.4, "#f0c0b5"], [0.75, "#f8d6c2"], [1, "#fbe5cf"]], y / Y(L.skyEnd));
        const sd = Math.hypot((x - X(L.sun[0])) / W, ((y - Y(L.sun[1])) / S) * 1.6);
        return mix(c, hex("#fff1d6"), clamp(1 - sd / 0.45) * 0.5);
      },
      angle: (x, y) => fbm(x / 600, y / 300, 3) * 0.18, spread: 0.12,
      len: [70, 170], width: [14, 30], alpha: [0.12, 0.28], cover: 0.9, vary: 0.08, bristles: 4, thick: () => 0.08,
    });
    {
      const r = rng(101);
      ctx.save();
      ctx.filter = `blur(${14 * k}px)`;
      for (const [cx, cy, rx, ry] of L.clouds) for (let j = 0; j < 6; j++) glaze(ctx, X(cx) + (r() - 0.5) * X(rx), Y(cy) + (r() - 0.5) * Y(ry) * 0.6, X(rx) * (0.35 + r() * 0.35), Y(ry) * (0.5 + r() * 0.4), mix(hex("#f1bdb8"), hex("#fde6dc"), r()), 0.55);
      ctx.restore();
    }
    // distant ranges, back hills, lawn
    const far = ridgeFn(L.far, 0.02, 1.4, 11);
    form({
      seed: 11, path: landPath(far, Y(L.skyEnd + 0.25)), bbox: [0, Y(L.far[0][1] - 0.08), W, Y(L.skyEnd + 0.25)],
      color: hillColor(far, [[0, "#cdb4c4"], [1, "#bba9bd"]], 0.1, { haze: 0.25, alt: "#c4b0c6" }),
      angle: hillAngle(far, 0.9), len: [40, 90], width: [9, 16], alpha: [0.25, 0.45], cover: 1, vary: 0.06, soft: 3, thick: () => 0.12,
    });
    const PAL = {
      sage: [[0, "#c4cc93"], [0.3, "#a7b97c"], [0.7, "#7f9a62"], [1, "#5b7853"]],
      moss: [[0, "#c9ca86"], [0.3, "#adb872"], [0.7, "#86985a"], [1, "#5d744d"]],
    };
    for (const [i, [cxf, topf, rxf, hf, pal]] of L.hills.entries()) {
      const top = moundTop(cxf, topf, rxf, hf, 61 + i);
      form({
        seed: 61 + i, path: landPath(top, H + 40), bbox: [0, Y(topf - 0.01), W, H],
        color: hillColor(top, PAL[pal], 0.5 + i * 0.3, { alt: "#9bb06e" }),
        angle: hillAngle(top, 0.45), len: [60, 140], width: [14, 26], alpha: [0.7, 0.92], cover: 1.6, vary: 0.14, spread: 0.55,
        thick: (x, y) => 0.3 + clamp(y / H) * 0.35, knife: () => 0.02,
        size: (x, y) => 0.8 + clamp(y / H) * 0.5,
      });
    }
    // soft paths from the girl's spot to each landmark
    const trail = ([x0, y0], [cx, cy], [x1, y1], w0, w1, seed) => {
      const pt = (t) => [lerp(lerp(x0, cx, t), lerp(cx, x1, t), t), lerp(lerp(y0, cy, t), lerp(cy, y1, t), t)];
      const Lp = [], Rp = [];
      for (let i = 0; i <= 30; i++) {
        const t = i / 30, [ax, ay] = pt(t), [bx, by] = pt(Math.min(1, t + 0.01));
        const a = Math.atan2(Y(by - ay), X(bx - ax) || 1e-6), w = X(lerp(w0, w1, t)) / 2;
        Lp.push([X(ax) - Math.sin(a) * w, Y(ay) + Math.cos(a) * w]);
        Rp.push([X(ax) + Math.sin(a) * w, Y(ay) - Math.cos(a) * w]);
      }
      const p = new Path2D();
      p.moveTo(Lp[0][0], Lp[0][1]);
      for (const q of Lp) p.lineTo(q[0], q[1]);
      for (let i = Rp.length - 1; i >= 0; i--) p.lineTo(Rp[i][0], Rp[i][1]);
      p.closePath();
      const xs = [...Lp, ...Rp].map((q) => q[0]), ys = [...Lp, ...Rp].map((q) => q[1]);
      form({
        seed, path: p, bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], soft: 2,
        color: (x, y) => mix(hex("#f2e2c3"), hex("#d6bd96"), clamp(fbm(x / 160, y / 160, seed) + 0.45)),
        angle: () => Math.atan2(Y(y1 - y0), X(x1 - x0)), len: [26, 60], width: [8, 14], alpha: [0.35, 0.6], cover: 1.4, vary: 0.1, spread: 0.7,
        thick: () => 0.35,
      });
    };
    for (const [i, t] of L.trails.entries()) trail(t[0], t[1], t[2], t[3], t[4], 70 + i);
    // a few trees and flowers at the edges, kept quiet so the landmarks stand out
    for (const [i, [tx, ty, ts, kind]] of L.trees.entries()) tree(X(tx), Y(ty), ts * W, 90 + i, kind);
    for (const cl of L.clusters) cluster(cl);

    // ---- the landmarks, each on its own layer, with their ground shadows in the scene
    const lm = [];
    const box = (bx, by, bw, bh) => [+(bx / W).toFixed(4), +(by / S).toFixed(4), +(bw / W).toFixed(4), +(bh / S).toFixed(4)];
    for (const m of L.landmarks) {
      const x = X(m.x), base = Y(m.base), names = [];
      let hit;
      if (m.kind === "fountain") {
        const f = (m.w * W) / 220, bx = x - 110 * f, by = base - 184 * f, bw = 220 * f, bh = 200 * f;
        sprite(`work-fountain`, 1, bx, by, bw, bh, [0.5, 0.5], () => fountain(x, base, f, 480, "stone"), { kind: "landmark" });
        sprite(`work-fountain-water-a`, 1, bx, by, bw, bh, [0.5, 0.5], () => fountain(x, base, f, 481, "water-a"), { kind: "water-a" });
        sprite(`work-fountain-water-b`, 1, bx, by, bw, bh, [0.5, 0.5], () => fountain(x, base, f, 482, "water-b"), { kind: "water-b" });
        // two koi that leap from the basin when the girl touches the water (hidden until then)
        const fl = 26 * f;
        for (const [name, u, dir, sd] of [["work-fish-a", 78, 1, 483], ["work-fish-b", 144, -1, 484]]) {
          const [fx, fy] = [x + (u - 110) * f, base + (150 - 184) * f];
          sprite(name, 1, fx - fl * 0.6, fy - fl * 0.3, fl * 1.2, fl * 0.6, [0.5, 0.5], () => koi(fx, fy, fl, sd, dir), { kind: name.replace("work-", "") });
        }
        names.push("work-fountain", "work-fountain-water-a", "work-fountain-water-b", "work-fish-a", "work-fish-b");
        hit = box(bx + 20 * f, by + 40 * f, bw - 40 * f, bh - 30 * f);
      } else if (m.kind === "doghouse") {
        const w = m.w * W, bx = x - 0.75 * w, by = base - 1.0 * w, bw = 1.95 * w, bh = 1.08 * w;
        ctx.save();
        ctx.filter = `blur(${8 * k}px)`;
        glaze(ctx, x + w * 0.1, base + w * 0.02, w * 0.75, w * 0.07, SHADOW, 0.4);
        ctx.restore();
        sprite(`work-doghouse`, 1, bx, by, bw, bh, [0.5, 0.95], () => dogHouse(x, base, w, 490), { kind: "landmark" });
        names.push("work-doghouse");
        const [px, pb, ps] = m.puppy;
        const pxx = X(px), pyy = Y(pb), s = ps * W;
        dog(pxx, pyy, s, "sit", ["#c9935e", "#7a5234", "#f0d3a8"], -1, 495, "shadow");
        const dbx = pxx - 0.75 * s, dby = pyy - 1.05 * s, dbw = 1.5 * s, dbh = 1.13 * s;
        const [tu, tv] = DOG_TAIL.sit;
        sprite(`work-puppy-tail`, 1, dbx, dby, dbw, dbh, [(pxx - tu * s - dbx) / dbw, (pyy + tv * s - dby) / dbh], () => dog(pxx, pyy, s, "sit", ["#c9935e", "#7a5234", "#f0d3a8"], -1, 495, "tail"), { kind: "puppy-tail" });
        sprite(`work-puppy`, 1, dbx, dby, dbw, dbh, [0.5, (pyy - dby) / dbh], () => dog(pxx, pyy, s, "sit", ["#c9935e", "#7a5234", "#f0d3a8"], -1, 495, "body"), { kind: "puppy" });
        names.push("work-puppy-tail", "work-puppy");
        hit = box(bx, by + 0.1 * w, Math.max(bw, pxx + 0.5 * s - bx), bh - 0.1 * w);
      } else {
        const f = (m.h * W) / 290;
        windmill(x, base, f, 470, "shadow-only");
        const tbx = x - 42 * f, tby = base - 200 * f, tbw = 84 * f, tbh = 208 * f;
        sprite(`work-windmill`, 1, tbx, tby, tbw, tbh, [0.5, 1], () => windmill(x, base, f, 470, "tower-noshadow"), { kind: "landmark" });
        const hx = x, hy = base + (104 - 276) * f, rad = 90 * f;
        sprite(`work-sails`, 1, hx - rad, hy - rad, 2 * rad, 2 * rad, [0.5, 0.5], () => windmill(x, base, f, 471, "sails"), { kind: "sails" });
        names.push("work-windmill", "work-sails");
        hit = box(hx - rad * 0.8, hy - rad * 0.8, rad * 1.6, base - hy + rad * 0.8);
      }
      lm.push({ slug: m.slug, kind: m.kind, hit, label: m.label, stand: m.stand, face: m.face, layers: names });
    }

    // ---- the guide girl: one layer per pose, all the same size, anchored at her feet
    const gh = L.girlH * S, gx = W * 0.5, gy = S * 0.5;
    const gbx = gx - 0.45 * gh, gby = gy - 1.02 * gh, gbw = 0.9 * gh, gbh = 1.08 * gh;
    for (const pose of ["idle", "walk-a", "walk-b", "reach", "offer", "pet-a", "pet-b", "turn", "phone", "phone-up", "selfie"]) {
      sprite(`work-girl-${pose}`, 1, gbx, gby, gbw, gbh, [0.5, 1.02 / 1.08], () => girl(gx, gy, gh, pose, 510), { kind: "girl" });
    }
    const tip = PHONE_TIPS.selfie;
    anchors.work = {
      start: L.start,
      girl: { w: +(gbw / W).toFixed(4), h: +(gbh / S).toFixed(4), feet: [0.5, +(1.02 / 1.08).toFixed(4)], phone: [+((tip[0] - gbx) / gbw).toFixed(4), +((tip[1] - gby) / gbh).toFixed(4)] },
      landmarks: lm,
    };

    lightRelief(cv, hcv, W, H, 1);
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    const lg = ctx.createLinearGradient(0, 0, W, H);
    lg.addColorStop(0, "rgba(255,214,170,0.4)");
    lg.addColorStop(1, "rgba(255,214,170,0)");
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    PAINT.hx = null;
    anchors.sprites = sprites.map((sp) => Object.fromEntries(Object.entries(sp).filter(([key]) => key !== "canvas")));
    return { cv, anchors, sprites };
  }

  /** A small wooden dog house with a paw-print plaque, a food bowl and a bone beside it. */
  function dogHouse(x, base, w, seed) {
    const r = rng(seed);
    const h = w * 0.55, x0 = x - w / 2, top = base - h;
    withThickness(1, () => {
      const walls = new Path2D();
      walls.rect(x0, top, w, h);
      ctx.fillStyle = rgba(hex("#a9c0c4"));
      ctx.fill(walls);
      clipBoth(ctx, walls);
      for (let row = 0; row < 7; row++) {
        const y = top + (row + 0.5) * (h / 7);
        for (let i = 0; i < 6; i++) {
          const lit = clamp(0.85 - i / 7 + (r() - 0.5) * 0.15);
          knife(ctx, r, x0 + i * (w / 6) - w * 0.02, y, (r() - 0.5) * 0.03, w * 0.2, h / 7.6, mix(hex("#7f9da3"), hex("#d6e3e2"), lit));
        }
        stroke(ctx, r, x0, top + (row + 1) * (h / 7), 0, w, w * 0.008, hex("#6d878c"), 0.6, 0);
      }
      unclipBoth(ctx);
      // roof: two terracotta slopes with a ridge cap
      const roof = new Path2D();
      roof.moveTo(x - w * 0.62, top + w * 0.05);
      roof.lineTo(x, top - w * 0.38);
      roof.lineTo(x + w * 0.62, top + w * 0.05);
      roof.lineTo(x + w * 0.5, top + w * 0.08);
      roof.lineTo(x, top - w * 0.28);
      roof.lineTo(x - w * 0.5, top + w * 0.08);
      roof.closePath();
      ctx.fillStyle = rgba(hex("#b8664f"));
      ctx.fill(roof);
      clipBoth(ctx, roof);
      for (let i = 0; i < 26; i++) {
        const t = r(), side = r() < 0.5 ? -1 : 1;
        const px = x + side * t * w * 0.6, py = top - w * 0.36 + t * w * 0.42;
        knife(ctx, r, px, py, side * 0.56 + (side < 0 ? Math.PI : 0), w * 0.12, w * 0.06, mix(hex("#9c5441"), hex("#e0957a"), side < 0 ? 0.7 : 0.25));
      }
      unclipBoth(ctx);
      // gable in shade under the roof
      const gable = new Path2D();
      gable.moveTo(x - w * 0.5, top + w * 0.02);
      gable.lineTo(x, top - w * 0.26);
      gable.lineTo(x + w * 0.5, top + w * 0.02);
      gable.closePath();
      ctx.fillStyle = rgba(hex("#93acb1"));
      ctx.fill(gable);
      // arched door
      const door = new Path2D();
      door.moveTo(x - w * 0.17, base);
      door.lineTo(x - w * 0.17, base - h * 0.5);
      door.arc(x, base - h * 0.5, w * 0.17, Math.PI, 0);
      door.lineTo(x + w * 0.17, base);
      door.closePath();
      ctx.fillStyle = rgba(hex("#3b302b"));
      ctx.fill(door);
      glaze(ctx, x - w * 0.05, base - h * 0.45, w * 0.1, h * 0.3, hex("#5a4a42"), 0.6);
      // a paw-print plaque above the door
      knife(ctx, r, x - w * 0.13, top - w * 0.1, 0, w * 0.26, w * 0.12, hex("#f2e6cf"));
      const paw = [x, top - w * 0.1];
      dab(ctx, paw[0], paw[1] + w * 0.015, w * 0.03, w * 0.025, 0, hex("#7a5234"), 1);
      for (const [dx, dy] of [[-0.035, -0.02], [-0.012, -0.035], [0.012, -0.035], [0.035, -0.02]]) dab(ctx, paw[0] + dx * w, paw[1] + dy * w, w * 0.011, w * 0.011, 0, hex("#7a5234"), 1);
      // food bowl and a bone to the right
      const bxp = x + w * 0.78, byp = base - w * 0.03;
      dab(ctx, bxp, byp, w * 0.15, w * 0.05, 0, hex("#d6564f"), 1);
      dab(ctx, bxp, byp - w * 0.03, w * 0.14, w * 0.035, 0, hex("#f3ece0"), 1);
      for (let i = 0; i < 9; i++) dab(ctx, bxp + (r() - 0.5) * w * 0.18, byp - w * 0.035 + (r() - 0.5) * w * 0.02, w * 0.016, w * 0.012, 0, hex("#8a5a34"), 1);
      const bnx = x + w * 0.62, bny = base + w * 0.02;
      stroke(ctx, r, bnx - w * 0.07, bny, -0.15, w * 0.14, w * 0.025, hex("#f6efe2"), 1, 0);
      for (const [dx, dy] of [[-0.075, -0.01], [-0.07, 0.015], [0.07, -0.03], [0.075, -0.005]]) dab(ctx, bnx + dx * w, bny + dy * w, w * 0.02, w * 0.02, 0, hex("#f6efe2"), 1);
    });
  }

  /**
   * The guide: a small girl in a rose dress with long, loose, wavy hair and a
   * rose bow, feet at (x, y), height h, facing right (the page mirrors her).
   * Poses: idle, walk-a / walk-b, reach (to the fountain's water), offer (kneels
   * holding out a treat), pet-a / pet-b (kneels, patting the puppy), and photo
   * (turned to the viewer with a V sign, for a picture with the windmill).
   */
  function girl(x, y, h, pose, seed) {
    if (FRONT_POSES.includes(pose)) return girlFront(x, y, h, seed, pose);
    const r = rng(seed);
    const P = (u, v) => [x + u * h, y - v * h];
    const skin = hex("#f1d3c0"), hair = hex("#5b3a2e"), bow = hex("#d9787e");
    ctx.save();
    ctx.filter = `blur(${4 * k}px)`;
    glaze(ctx, ...P(0.02, -0.005), 0.2 * h, 0.035 * h, SHADOW, 0.35);
    ctx.restore();
    const kneel = pose === "offer" || pose === "pet-a" || pose === "pet-b";
    const hipV = kneel ? 0.25 : 0.38, shoulderV = kneel ? 0.58 : 0.72, headV = kneel ? 0.7 : 0.85, hemV = kneel ? 0.13 : 0.31;
    withThickness(0.95, () => {
      const limb = (a, b, wf, col) => {
        const [ax, ay] = P(...a), [bx, by] = P(...b);
        stroke(ctx, r, ax, ay, Math.atan2(by - ay, bx - ax), Math.hypot(bx - ax, by - ay), wf * h, col, 1, 1);
      };
      const shoe = (u, v) => dab(ctx, ...P(u + 0.02, v + 0.01), 0.045 * h, 0.022 * h, 0, hex("#4a3a33"), 1);
      // long hair falling down her back, behind everything else: wavy, with lighter strands
      const hairEnd = shoulderV - 0.36, sway = pose === "walk-a" ? -0.025 : pose === "walk-b" ? 0.025 : 0;
      const mane = new Path2D();
      mane.moveTo(...P(0.02, headV + 0.1));
      mane.bezierCurveTo(...P(-0.13, headV + 0.13), ...P(-0.18, headV - 0.02), ...P(-0.16 + sway, shoulderV - 0.02));
      // the back edge falls in soft waves
      mane.bezierCurveTo(...P(-0.21 + sway, shoulderV - 0.1), ...P(-0.14 + sway, shoulderV - 0.16), ...P(-0.19 + sway, shoulderV - 0.24));
      mane.bezierCurveTo(...P(-0.23 + sway, hairEnd + 0.07), ...P(-0.15 + sway, hairEnd + 0.03), ...P(-0.19 + sway * 1.6, hairEnd));
      mane.quadraticCurveTo(...P(-0.13 + sway, hairEnd - 0.035), ...P(-0.1 + sway, hairEnd + 0.015));
      mane.quadraticCurveTo(...P(-0.07 + sway, hairEnd - 0.02), ...P(-0.04 + sway, hairEnd + 0.04));
      mane.bezierCurveTo(...P(-0.08, shoulderV - 0.16), ...P(-0.02, shoulderV - 0.04), ...P(-0.02, headV - 0.04));
      mane.closePath();
      ctx.fillStyle = rgba(hair);
      ctx.fill(mane);
      clipBoth(ctx, mane);
      for (let i = 0; i < 34; i++) {
        const u = -0.2 + r() * 0.19, v = hairEnd + r() * (headV - hairEnd);
        stroke(ctx, r, ...P(u, v + 0.08), Math.PI / 2 + Math.sin(v * 30) * 0.25 + (r() - 0.5) * 0.2, 0.16 * h, 0.03 * h, mix(hair, r() < 0.45 ? hex("#93613f") : SHADOW, r() * 0.4), 0.9, 1);
      }
      unclipBoth(ctx);
      // legs and shoes
      if (kneel) {
        limb([0.02, hipV], [0.13, 0.08], 0.06, skin); limb([0.13, 0.08], [0.14, 0.01], 0.055, skin); shoe(0.14, 0);
        limb([-0.04, hipV], [-0.12, 0.03], 0.06, mix(skin, SHADOW, 0.1)); limb([-0.12, 0.03], [-0.24, 0.02], 0.05, mix(skin, SHADOW, 0.1)); shoe(-0.26, 0.01);
      } else {
        const sw = pose === "walk-a" ? 0.08 : pose === "walk-b" ? -0.08 : 0.015;
        limb([-0.03, hipV], [-0.03 - sw, 0.02], 0.058, mix(skin, SHADOW, 0.1)); shoe(-0.03 - sw, 0);
        limb([0.03, hipV], [0.03 + sw, 0.02], 0.058, skin); shoe(0.03 + sw, 0);
      }
      // back arm, behind the dress
      const back = pose === "walk-a" ? [0.1, hipV + 0.04] : pose === "walk-b" ? [-0.1, hipV + 0.04] : kneel ? [0.04, hipV + 0.02] : [-0.07, hipV + 0.05];
      limb([-0.05, shoulderV - 0.03], back, 0.055, mix(skin, SHADOW, 0.12));
      dress(P, shoulderV, hemV, r);
      // a lock of loose hair falling over the front shoulder
      {
        const lock = new Path2D();
        lock.moveTo(...P(-0.03, headV - 0.02));
        lock.bezierCurveTo(...P(0.02, shoulderV + 0.02), ...P(0.05, shoulderV - 0.06), ...P(0.035, shoulderV - 0.15));
        lock.quadraticCurveTo(...P(0.005, shoulderV - 0.1), ...P(-0.02, shoulderV - 0.02));
        lock.closePath();
        ctx.fillStyle = rgba(mix(hair, hex("#93613f"), 0.15));
        ctx.fill(lock);
        for (let i = 0; i < 4; i++) stroke(ctx, r, ...P(-0.015 + i * 0.012, shoulderV + 0.02), Math.PI / 2 + 0.15, 0.13 * h, 0.012 * h, mix(hair, hex("#a87452"), r() * 0.5), 0.8, 0);
      }
      // front arm: down, swinging, reaching to the water, holding out a treat, or patting
      const front = pose === "reach" ? [[0.06, shoulderV - 0.03], [0.33, 0.45]]
        : pose === "offer" ? [[0.06, shoulderV - 0.03], [0.3, 0.5]]
        : pose === "pet-a" ? [[0.06, shoulderV - 0.03], [0.28, 0.66]]
        : pose === "pet-b" ? [[0.06, shoulderV - 0.03], [0.3, 0.6]]
        : pose === "walk-a" ? [[0.06, shoulderV - 0.03], [-0.04, hipV + 0.03]]
        : pose === "walk-b" ? [[0.06, shoulderV - 0.03], [0.16, hipV + 0.04]]
        : [[0.07, shoulderV - 0.03], [0.09, hipV + 0.02]];
      limb(front[0], front[1], 0.055, skin);
      const [hu, hv] = front[1];
      if (pose === "pet-a" || pose === "pet-b") dab(ctx, ...P(hu + 0.01, hv), 0.035 * h, 0.02 * h, -0.2, skin, 1); // an open, flat hand
      else dab(ctx, ...P(hu + 0.005, hv), 0.025 * h, 0.025 * h, 0, skin, 1);
      if (pose === "offer") {
        // a little bone-shaped treat between her fingers
        const [bx, by] = P(hu + 0.05, hv + 0.01);
        stroke(ctx, r, bx - 0.035 * h, by, 0, 0.07 * h, 0.018 * h, hex("#f3e4c8"), 1, 0);
        for (const [dx, dy] of [[-0.04, -0.012], [-0.04, 0.012], [0.04, -0.012], [0.04, 0.012]]) dab(ctx, bx + dx * h, by + dy * h, 0.013 * h, 0.013 * h, 0, hex("#f3e4c8"), 1);
      }
      // head, then the bangs and the hair over her ear, then the bow
      dab(ctx, ...P(0.015, headV), 0.1 * h, 0.105 * h, 0, skin, 1);
      dab(ctx, ...P(-0.025, headV + 0.04), 0.1 * h, 0.08 * h, 0, hair, 1);
      dab(ctx, ...P(-0.06, headV - 0.02), 0.06 * h, 0.09 * h, 0.15, hair, 1);
      const bang = new Path2D();
      bang.moveTo(...P(-0.03, headV + 0.11));
      bang.quadraticCurveTo(...P(0.09, headV + 0.12), ...P(0.115, headV + 0.02));
      bang.quadraticCurveTo(...P(0.08, headV + 0.06), ...P(0.05, headV + 0.035));
      bang.quadraticCurveTo(...P(0.02, headV + 0.07), ...P(-0.03, headV + 0.06));
      bang.closePath();
      ctx.fillStyle = rgba(hair);
      ctx.fill(bang);
      clipBoth(ctx, bang);
      for (let i = 0; i < 9; i++) stroke(ctx, r, ...P(-0.04 + r() * 0.1, headV + 0.105), 0.6 + r() * 0.5, 0.07 * h, 0.018 * h, mix(hair, r() < 0.5 ? hex("#8a5a40") : SHADOW, r() * 0.3), 0.9, 0);
      unclipBoth(ctx);
      for (let i = 0; i < 4; i++) stroke(ctx, r, ...P(-0.09 + i * 0.03, headV + 0.09 - i * 0.004), 0.25, 0.05 * h, 0.012 * h, hex("#a87452"), 0.7, 0); // sheen
      bowAt(P(-0.075, headV + 0.085), 0.08 * h, -0.35, bow, r);
      // face: eye, lash, rosy cheek, a small smile
      dab(ctx, ...P(0.07, headV), 0.011 * h, 0.015 * h, 0, hex("#2b2420"), 1);
      stroke(ctx, r, ...P(0.06, headV + 0.02), -0.3, 0.025 * h, 0.005 * h, hex("#2b2420"), 0.9, 0);
      dab(ctx, ...P(0.065, headV - 0.035), 0.022 * h, 0.014 * h, 0, hex("#eba3a0"), 0.65);
      stroke(ctx, r, ...P(0.085, headV - 0.055), 0.4, 0.02 * h, 0.006 * h, hex("#b8615e"), 0.8, 0);
    });
  }

  /** The rose dress: a little trapeze with a scalloped hem and a cream collar. */
  function dress(P, shoulderV, hemV, r) {
    const d = new Path2D();
    d.moveTo(...P(-0.085, shoulderV)); d.lineTo(...P(0.085, shoulderV));
    d.quadraticCurveTo(...P(0.14, (shoulderV + hemV) / 2), ...P(0.18, hemV));
    for (let i = 0; i <= 6; i++) { const u = 0.18 - (i / 6) * 0.36; d.lineTo(...P(u, hemV - (i % 2 ? 0.015 : 0))); }
    d.quadraticCurveTo(...P(-0.14, (shoulderV + hemV) / 2), ...P(-0.085, shoulderV));
    d.closePath();
    ctx.fillStyle = rgba(hex("#d4837f"));
    ctx.fill(d);
    clipBoth(ctx, d);
    const [ox] = P(0, 0), h = P(1, 0)[0] - ox;
    for (let i = 0; i < 28; i++) {
      const u = -0.2 + r() * 0.4, v = hemV + r() * (shoulderV - hemV);
      knife(ctx, r, ...P(u, v + 0.04), Math.PI / 2 + (r() - 0.5) * 0.2, 0.12 * h, 0.05 * h, mix(hex("#b8615e"), hex("#f2b5ac"), clamp(0.75 - u * 2)));
    }
    unclipBoth(ctx);
    dab(ctx, ...P(0.005, shoulderV - 0.015), 0.07 * h, 0.022 * h, 0, hex("#fbf3e4"), 1);
  }

  /** A satin bow: two loops, two tails and a knot, centred at c, size s, turned by rot. */
  function bowAt([cx, cy], s, rot, col, r) {
    const pt = (u, v) => [cx + (u * Math.cos(rot) - v * Math.sin(rot)) * s, cy + (u * Math.sin(rot) + v * Math.cos(rot)) * s];
    for (const side of [-1, 1]) {
      const loop = new Path2D();
      loop.moveTo(...pt(0, 0));
      loop.bezierCurveTo(...pt(side * 0.9, -1.0), ...pt(side * 1.5, -0.2), ...pt(side * 1.3, 0.45));
      loop.bezierCurveTo(...pt(side * 1.0, 0.75), ...pt(side * 0.4, 0.35), ...pt(0, 0));
      ctx.fillStyle = rgba(col);
      ctx.fill(loop);
      stroke(ctx, r, ...pt(side * 0.35, -0.2), (side < 0 ? Math.PI : 0) + rot + 0.2 * side, s * 0.8, s * 0.35, mix(col, hex("#f6c2c0"), 0.55), 0.85, 0);
      stroke(ctx, r, ...pt(side * 0.15, 0.2), Math.PI / 2 + rot - side * 0.45, s * 1.05, s * 0.32, mix(col, SHADOW, 0.15), 1, 0);
    }
    dab(ctx, ...pt(0, 0.02), s * 0.3, s * 0.3, 0, mix(col, SHADOW, 0.12), 1);
  }

  /**
   * The girl turned to the viewer, for the windmill selfie: "turn" (arms down),
   * "phone" (a small phone in her hand at her hip, just taken from her pocket),
   * "phone-up" (lifting it to her chest) and "selfie" (holding it up and out to
   * her side, head tilted toward it, eyes on its screen). The phone's top is
   * returned for the camera flash.
   */
  function girlFront(x, y, h, seed, pose) {
    const r = rng(seed + 7);
    const P = (u, v) => [x + u * h, y - v * h];
    const skin = hex("#f1d3c0"), hair = hex("#5b3a2e");
    ctx.save();
    ctx.filter = `blur(${4 * k}px)`;
    glaze(ctx, ...P(0, -0.005), 0.18 * h, 0.035 * h, SHADOW, 0.35);
    ctx.restore();
    const hipV = 0.38, shoulderV = 0.72, hemV = 0.31;
    const selfie = pose === "selfie";
    const headV = 0.86, headU = selfie ? 0.012 : 0, tilt = selfie ? 0.12 : 0;
    let phoneTip = null;
    withThickness(0.95, () => {
      const limb = (a, b, wf, col) => {
        const [ax, ay] = P(...a), [bx, by] = P(...b);
        stroke(ctx, r, ax, ay, Math.atan2(by - ay, bx - ax), Math.hypot(bx - ax, by - ay), wf * h, col, 1, 1);
      };
      // long hair behind her, falling past her shoulders on both sides
      const mane = new Path2D();
      mane.moveTo(...P(-0.11 + headU, headV + 0.06));
      mane.bezierCurveTo(...P(-0.17, headV - 0.05), ...P(-0.2, shoulderV - 0.12), ...P(-0.17, shoulderV - 0.36));
      mane.quadraticCurveTo(...P(0, shoulderV - 0.26), ...P(0.17, shoulderV - 0.36));
      mane.bezierCurveTo(...P(0.2, shoulderV - 0.12), ...P(0.17 + headU, headV - 0.05), ...P(0.11 + headU, headV + 0.06));
      mane.closePath();
      ctx.fillStyle = rgba(hair);
      ctx.fill(mane);
      clipBoth(ctx, mane);
      for (let i = 0; i < 26; i++) stroke(ctx, r, ...P(-0.16 + r() * 0.32, shoulderV - 0.28 + r() * 0.3), -Math.PI / 2 + (r() - 0.5) * 0.3, 0.16 * h, 0.03 * h, mix(hair, r() < 0.4 ? hex("#8a5a40") : SHADOW, r() * 0.35), 0.9, 1);
      unclipBoth(ctx);
      for (const side of [-1, 1]) { limb([side * 0.035, hipV], [side * 0.045, 0.02], 0.058, mix(skin, SHADOW, side < 0 ? 0.1 : 0)); dab(ctx, ...P(side * 0.05, 0.01), 0.04 * h, 0.022 * h, 0, hex("#4a3a33"), 1); }
      // her left arm (viewer's left) relaxed at her side
      limb([-0.08, shoulderV - 0.03], [-0.12, hipV + 0.02], 0.055, mix(skin, SHADOW, 0.08));
      dress(P, shoulderV, hemV, r);
      // loose hair falling in front of both shoulders
      for (const side of [-1, 1]) {
        const lock = new Path2D();
        lock.moveTo(...P(side * 0.085 + headU, headV - 0.01));
        lock.bezierCurveTo(...P(side * 0.12, shoulderV - 0.02), ...P(side * 0.1, shoulderV - 0.12), ...P(side * 0.12, shoulderV - 0.2));
        lock.quadraticCurveTo(...P(side * 0.08, shoulderV - 0.12), ...P(side * 0.065 + headU, headV - 0.04));
        lock.closePath();
        ctx.fillStyle = rgba(mix(hair, hex("#93613f"), 0.15));
        ctx.fill(lock);
      }
      dab(ctx, ...P(-0.12, hipV + 0.02), 0.024 * h, 0.024 * h, 0, skin, 1);
      // her right arm (viewer's right) and the phone, pose by pose
      const shoulder = [0.08, shoulderV - 0.03];
      const [elbow, hand] = pose === "phone" ? [[0.13, hipV + 0.17], [0.12, hipV + 0.04]]
        : pose === "phone-up" ? [[0.15, hipV + 0.1], [0.07, shoulderV - 0.06]]
        : selfie ? [[0.19, shoulderV + 0.03], [0.29, headV - 0.02]]
        : [[0.11, hipV + 0.17], [0.12, hipV + 0.02]];
      limb(shoulder, elbow, 0.055, skin);
      limb(elbow, hand, 0.05, skin);
      if (pose !== "turn") {
        // the phone: a small rounded slab in a dusty-blue case, held in the hand
        const [px, py] = P(hand[0], hand[1] + 0.035);
        const pw = 0.045 * h, ph = 0.08 * h, rot = selfie ? -0.35 : pose === "phone-up" ? -0.1 : 0.1;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(rot);
        const ph2 = new Path2D();
        ph2.roundRect(-pw / 2, -ph / 2, pw, ph, pw * 0.22);
        ctx.fillStyle = rgba(hex("#8fa9b8"));
        ctx.fill(ph2);
        ctx.fillStyle = rgba(hex("#c7d6dc"), 0.7);
        ctx.fillRect(-pw * 0.32, -ph * 0.4, pw * 0.25, ph * 0.18); // a little highlight
        ctx.beginPath();
        ctx.arc(-pw * 0.18, -ph * 0.3, pw * 0.09, 0, Math.PI * 2); // camera lens
        ctx.fillStyle = rgba(hex("#2b2420"));
        ctx.fill();
        ctx.restore();
        phoneTip = [px + Math.sin(rot) * ph * 0.5, py - Math.cos(rot) * ph * 0.5];
        // fingers wrapped round it
        dab(ctx, ...P(hand[0], hand[1]), 0.026 * h, 0.024 * h, 0, skin, 1);
        dab(ctx, px + 0.018 * h, py + 0.005 * h, 0.012 * h, 0.022 * h, 0, skin, 1);
      } else dab(ctx, ...P(hand[0], hand[1]), 0.024 * h, 0.024 * h, 0, skin, 1);
      // face, tilted toward the phone in the selfie, with the bow on top
      const [hx0, hy0] = P(headU, headV);
      ctx.save();
      ctx.translate(hx0, hy0);
      ctx.rotate(tilt);
      ctx.translate(-hx0, -hy0);
      const Q = (u, v) => P(u + headU, v);
      dab(ctx, ...Q(0, headV), 0.1 * h, 0.105 * h, 0, skin, 1);
      const top = new Path2D();
      top.moveTo(...Q(-0.11, headV - 0.01));
      top.bezierCurveTo(...Q(-0.12, headV + 0.13), ...Q(0.12, headV + 0.13), ...Q(0.11, headV - 0.01));
      top.quadraticCurveTo(...Q(0.07, headV + 0.06), ...Q(0.01, headV + 0.045));
      top.quadraticCurveTo(...Q(-0.06, headV + 0.07), ...Q(-0.11, headV - 0.01));
      top.closePath();
      ctx.fillStyle = rgba(hair);
      ctx.fill(top);
      clipBoth(ctx, top);
      for (let i = 0; i < 10; i++) stroke(ctx, r, ...Q(-0.09 + r() * 0.18, headV + 0.1), Math.PI / 2 + (r() - 0.5) * 0.9, 0.06 * h, 0.016 * h, mix(hair, r() < 0.5 ? hex("#8a5a40") : SHADOW, r() * 0.3), 0.9, 0);
      unclipBoth(ctx);
      bowAt(Q(-0.08, headV + 0.1), 0.08 * h, -0.5, hex("#d9787e"), r);
      const look = selfie ? 0.012 : 0;
      for (const side of [-1, 1]) {
        dab(ctx, ...Q(side * 0.04 + look, headV - 0.005 + look * 0.5), 0.011 * h, 0.016 * h, 0, hex("#2b2420"), 1);
        dab(ctx, ...Q(side * 0.06, headV - 0.04), 0.022 * h, 0.013 * h, 0, hex("#eba3a0"), 0.65);
      }
      // a smile: an upturned arc (wider and open for the selfie)
      const [mx, my] = Q(0, headV - 0.045);
      ctx.beginPath();
      ctx.arc(mx, my, (selfie ? 0.03 : 0.02) * h, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.strokeStyle = rgba(hex("#b8615e"), 0.95);
      ctx.lineWidth = Math.max(1, 0.011 * h);
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    });
    if (phoneTip) PHONE_TIPS[pose] = phoneTip;
  }

  /** A little koi, side view, facing right (dir 1) or left (dir -1), centred at (x, y), length len. */
  function koi(x, y, len, seed, dir = 1) {
    const r = rng(seed);
    withThickness(0.8, () => {
      const body = new Path2D();
      body.moveTo(x + dir * len * 0.42, y);
      body.bezierCurveTo(x + dir * len * 0.3, y - len * 0.2, x - dir * len * 0.2, y - len * 0.18, x - dir * len * 0.3, y);
      body.bezierCurveTo(x - dir * len * 0.2, y + len * 0.16, x + dir * len * 0.3, y + len * 0.18, x + dir * len * 0.42, y);
      ctx.fillStyle = rgba(hex("#f3ead9"));
      ctx.fill(body);
      clipBoth(ctx, body);
      for (const [u, v, rx] of [[0.18, -0.04, 0.16], [-0.08, 0.02, 0.13]]) dab(ctx, x + dir * u * len, y + v * len, rx * len, rx * len * 0.7, 0.2 * dir, hex("#e9773f"), 1);
      stroke(ctx, r, x - dir * 0.25 * len, y - 0.02 * len, dir < 0 ? Math.PI : 0, 0.6 * len, 0.05 * len, hex("#fff8ec"), 0.6, 0);
      unclipBoth(ctx);
      const tail = new Path2D();
      tail.moveTo(x - dir * len * 0.28, y);
      tail.quadraticCurveTo(x - dir * len * 0.48, y - len * 0.22, x - dir * len * 0.56, y - len * 0.16);
      tail.quadraticCurveTo(x - dir * len * 0.46, y, x - dir * len * 0.56, y + len * 0.16);
      tail.quadraticCurveTo(x - dir * len * 0.48, y + len * 0.22, x - dir * len * 0.28, y);
      ctx.fillStyle = rgba(hex("#ef8a52"), 0.9);
      ctx.fill(tail);
      stroke(ctx, r, x + dir * len * 0.05, y + len * 0.1, dir < 0 ? Math.PI - 0.9 : 0.9, len * 0.14, len * 0.07, hex("#f2a06c"), 0.85, 0);
      dab(ctx, x + dir * len * 0.32, y - len * 0.03, len * 0.025, len * 0.025, 0, hex("#2b2420"), 1);
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

  /** A tuft of grass (and maybe a flower or two), anchored at (x, y), h tall. */
  function tuft(x, y, h, seed, flowers = 0) {
    const r = rng(seed);
    withThickness(1, () => {
      // shaded base, then blades from dark (back) to sunlit (front), a few broad leaves
      dab(ctx, x, y - h * 0.04, h * 0.2, h * 0.06, 0, hex("#3f5a3c"), 0.9);
      for (let j = 0; j < 34; j++) {
        const t = j / 34;
        const bx = x + (r() - 0.5) * h * 0.42;
        const col = mix(ramp([[0, "#3f5a3c"], [0.45, "#5f7d4f"], [0.8, "#87a565"], [1, "#b8c983"]], t * 0.8 + r() * 0.25), WARM, t * 0.12);
        stroke(ctx, r, bx, y, -Math.PI / 2 + (r() - 0.5) * 1.0, h * (0.4 + r() * 0.6), h * (0.055 + r() * 0.045), col, 0.95, 3);
      }
      for (let j = 0; j < 4; j++) {
        const a = -Math.PI / 2 + (j - 1.5) * 0.45;
        knife(ctx, r, x, y - h * 0.05, a, h * (0.35 + r() * 0.15), h * 0.09, mix(hex("#6f8f5a"), WARM, 0.15 + r() * 0.15));
      }
      for (let f = 0; f < flowers; f++) {
        const a = -Math.PI / 2 + (r() - 0.5) * 0.5, len = h * (0.85 + r() * 0.2);
        stroke(ctx, r, x, y, a, len, h * 0.025, hex("#6f8a5a"), 0.95, 0);
        (r() < 0.5 ? daisy : cosmos)(x + Math.cos(a) * len, y + Math.sin(a) * len, h * 0.09, r);
      }
    });
  }
  /** A leafy sprig: a curved stem with layered, painted leaves, rooted at (x, y). */
  function sprig(x, y, h, seed, lean = 1) {
    const r = rng(seed);
    withThickness(1, () => {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        pts.push([x + lean * Math.sin(t * 1.4) * h * 0.22, y - t * h]);
      }
      for (let i = 0; i < 12; i++) stroke(ctx, r, pts[i][0], pts[i][1], Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]), h * 0.1, h * 0.03 * (1 - i / 16), hex("#5a7348"), 1, 1);
      for (let i = 2; i <= 12; i++) {
        const [px, py] = pts[i];
        const side = i % 2 ? 1 : -1;
        const len = h * (0.26 - i * 0.012);
        const a = -Math.PI / 2 + side * (0.9 - i * 0.03) + lean * 0.2;
        const lit = clamp(0.35 + i * 0.05 + (side < 0 ? 0.15 : -0.05));
        const col = mix(ramp([[0, "#3f5a3c"], [0.5, "#6f8f5a"], [1, "#b8c983"]], lit), WARM, lit * 0.12);
        glaze(ctx, px + Math.cos(a) * len * 0.6 + h * 0.02, py + Math.sin(a) * len * 0.6 + h * 0.02, len * 0.45, len * 0.16, SHADOW, 0.25);
        knife(ctx, r, px, py, a, len, len * 0.38, col);
        stroke(ctx, r, px, py, a, len * 0.85, len * 0.05, mix(col, WARM, 0.4), 0.8, 0);
        if (i % 4 === 0) dab(ctx, px + Math.cos(a) * len, py + Math.sin(a) * len, h * 0.022, h * 0.02, 0, hex("#e9a9aa"), 1);
      }
    });
  }
  function tufts(list, scene, seed0, kind = "tuft") {
    for (const [i, [xf, yf, hf, extra]] of list.entries()) {
      const x = X(xf), y = Y(yf), h = hf * W;
      ctx.save();
      ctx.filter = `blur(${6 * k}px)`;
      glaze(ctx, x + h * 0.1, y + h * 0.02, h * 0.36, h * 0.06, SHADOW, 0.4);
      ctx.restore();
      const bx = x - 0.65 * h, by = y - 1.22 * h, bw = 1.3 * h, bh = 1.28 * h;
      const draw = kind === "sprig" ? () => sprig(x, y, h, seed0 + i, extra ?? 1) : () => tuft(x, y, h, seed0 + i, extra ?? 0);
      sprite(`${kind}-${scene}-${i}`, scene, bx, by, bw, bh, [0.5, (y - by) / bh], draw, { kind: "tuft" });
    }
  }

  /**
   * The Work page's windmill, repainted: a tapered cream tower with two bands, a
   * door and a little window, a terracotta cap, and four lattice sails on a hub.
   * Coordinates follow the Work drawing (200 × 290, ground at y 276), scaled by f.
   * The tower is painted into the scene; the sails are a separate layer that turns.
   */
  function windmill(x, base, f, seed, parts = "tower") {
    const r = rng(seed);
    const P = (u, v) => [x + (u - 100) * f, base + (v - 276) * f];
    withThickness(0.9, () => {
      if (parts === "shadow-only") {
        glaze(ctx, ...P(104, 277), 70 * f, 9 * f, SHADOW, 0.35);
        return;
      }
      if (parts === "tower" || parts === "tower-noshadow") {
        if (parts === "tower") glaze(ctx, ...P(104, 277), 70 * f, 9 * f, SHADOW, 0.35);
        const tower = new Path2D();
        tower.moveTo(...P(70, 274)); tower.lineTo(...P(80, 120)); tower.lineTo(...P(120, 120)); tower.lineTo(...P(130, 274)); tower.closePath();
        ctx.fillStyle = rgba(hex("#efe3cf"));
        ctx.fill(tower);
        clipBoth(ctx, tower);
        for (let i = 0; i < 40; i++) {
          const [px, py] = P(70 + r() * 60, 120 + r() * 154);
          const lit = clamp(0.85 - (px - P(70, 0)[0]) / (60 * f) * 0.6);
          knife(ctx, r, px - 8 * f, py, Math.PI / 2 + (r() - 0.5) * 0.1, 18 * f, 9 * f, mix(hex("#cdbb9f"), hex("#fbf3e3"), lit));
        }
        for (const v of [200, 240]) stroke(ctx, r, ...P(70, v), 0, 60 * f, 2.2 * f, hex("#d4c1a4"), 0.9, 1);
        unclipBoth(ctx);
        knife(ctx, r, ...P(92, 274), -Math.PI / 2, 30 * f, 16 * f, hex("#7d6152"));
        dab(ctx, ...P(100, 176), 6 * f, 8 * f, 0, hex("#b6d0d3"), 1);
        const cap = new Path2D();
        cap.moveTo(...P(72, 123)); cap.quadraticCurveTo(...P(100, 82), ...P(128, 123)); cap.closePath();
        ctx.fillStyle = rgba(hex("#c5786f"));
        ctx.fill(cap);
        clipBoth(ctx, cap);
        for (let i = 0; i < 16; i++) stroke(ctx, r, ...P(72 + r() * 50, 92 + r() * 30), 0.2, 16 * f, 5 * f, mix(hex("#a85f55"), hex("#dd9a8e"), r()), 0.95, 2);
        unclipBoth(ctx);
        return;
      }
      // sails, around the hub at (100, 104): a brown spar and a cream lattice panel each
      const [hx, hy] = P(100, 104);
      for (const a of [0, 90, 180, 270]) {
        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate((a * Math.PI) / 180);
        if (PAINT.hx) { PAINT.hx.save(); PAINT.hx.translate(hx, hy); PAINT.hx.rotate((a * Math.PI) / 180); }
        knife(ctx, r, -3 * f, 0, -Math.PI / 2, 84 * f, 5 * f, hex("#8a6a52"));
        for (let i = 0; i < 6; i++) knife(ctx, r, 3 * f, (-30 - i * 11) * f, 0, 25 * f, 11 * f, mix(hex("#efe6d6"), hex("#fffaf0"), r()), 0.95);
        for (const v of [-52, -74]) stroke(ctx, r, 3 * f, v * f, 0, 25 * f, 1.6 * f, hex("#8a6a52"), 0.9, 0);
        stroke(ctx, r, 28 * f, -30 * f, -Math.PI / 2, 66 * f, 1.6 * f, hex("#8a6a52"), 0.9, 0);
        ctx.restore();
        if (PAINT.hx) PAINT.hx.restore();
      }
      dab(ctx, hx, hy, 6 * f, 6 * f, 0, hex("#8a6a52"), 1);
    });
  }

  /**
   * The Work page's fountain, repainted: a stone lower basin, a stem, an upper
   * bowl and a spout, with still water in both basins. Coordinates follow the
   * Work drawing (220 × 200, ground at y 184), scaled by f. Falling water is a
   * separate pair of layers (two brush takes) that appear when it flows.
   */
  function fountain(x, base, f, seed, parts = "stone") {
    const r = rng(seed);
    const P = (u, v) => [x + (u - 110) * f, base + (v - 184) * f];
    const stone = (lit) => mix(hex("#c9bfae"), hex("#f2ece0"), lit);
    withThickness(0.9, () => {
      if (parts === "stone") {
        ctx.save();
        ctx.filter = `blur(${6 * k}px)`;
        glaze(ctx, ...P(116, 184), 96 * f, 12 * f, SHADOW, 0.4);
        ctx.restore();
        const lower = new Path2D();
        lower.moveTo(...P(30, 150)); lower.quadraticCurveTo(...P(110, 196), ...P(190, 150)); lower.lineTo(...P(190, 162)); lower.quadraticCurveTo(...P(110, 206), ...P(30, 162)); lower.closePath();
        ctx.fillStyle = rgba(stone(0.5));
        ctx.fill(lower);
        clipBoth(ctx, lower);
        for (let i = 0; i < 26; i++) { const [px, py] = P(30 + r() * 160, 150 + r() * 46); knife(ctx, r, px, py, (r() - 0.5) * 0.3, 18 * f, 8 * f, stone(clamp(0.9 - (px - P(30, 0)[0]) / (160 * f)))); }
        unclipBoth(ctx);
        dab(ctx, ...P(110, 150), 80 * f, 18 * f, 0, stone(0.85), 1);
        dab(ctx, ...P(110, 151), 68 * f, 13 * f, 0, hex("#a9cfd3"), 1);
        for (let i = 0; i < 8; i++) stroke(ctx, r, ...P(60 + r() * 90, 146 + r() * 9), (r() - 0.5) * 0.2, 18 * f, 2.5 * f, hex("#dcefee"), 0.7, 0);
        knife(ctx, r, ...P(100, 150), -Math.PI / 2, 54 * f, 20 * f, stone(0.7));
        const bowl = new Path2D();
        bowl.moveTo(...P(66, 92)); bowl.quadraticCurveTo(...P(110, 120), ...P(154, 92)); bowl.closePath();
        ctx.fillStyle = rgba(stone(0.55));
        ctx.fill(bowl);
        dab(ctx, ...P(110, 92), 44 * f, 9 * f, 0, stone(0.88), 1);
        dab(ctx, ...P(110, 92), 36 * f, 6 * f, 0, hex("#a9cfd3"), 1);
        knife(ctx, r, ...P(106, 92), -Math.PI / 2, 30 * f, 8 * f, stone(0.75));
        dab(ctx, ...P(110, 62), 5 * f, 5 * f, 0, stone(0.8), 1);
        for (const [u, v, c] of [[24, 180, "#6f8a5a"], [198, 178, "#6f8a5a"]]) for (let i = 0; i < 6; i++) stroke(ctx, r, ...P(u + (r() - 0.5) * 10, v), -Math.PI / 2 + (r() - 0.5) * 0.8, 16 * f, 3 * f, hex(c), 0.9, 1);
        return;
      }
      // flowing water: arcs from the spout into the bowl, curtains from the bowl to the basin
      const take = parts === "water-b" ? 1 : 0;
      const arc = (pts, w, n) => {
        for (let j = 0; j < n; j++) {
          const o = (r() - 0.5) * 3 * f + take * 1.5 * f;
          for (let i = 0; i < pts.length - 1; i++) {
            const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
            const t = (i + r()) / (pts.length - 1);
            if (r() < 0.15 + take * 0.1) continue; // breaks in the stream
            stroke(ctx, r, ax + o, ay, Math.atan2(by - ay, bx - ax), Math.hypot(bx - ax, by - ay) * 1.05, w * f * (0.6 + r() * 0.6), mix(hex("#bfe3e7"), hex("#ffffff"), 0.3 + r() * 0.6 * (1 - t * 0.3)), 0.55 + r() * 0.35, 1);
          }
        }
      };
      const curve = (p0, c, p1, n = 8) => Array.from({ length: n + 1 }, (_, i) => {
        const t = i / n;
        return [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]];
      });
      arc(curve(P(110, 58), P(82, 50), P(72, 90)), 3.2, 3);
      arc(curve(P(110, 58), P(138, 50), P(148, 90)), 3.2, 3);
      arc(curve(P(68, 94), P(60, 118), P(56, 148)), 2.8, 3);
      arc(curve(P(152, 94), P(160, 118), P(164, 148)), 2.8, 3);
      // splash and foam where the water lands
      for (const [u, v] of [[72, 92], [148, 92], [56, 150], [164, 150]]) for (let i = 0; i < 5; i++) dab(ctx, ...P(u + (r() - 0.5) * 12, v + (r() - 0.5) * 4), (1.5 + r() * 2) * f, (1 + r()) * f, 0, hex("#f6fdfd"), 0.85);
      for (let i = 0; i < 6; i++) stroke(ctx, r, ...P(60 + r() * 100, 147 + r() * 8), 0, (10 + r() * 14) * f, 1.6 * f, hex("#ffffff"), 0.6, 0);
    });
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
  if (L.windmill) {
    // the tower into the scene; the sails on their own layer, turning about the hub
    const [wx, wb, wh] = L.windmill, x = X(wx), base = Y(wb), f = (wh * W) / 290;
    windmill(x, base, f, 470, "tower");
    const hx = x, hy = base + (104 - 276) * f, rad = 90 * f;
    sprite("sails", 1, hx - rad, hy - rad, 2 * rad, 2 * rad, [0.5, 0.5], () => windmill(x, base, f, 471, "sails"), {
      kind: "sails", hit: [+((x - 45 * f) / W).toFixed(4), +((hy - rad) / S).toFixed(4), +((90 * f) / W).toFixed(4), +((base - hy + rad) / S).toFixed(4)],
    });
  }
  cottage(X(L.cottage[0]), Y(L.cottage[1]), L.cottage[2] * W, 440);
  for (const [i, f] of (L.fences ?? []).entries()) fence(X(f[0]), X(f[1]), Y(f[2]), Y(f[3]), 445 + i);
  for (const b of L.borders ?? []) pathBorder(b[0], b[1], b[2]);
  for (const cl of L.clusters1) cluster(cl);
  if (L.fountain) {
    const [fxf, fb, fw] = L.fountain, x = X(fxf), base = Y(fb), f = (fw * W) / 220;
    fountain(x, base, f, 480, "stone");
    const bx = x - 110 * f, by = base - 184 * f, bw = 220 * f, bh = 200 * f;
    for (const take of ["water-a", "water-b"]) sprite(`fountain-${take}`, 1, bx, by, bw, bh, [0.5, 0.5], () => fountain(x, base, f, take === "water-a" ? 481 : 482, take), { kind: take });
  }
  for (const [i, d] of L.dogs.entries()) {
    const x = X(d.x), y = Y(d.y), s = d.s * W;
    dog(x, y, s, d.pose, d.coat, d.dir, 450 + i, "shadow");
    const bx = x - 0.75 * s, by = y - 1.05 * s, bw = 1.5 * s, bh = 1.13 * s;
    const [tu, tv] = DOG_TAIL[d.pose];
    const tx = x + d.dir * tu * s, ty = y + tv * s;
    sprite(`dog-${i}-tail`, 1, bx, by, bw, bh, [(tx - bx) / bw, (ty - by) / bh], () => dog(x, y, s, d.pose, d.coat, d.dir, 450 + i, "tail"), { kind: "tail", dog: i });
    sprite(`dog-${i}`, 1, bx, by, bw, bh, [0.5, (y - by) / bh], () => dog(x, y, s, d.pose, d.coat, d.dir, 450 + i, "body"), { kind: "dog", dog: i, pose: d.pose });
  }
  if (L.ball) {
    const x = X(L.ball[0]), y = Y(L.ball[1]), bs = L.ball[2] * W;
    ball(x, y, bs, "shadow");
    sprite("ball", 1, x - 1.5 * bs, y - 1.5 * bs, 3 * bs, 3 * bs, [0.5, 0.5], () => ball(x, y, bs, "body"), { kind: "ball" });
  }
  for (const fl of L.leaves1) fallenLeaves(X(fl[0]), Y(fl[1]), X(fl[2]), Y(fl[3]), fl[4], 460 + fl[4]);
  tufts(L.tufts1 ?? [], 1, 820);
  tufts(L.sprigs1 ?? [], 1, 840, "sprig");

  // ---- scene 2: the shrub and flowers (landscape unchanged)
  shrub(X(L.shrub[0]), tops.shrubHill(X(L.shrub[0])) + Y(0.03), L.shrub[1] * W, 501);
  for (const cl of L.clusters2) cluster(cl);
  tufts(L.tufts2 ?? [], 2, 860);
  tufts(L.sprigs2 ?? [], 2, 880, "sprig");

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
    if (T.chairBack) {
      const [cxf, cyf, csf] = T.chairBack;
      const x = X(cxf), y = Y(cyf), cs = csf * W;
      rockingChair(x, y, cs, -1, 640, "shadow");
      const bx = x - 0.75 * cs, by = y - 1.18 * cs, bw = 1.5 * cs, bh = 1.26 * cs;
      // rocking pivots where the runners touch the ground
      sprite("chair", 3, bx, by, bw, bh, [(x - bx) / bw, (y - by) / bh], () => rockingChair(x, y, cs, -1, 640), { kind: "chair" });
    }
    {
      // the table is its own layer, above the rocking chair that stands behind it
      const tx = X(T.table[0]), ty = Y(T.table[1]), R = T.table[2] * W;
      teaTable(tx, ty, R, 650, "shadow");
      const bx = tx - 1.2 * R, by = ty - 0.8 * R, bw = 2.4 * R, bh = 1.9 * R;
      sprite("table", 3, bx, by, bw, bh, [0.5, 0.5], () => teaTable(tx, ty, R, 650, "table"), { kind: "front" });
    }
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
  if (process.argv.includes("--debug")) {
    // scene 2 with every hill's crest line drawn and numbered, to choose where the notes go
    const dbg = createCanvas(W / 2, S / 2);
    const dc = dbg.getContext("2d");
    dc.drawImage(cv, 0, S, W, S, 0, 0, W / 2, S / 2);
    dc.lineWidth = 3;
    dc.font = "bold 28px sans-serif";
    L.mounds.forEach((m, i) => {
      dc.strokeStyle = `hsl(${i * 47} 90% 50%)`;
      dc.fillStyle = dc.strokeStyle;
      dc.beginPath();
      for (let x = 0; x <= W; x += 8) dc.lineTo(x / 2, (moundTops[i](x) - S) / 2);
      dc.stroke();
      dc.fillText(String(i), X(m[0]) / 2, (Y(m[1]) - S) / 2 - 6);
    });
    for (let g = 0; g <= 10; g++) { dc.fillStyle = "#000"; dc.fillText((g / 10).toFixed(1), g * W / 20, 24); dc.fillText((g / 10).toFixed(1), 4, g * S / 20); }
    fs.writeFileSync(path.join(PREVIEW_DIR, `debug-scene2-${F.name}.jpg`), dbg.toBuffer("image/jpeg", 85));
  }
  PAINT.hx = null;
  anchors.sprites = sprites.map((sp) => Object.fromEntries(Object.entries(sp).filter(([key]) => key !== "canvas")));
  return { cv, anchors, sprites };
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
    // The first view of a 4:3 scene on a typical screen (with browser toolbars) is only
    // its top ~70% (1440×790 → 0.73, 1280×690 → 0.72), and the title sits at its centre
    // (≈ 0.36). So: sky to ~0.42 behind the title, the cottage, trees, path and all three
    // dogs between 0.42 and 0.68, and only meadow and flowers below that.
    skyStops: [[0, "#e3a5b4"], [0.14, "#eab1b6"], [0.26, "#f0c0b5"], [0.34, "#f6d0bb"], [0.39, "#fadfc6"], [0.46, "#fbe7d0"]],
    skyEnd: 0.48,
    sun: [0.6, 0.39],
    clouds: [
      { x: 0.15, y: 0.1, rx: 0.17, ry: 0.045, col: "#efb5b8", shade: "#d98f9a", strokes: 280 },
      { x: 0.85, y: 0.065, rx: 0.2, ry: 0.06, col: "#f1bdb8", shade: "#d9929d", strokes: 380 },
      { x: 0.5, y: 0.03, rx: 0.12, ry: 0.018, col: "#f3c4bd", shade: "#e4a1a6", strokes: 120 },
      { x: 0.07, y: 0.28, rx: 0.09, ry: 0.012, col: "#f7d3bf", shade: "#eab0a4", strokes: 80 },
      { x: 0.93, y: 0.3, rx: 0.08, ry: 0.012, col: "#f9dcc4", shade: "#eab0a4", strokes: 70, glow: 1.4 },
    ],
    far1: [[0, 0.39], [0.22, 0.37], [0.45, 0.385], [0.7, 0.365], [1, 0.38]],
    far2: [[0, 0.41], [0.3, 0.4], [0.55, 0.415], [0.8, 0.405], [1, 0.41]],
    midL: [0.2, 0.42, 0.42, 0.03],
    midR: [0.82, 0.43, 0.4, 0.03],
    midTrees: [[0.36, 0.007], [0.39, 0.005], [0.58, 0.006], [0.84, 0.006]],
    // [centre x, crest y, half-width, height, shade depth, palette, name]
    mounds: [
      [0.5, 0.455, 0.85, 0.03, 0.4, "sage", "near"],
      [0.95, 0.56, 0.3, 0.05, 0.2, "moss"],
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
    path: [[0.15, 0.494, 0.008], [0.24, 0.52, 0.01], [0.36, 0.555, 0.013], [0.47, 0.61, 0.016], [0.54, 0.7, 0.02], [0.57, 0.82, 0.022], [0.56, 0.97, 0.024], [0.6, 1.15, 0.034], [0.55, 1.35, 0.044], [0.5, 1.55, 0.055], [0.6, 1.75, 0.065], [0.55, 1.98, 0.07], [0.62, 2.16, 0.062], [0.72, 2.36, 0.056], [0.81, 2.55, 0.052], [0.85, 2.7, 0.05], [0.85, 2.78, 0.05]],
    cottage: [0.13, 0.498, 0.15],
    fences: [[0.2, 0.3, 0.517, 0.03]],
    trees1: [
      { x: 0.92, s: 0.09, kind: "autumn", leaves: [0.56, 0.08, 0.02, 60], y: 0.555 },
      { x: 0.03, s: 0.05, kind: "autumn", leaves: [0.495, 0.04, 0.01, 25], y: 0.49 },
      { x: 0.31, s: 0.022, kind: "turning", y: 0.5 },
      { x: 0.66, s: 0.03, kind: "autumn", leaves: [0.535, 0.04, 0.01, 20], y: 0.53 },
    ],
    shrubs1: [[0.06, 0.52, 0.035, "pink"], [0.22, 0.512, 0.03, "white"], [0.45, 0.525, 0.026, "pink"], [0.76, 0.555, 0.03, "white"], [0.97, 0.585, 0.04, "pink"]],
    dogs: [
      { x: 0.58, y: 0.625, s: 0.068, pose: "trot", coat: ["#c9935e", "#7a5234", "#f0d3a8"], dir: 1 },
      { x: 0.76, y: 0.61, s: 0.062, pose: "bow", coat: ["#f3e6cf", "#b59c7c", "#fffaf0"], dir: -1 },
      { x: 0.67, y: 0.665, s: 0.058, pose: "sit", coat: ["#6b5243", "#3b2c24", "#e9dccb"], dir: 1 },
    ],
    ball: [0.665, 0.62, 0.009],
    leaves1: [[0.5, 0.75, 0.4, 0.05, 50], [0.4, 0.58, 0.08, 0.03, 14], [0.3, 0.86, 0.2, 0.03, 20]],
    clusters1: [
      { seed: 701, x: 0.26, y: 0.535, rx: 0.05, ry: 0.01, n: 30, size: [4, 7], kinds: ["cosmos", "daisy", "tiny"] },
      { seed: 702, x: 0.12, y: 0.8, rx: 0.12, ry: 0.04, n: 70, size: [9, 16], kinds: ["daisy", "cosmos", "tiny", "spike"], foliage: true, stems: true },
      { seed: 703, x: 0.9, y: 0.82, rx: 0.1, ry: 0.035, n: 60, size: [9, 16], kinds: ["daisy", "daisy", "tiny", "cosmos"], foliage: true, stems: true },
      { seed: 704, x: 0.45, y: 0.58, rx: 0.1, ry: 0.012, n: 50, size: [2.5, 4.5], kinds: ["tiny"] },
      { seed: 705, x: 0.86, y: 0.69, rx: 0.08, ry: 0.015, n: 40, size: [3, 6], kinds: ["tiny", "daisy"] },
      { seed: 706, x: 0.17, y: 0.74, rx: 0.1, ry: 0.03, n: 45, size: [6, 11], kinds: ["cosmos", "daisy", "tiny"], foliage: true },
      { seed: 707, x: 0.62, y: 0.86, rx: 0.12, ry: 0.035, n: 55, size: [9, 15], kinds: ["daisy", "cosmos", "tiny"], foliage: true, stems: true },
      { seed: 708, x: 0.1, y: 0.62, rx: 0.06, ry: 0.012, n: 30, size: [3, 5], kinds: ["tiny"] },
    ],
    borders: [[0.5, 0.95, 607]],
    // decorative only here: windmill [x, ground, height as a fraction of width], fountain [x, ground, width]
    windmill: [0.795, 0.47, 0.098],
    fountain: [0.3, 0.665, 0.14],
    // scene 2's interactive grass (x, ground y, height as a fraction of width, flowers) and leafy sprigs (…, lean)
    tufts2: [[0.68, 1.12, 0.06, 1], [0.95, 1.18, 0.055, 0], [0.27, 1.47, 0.06, 2], [0.03, 1.47, 0.055, 0], [0.72, 1.5, 0.06, 1], [0.97, 1.52, 0.06, 2], [0.4, 1.975, 0.065, 1], [0.95, 1.975, 0.06, 1]],
    sprigs2: [[0.86, 1.43, 0.075, -1], [0.45, 1.44, 0.065, 1], [0.08, 1.86, 0.08, 1]],
    shrub: [0.84, 0.075],
    clusters2: [
      { seed: 711, x: 0.66, y: 1.6, rx: 0.06, ry: 0.035, n: 40, size: [6, 11], kinds: ["cosmos", "cosmos", "daisy", "tiny"], foliage: true },
      { seed: 712, x: 0.22, y: 1.86, rx: 0.12, ry: 0.06, n: 70, size: [8, 15], kinds: ["daisy", "daisy", "daisy", "tiny"], foliage: true },
      { seed: 713, x: 0.9, y: 1.62, rx: 0.06, ry: 0.05, n: 28, size: [8, 14], kinds: ["spike", "daisy", "tiny"] },
      { seed: 714, x: 0.42, y: 1.45, rx: 0.12, ry: 0.025, n: 90, size: [2.5, 5], kinds: ["tiny"] },
      { seed: 715, x: 0.75, y: 1.82, rx: 0.1, ry: 0.03, n: 70, size: [3, 6], kinds: ["tiny", "daisy"] },
    ],
    // scene 2 notes: on which hill, where along it, how far below the crest
    // scene 2 notes: each line rests on a real hill edge (mound index, x range, row above the edge)
    noteFont: 72,
    phrases: [
      { lines: [{ mound: 4, x0: 0.07, x1: 0.57, row: 0 }] },
      { lines: [{ mound: 6, x0: 0.01, x1: 0.38, row: 1 }, { mound: 6, x0: 0.01, x1: 0.38, row: 0 }] },
      { lines: [{ mound: 7, x0: 0.26, x1: 0.53, row: 0 }, { mound: 7, x0: 0.6, x1: 0.94, row: 0 }] },
    ],
    tea: {
      tree: [0.11, 2.6, 0.17],
      table: [0.37, 2.57, 0.16],
      chairBack: [0.5, 2.385, 0.11],
      chairFront: null,
      hedge: [0.66, 1.06, 2.72, 2.9],
      gate: [0.79, 0.92],
      post: [0.965, 2.74, 0.77],
      sign: { x: 0.865, y: 2.43, w: 0.17 },
    },
    clusters3: [
      { seed: 721, x: 0.37, y: 2.84, rx: 0.2, ry: 0.035, n: 80, size: [12, 20], kinds: ["daisy", "cosmos", "tiny", "spike"], foliage: true, stems: true },
      { seed: 722, x: 0.45, y: 2.16, rx: 0.1, ry: 0.02, n: 40, size: [4, 8], kinds: ["tiny", "daisy"] },
      { seed: 723, x: 0.64, y: 2.47, rx: 0.05, ry: 0.025, n: 30, size: [7, 12], kinds: ["cosmos", "daisy"], foliage: true },
    ],
    foreground: [[-0.02, 0.2, 2.86, 220, 801]],
    clustersFront: [
      { seed: 731, x: 0.1, y: 2.94, rx: 0.1, ry: 0.035, n: 40, size: [16, 28], kinds: ["daisy", "cosmos", "daisy"], stems: true, foliage: true, th: 1 },
      { seed: 732, x: 0.88, y: 2.95, rx: 0.1, ry: 0.035, n: 36, size: [16, 28], kinds: ["daisy", "cosmos", "spike"], stems: true, foliage: true, th: 1 },
    ],
    zones: [
      { x: 0.5, y: 0.36, rx: 0.36, ry: 0.1, amt: 0.6 }, // title
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
    ],
    shrubs1: [[0.06, 0.725, 0.08, "pink"], [0.47, 0.705, 0.06, "white"], [0.97, 0.79, 0.07, "pink"]],
    dogs: [
      { x: 0.36, y: 0.795, s: 0.15, pose: "trot", coat: ["#c9935e", "#7a5234", "#f0d3a8"], dir: 1 },
      { x: 0.79, y: 0.785, s: 0.14, pose: "bow", coat: ["#f3e6cf", "#b59c7c", "#fffaf0"], dir: -1 },
      { x: 0.59, y: 0.835, s: 0.13, pose: "sit", coat: ["#6b5243", "#3b2c24", "#e9dccb"], dir: 1 },
    ],
    ball: [0.59, 0.79, 0.014],
    leaves1: [[0.5, 0.94, 0.45, 0.03, 30], [0.7, 0.78, 0.15, 0.02, 12]],
    clusters1: [
      { seed: 701, x: 0.2, y: 0.77, rx: 0.14, ry: 0.01, n: 24, size: [5, 8], kinds: ["cosmos", "daisy", "tiny"] },
      { seed: 702, x: 0.14, y: 0.95, rx: 0.16, ry: 0.03, n: 40, size: [10, 16], kinds: ["daisy", "cosmos", "tiny"], foliage: true, stems: true },
      { seed: 703, x: 0.88, y: 0.96, rx: 0.14, ry: 0.03, n: 34, size: [10, 16], kinds: ["daisy", "tiny", "cosmos"], foliage: true, stems: true },
      { seed: 706, x: 0.7, y: 0.76, rx: 0.12, ry: 0.015, n: 30, size: [3, 6], kinds: ["tiny"] },
    ],
    borders: [[0.73, 0.95, 607]],
    windmill: [0.6, 0.655, 0.152],
    fountain: [0.12, 0.85, 0.25],
    tufts2: [[0.85, 1.47, 0.13, 1], [0.92, 1.86, 0.14, 0], [0.08, 1.86, 0.14, 2], [0.76, 1.12, 0.12, 0], [0.1, 1.43, 0.12, 1]],
    sprigs2: [[0.95, 1.6, 0.16, -1]],
    shrub: [0.86, 0.15],
    clusters2: [
      { seed: 711, x: 0.74, y: 1.62, rx: 0.12, ry: 0.03, n: 30, size: [8, 13], kinds: ["cosmos", "cosmos", "daisy", "tiny"], foliage: true },
      { seed: 712, x: 0.2, y: 1.84, rx: 0.2, ry: 0.05, n: 45, size: [10, 17], kinds: ["daisy", "daisy", "tiny"], foliage: true },
    ],
    noteFont: 70,
    phrases: [
      { lines: [{ mound: 4, x0: 0.02, x1: 0.62, row: 1 }, { mound: 4, x0: 0.02, x1: 0.62, row: 0 }] },
      { lines: [{ mound: 6, x0: 0.0, x1: 0.43, row: 1 }, { mound: 6, x0: 0.0, x1: 0.43, row: 0 }] },
      { lines: [{ mound: 7, x0: 0.47, x1: 0.99, row: 1 }, { mound: 7, x0: 0.28, x1: 0.99, row: 0 }] },
    ],
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


// ---------------------------------------------------------------- the Work garden

const WORK_DESKTOP = {
  name: "work-desktop", work: true, W: 2400, S: 1350, H: 1350, k: 1,
  layout: {
    mounds: [], phrases: [], zones: [],
    skyEnd: 0.42, sun: [0.42, 0.38],
    clouds: [[0.18, 0.1, 0.16, 0.05], [0.84, 0.08, 0.18, 0.06], [0.5, 0.26, 0.2, 0.025]],
    far: [[0, 0.4], [0.25, 0.375], [0.5, 0.395], [0.75, 0.37], [1, 0.39]],
    // [centre x, crest y, half-width, height, palette]
    hills: [[0.25, 0.43, 0.5, 0.04, "sage"], [0.82, 0.45, 0.45, 0.04, "moss"], [0.5, 0.53, 0.95, 0.03, "sage"]],
    // paths from the girl's spot to each landmark: [from, control, to, width at start, width at end]
    trails: [
      [[0.6, 0.9], [0.42, 0.88], [0.3, 0.8], 0.05, 0.032],
      [[0.6, 0.9], [0.55, 0.78], [0.5, 0.67], 0.05, 0.03],
      [[0.6, 0.9], [0.72, 0.84], [0.72, 0.7], 0.05, 0.032],
    ],
    trees: [[0.05, 0.64, 0.075, "autumn"], [0.965, 0.7, 0.07, "turning"], [0.34, 0.48, 0.02, "green"], [0.64, 0.475, 0.016, "green"]],
    clusters: [
      { seed: 901, x: 0.1, y: 0.9, rx: 0.08, ry: 0.03, n: 40, size: [9, 15], kinds: ["daisy", "cosmos", "tiny"], foliage: true, stems: true },
      { seed: 902, x: 0.92, y: 0.9, rx: 0.07, ry: 0.03, n: 36, size: [9, 15], kinds: ["daisy", "tiny", "spike"], foliage: true, stems: true },
      { seed: 903, x: 0.4, y: 0.6, rx: 0.08, ry: 0.01, n: 30, size: [2.5, 4.5], kinds: ["tiny"] },
    ],
    start: [0.6, 0.9],
    girlH: 0.16,
    landmarks: [
      { slug: "eliminate-bacteria-pro", kind: "fountain", x: 0.2, base: 0.78, w: 0.2, stand: [0.295, 0.8], face: -1, label: [0.2, 0.82] },
      { slug: "dog-nutrition-tracker", kind: "doghouse", x: 0.43, base: 0.62, w: 0.15, puppy: [0.54, 0.655, 0.06], stand: [0.49, 0.662], face: 1, label: [0.46, 0.66] },
      { slug: "little-moments", kind: "windmill", x: 0.8, base: 0.65, h: 0.26, stand: [0.71, 0.705], face: 1, label: [0.8, 0.68] },
    ],
  },
};

const WORK_MOBILE = {
  name: "work-mobile", work: true, W: 1080, S: 1920, H: 1920, k: 0.75,
  layout: {
    ...WORK_DESKTOP.layout,
    skyEnd: 0.26, sun: [0.4, 0.24],
    clouds: [[0.2, 0.06, 0.3, 0.025], [0.82, 0.12, 0.3, 0.03]],
    far: [[0, 0.245], [0.5, 0.23], [1, 0.245]],
    hills: [[0.2, 0.27, 0.6, 0.03, "sage"], [0.85, 0.29, 0.5, 0.03, "moss"], [0.5, 0.34, 1.2, 0.02, "sage"]],
    trails: [
      [[0.4, 0.94], [0.44, 0.8], [0.5, 0.69], 0.12, 0.07],
      [[0.4, 0.94], [0.3, 0.9], [0.26, 0.83], 0.12, 0.08],
      [[0.4, 0.94], [0.6, 0.62], [0.55, 0.5], 0.12, 0.06],
    ],
    trees: [[0.08, 0.4, 0.11, "autumn"]],
    clusters: [
      { seed: 901, x: 0.12, y: 0.95, rx: 0.14, ry: 0.02, n: 24, size: [10, 16], kinds: ["daisy", "cosmos", "tiny"], foliage: true, stems: true },
      { seed: 902, x: 0.88, y: 0.95, rx: 0.12, ry: 0.02, n: 22, size: [10, 16], kinds: ["daisy", "tiny"], foliage: true, stems: true },
    ],
    start: [0.4, 0.94],
    girlH: 0.1,
    landmarks: [
      { slug: "eliminate-bacteria-pro", kind: "fountain", x: 0.28, base: 0.64, w: 0.44, stand: [0.47, 0.65], face: -1, label: [0.28, 0.66] },
      { slug: "dog-nutrition-tracker", kind: "doghouse", x: 0.62, base: 0.8, w: 0.3, puppy: [0.34, 0.815, 0.13], stand: [0.26, 0.82], face: 1, label: [0.62, 0.82] },
      { slug: "little-moments", kind: "windmill", x: 0.7, base: 0.44, h: 0.44, stand: [0.55, 0.5], face: 1, label: [0.7, 0.465] },
    ],
  },
};

/**
 * The Landing title, hand-lettered with a brush, letter by letter. Each glyph
 * starts from a brushed hand (Bradley Hand Bold, set lowercase as
 * "a garden / of ideas" on two staggered lines, like hand lettering laid into
 * a painting). The letter is then repainted with strokes that run along its own
 * shape (directions taken from the letter's edges), in deep garden greens with
 * a few blush and cream-yellow deposits, given an impasto relief, and its edges
 * broken up like a dry brush. The dot of the "i" is a small painted flower.
 * Each letter is its own transparent layer for the page to animate.
 */
function paintTitle() {
  const F = 260, PAD = Math.round(F * 0.1);
  const FONT = `700 ${F}px "Bradley Hand"`;
  const measure = createCanvas(10, 10).getContext("2d");
  measure.font = FONT;
  const LINES = ["a garden", "of ideas"];
  // a softer garden palette: muted olive and warm moss, with dusty rose, blush, butter, cream and a little mauve
  const GREENS = ["#5a663c", "#667244", "#727d4c", "#5f6c47", "#7d8556", "#6c7a55"];
  const ACCENTS = [["#c98990", 0.3], ["#e6b2ae", 0.25], ["#ead594", 0.2], ["#efe2c6", 0.12], ["#a88aa2", 0.13]];
  const TINTS = ["#c98990", "#a88aa2", "#d1a48f"]; // some letters lean a little rosy or mauve
  const letters = [];
  let idx = 0;
  const paintLetter = (ch, seed) => {
    const glyph = ch === "i" ? "ı" : ch; // the i's dot becomes a flower
    const m = measure.measureText(glyph);
    const L = Math.ceil(m.actualBoundingBoxLeft), R = Math.ceil(m.actualBoundingBoxRight);
    const A = Math.ceil(ch === "i" ? m.actualBoundingBoxAscent + F * 0.42 : m.actualBoundingBoxAscent), D = Math.ceil(m.actualBoundingBoxDescent);
    const w = L + R + PAD * 2 + (ch === "i" ? Math.round(F * 0.12) : 0), h = A + D + PAD * 2, ox = L + PAD, oy = A + PAD;
    const r = rng(seed);
    // 1 · the letter's shape, slightly softened
    const mk = createCanvas(w, h), mc = mk.getContext("2d");
    mc.font = FONT;
    mc.fillStyle = "#fff";
    mc.strokeStyle = "#fff";
    mc.lineJoin = "round";
    mc.lineCap = "round";
    if (ch === "i") {
      // a plain lowercase i: one straight brushed stem (no hook), the flower above it is its dot
      const top = oy - m.actualBoundingBoxAscent * 0.96, sx = ox + m.width * 0.42;
      mc.lineWidth = F * 0.085;
      mc.beginPath();
      mc.moveTo(sx + F * 0.012, top + F * 0.02);
      mc.lineTo(sx, oy - F * 0.03);
      mc.stroke();
    } else {
      mc.fillText(glyph, ox, oy);
      // a fuller brush: trace the outline too, so the strokes are as bold as a loaded brush
      mc.lineWidth = F * 0.03;
      mc.strokeText(glyph, ox, oy);
    }
    const base = mc.getImageData(0, 0, w, h).data;
    // the direction of travel at each point: along the letter, i.e. across the gradient of a blurred copy
    const bl = createCanvas(w, h), bc = bl.getContext("2d");
    bc.filter = `blur(${F * 0.03}px)`;
    bc.drawImage(mk, 0, 0);
    const bd = bc.getImageData(0, 0, w, h).data;
    const a = (x, y) => bd[(Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))) * 4 + 3];
    const along = (x, y) => {
      const gx = a(x + 3, y) - a(x - 3, y), gy = a(x, y + 3) - a(x, y - 3);
      return Math.hypot(gx, gy) < 4 ? null : Math.atan2(gy, gx) + Math.PI / 2;
    };
    // 2 · the paint: strokes following the letter, with its own height map
    const cv = createCanvas(w, h), ctx = cv.getContext("2d");
    const hcv = createCanvas(w, h), hx = hcv.getContext("2d");
    hx.fillStyle = grey(30);
    hx.fillRect(0, 0, w, h);
    PAINT.hx = hx;
    ctx.fillStyle = rgba(hex("#626d43"));
    ctx.fillRect(0, 0, w, h);
    const patches = [];
    const nP = 1 + Math.floor(r() * 2.5);
    for (let p = 0; p < nP; p++) {
      let pick = r(), col = ACCENTS[0][0];
      for (const [c, wgt] of ACCENTS) { if (pick < wgt) { col = c; break; } pick -= wgt; }
      patches.push({ x: ox - L + r() * (L + R), y: oy - A * 0.8 + r() * (A * 0.8 + D), rad: F * (0.06 + r() * 0.06), col: hex(col) });
    }
    const tint = r() < 0.3 ? [hex(TINTS[Math.floor(r() * TINTS.length)]), 0.28 + r() * 0.14] : null;
    const greenAt = (x, y) => {
      const g = hex(GREENS[Math.min(GREENS.length - 1, Math.floor(clamp(fbm(x / (F * 0.25), y / (F * 0.25), seed + 3, 3) * 0.9 + 0.5) * GREENS.length))]);
      return tint ? mix(g, tint[0], tint[1]) : g;
    };
    withThickness(0.9, () => {
      const n = Math.round((w * h) / (F * F) * 1500);
      for (let s2 = 0; s2 < n; s2++) {
        const x = Math.floor(r() * w), y = Math.floor(r() * h);
        if (base[(y * w + x) * 4 + 3] < 40 && r() < 0.85) continue;
        let ang = along(x, y);
        if (ang === null) ang = fbm(x / (F * 0.3), y / (F * 0.3), seed + 5, 2) * 2.4;
        ang += (r() - 0.5) * 0.35;
        let col = greenAt(x, y);
        for (const p of patches) { const d = Math.hypot(x - p.x, y - p.y) / p.rad; if (d < 1 && r() < 1.3 - d) col = p.col; }
        col = mix(col, r() < 0.6 ? hex("#efe2c6") : SHADOW, r() * 0.14);
        stroke(ctx, r, x, y, ang + (r() < 0.5 ? 0 : Math.PI), F * (0.06 + r() * 0.08), F * (0.03 + r() * 0.02), col, 1, 3);
      }
    });
    // 3 · a dry-brush edge: the shape (only lightly softened) thresholded against noise stretched along the stroke
    const eg = createCanvas(w, h), ec = eg.getContext("2d");
    ec.filter = `blur(${F * 0.009}px)`;
    ec.drawImage(mk, 0, 0);
    const ed = ec.getImageData(0, 0, w, h).data;
    const md = mc.getImageData(0, 0, w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = (y * w + x) * 4;
      const ang = along(x, y) ?? 0;
      const u = x * Math.cos(ang) + y * Math.sin(ang), v = -x * Math.sin(ang) + y * Math.cos(ang);
      const streak = fbm(u / (F * 0.2), v / (F * 0.012), seed + 9, 2); // long along the stroke, fine across it
      const t = 122 + streak * 70 + fbm(x / (F * 0.08), y / (F * 0.08), seed + 1, 2) * 30;
      md.data[k + 3] = clamp((ed[k + 3] - t) / 22 + 0.5) * 255;
    }
    mc.putImageData(md, 0, 0);
    // 4 · the i's flower: five blush petals and a honey centre, painted with relief
    if (ch === "i") {
      const fx = ox + m.width * 0.42 + F * 0.03, fy = oy - m.actualBoundingBoxAscent - F * 0.2, pr = F * 0.12;
      withThickness(0.7, () => {
        for (let p = 0; p < 5; p++) {
          const ang = -Math.PI / 2 + (p / 5) * Math.PI * 2 + 0.3;
          const px = fx + Math.cos(ang) * pr * 0.62, py = fy + Math.sin(ang) * pr * 0.62;
          const petal = new Path2D();
          petal.ellipse(px, py, pr * 0.62, pr * 0.42, ang, 0, Math.PI * 2);
          const fill = mix(hex("#f2b9bd"), hex("#fbe6e2"), r() * 0.5);
          ctx.fillStyle = rgba(fill);
          ctx.fill(petal);
          mc.fillStyle = "#fff";
          mc.fill(petal);
          for (let k2 = 0; k2 < 5; k2++) stroke(ctx, r, fx + Math.cos(ang) * pr * 0.2, fy + Math.sin(ang) * pr * 0.2, ang + (r() - 0.5) * 0.5, pr * (0.6 + r() * 0.5), pr * 0.18, mix(fill, r() < 0.5 ? hex("#fff4ef") : hex("#e08e98"), 0.4), 0.8, 2);
        }
        dab(ctx, fx, fy, pr * 0.24, pr * 0.24, 0, hex("#e3b452"), 1);
        dab(ctx, fx - pr * 0.06, fy - pr * 0.06, pr * 0.1, pr * 0.1, 0, hex("#f6dc8e"), 1);
        mc.beginPath(); mc.arc(fx, fy, pr * 0.3, 0, Math.PI * 2); mc.fill();
        // a short stem leaf, tucked toward the letter
        stroke(ctx, r, fx + pr * 0.35, fy + pr * 0.5, 2.2, pr * 0.9, pr * 0.3, hex("#6f8f55"), 0.95, 1);
        mc.save(); mc.translate(fx + pr * 0.35, fy + pr * 0.5); mc.rotate(2.2); mc.fillRect(0, -pr * 0.15, pr * 0.9, pr * 0.3); mc.restore();
      });
    }
    // 5 · keep paint and relief inside the shape, then light the relief
    for (const c of [ctx, hx]) { c.save(); c.globalCompositeOperation = "destination-in"; c.drawImage(mk, 0, 0); c.restore(); }
    hx.save(); hx.globalCompositeOperation = "destination-over"; hx.fillStyle = grey(20); hx.fillRect(0, 0, w, h); hx.restore();
    lightRelief(cv, hcv, w, h, 1.4);
    ctx.save(); ctx.globalCompositeOperation = "destination-in"; ctx.drawImage(mk, 0, 0); ctx.restore();
    PAINT.hx = null;
    return { w, h, ox, oy, advance: m.width, canvas: cv };
  };
  // lay out the two staggered lines, as hand lettering would sit in a painting
  const place = [];
  // a little air: letters ~7% further apart, wider word gaps, ~10% more between the lines
  const lead = F * 1.05, indent = [0, F * 0.82];
  LINES.forEach((line, li) => {
    let pen = indent[li];
    for (const ch of line) {
      if (ch === " ") { pen += measure.measureText(" ").width * 1.25; continue; }
      const seed = 1500 + idx * 7;
      const Lr = paintLetter(ch, seed);
      letters.push({ ch, idx, ...Lr });
      place.push({ idx, x: +(pen - Lr.ox).toFixed(1), y: +(F * 0.95 + li * lead - Lr.oy).toFixed(1), w: Lr.w, h: Lr.h });
      pen += Lr.advance * 1.03;
      idx++;
    }
  });
  const minX = Math.min(...place.map((p) => p.x)), minY = Math.min(...place.map((p) => p.y));
  for (const p of place) { p.x = +(p.x - minX).toFixed(1); p.y = +(p.y - minY).toFixed(1); }
  const layout = { width: Math.ceil(Math.max(...place.map((p) => p.x + p.w))), height: Math.ceil(Math.max(...place.map((p) => p.y + p.h))), letters: place };
  return { letters, meta: { text: "A Garden of Ideas", lettering: LINES.join(" / "), font: F, chars: letters.map((l) => l.ch), wide: layout, tall: layout } };
}

/**
 * The Landing cursor: a tiny painted butterfly seen from above, head at the
 * top centre (the click point). Left wing, right wing and body are separate
 * layers on the same canvas so the page can flutter the wings about the body.
 */
function paintButterfly() {
  const W = 200, H = 180, cx = 100, top = 34;
  const out = {};
  for (const part of ["left", "right", "body"]) {
    const cv = createCanvas(W, H), ctx = cv.getContext("2d");
    const hcv = createCanvas(W, H), hx = hcv.getContext("2d");
    hx.fillStyle = grey(20);
    hx.fillRect(0, 0, W, H);
    PAINT.hx = hx;
    const r = rng(1400 + (part === "right" ? 1 : 0));
    withThickness(0.8, () => {
      if (part === "body") {
        // a slim olive body, a round head, two fine antennae with knobs
        for (let i = 0; i < 5; i++) stroke(ctx, r, cx + (r() - 0.5) * 2, top + 18, Math.PI / 2, 78, 9 - i, mix(hex("#5d6b3a"), hex("#8c9a5a"), i / 5), 1, 1);
        dab(ctx, cx, top + 12, 8, 8, 0, hex("#4f5c33"), 1);
        for (const side of [-1, 1]) {
          stroke(ctx, r, cx + side * 2, top + 6, -Math.PI / 2 + side * 0.45, 26, 2.2, hex("#4f5c33"), 1, 0);
          dab(ctx, cx + side * 13, top - 17, 3.4, 3.4, 0, hex("#4f5c33"), 1);
        }
        return;
      }
      const d = part === "left" ? -1 : 1;
      const X = (u) => cx + d * u;
      const wing = (pts, base, edge, spots) => {
        const p = new Path2D();
        p.moveTo(X(pts[0][0]), pts[0][1]);
        for (let i = 1; i < pts.length; i += 3) p.bezierCurveTo(X(pts[i][0]), pts[i][1], X(pts[i + 1][0]), pts[i + 1][1], X(pts[i + 2][0]), pts[i + 2][1]);
        p.closePath();
        ctx.fillStyle = rgba(hex(base));
        ctx.fill(p);
        clipBoth(ctx, p);
        // strokes radiating from the body, cream near the root, blush toward the edge
        for (let i = 0; i < 150; i++) {
          const ang = (d < 0 ? Math.PI : 0) + (r() - 0.5) * 2.2, len = 30 + r() * 70;
          const t = r();
          stroke(ctx, r, X(4) + Math.cos(ang) * 6, pts[0][1] + 6 + Math.sin(ang) * 6, ang, len, 7 + r() * 6, mix(hex("#fbeee0"), hex(base), 0.35 + t * 0.6), 0.7, 3);
        }
        // a painted rim and a few sage dots near the edge
        for (let i = 0; i < pts.length - 1; i++) {
          const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
          stroke(ctx, r, X(ax), ay, Math.atan2(by - ay, X(bx) - X(ax)), Math.hypot(X(bx) - X(ax), by - ay) * 1.1, 6, hex(edge), 0.55, 1);
        }
        for (const [u, v, rr] of spots) dab(ctx, X(u), v, rr, rr * 0.85, 0, hex("#9aae7c"), 0.9);
        unclipBoth(ctx);
      };
      // upper wing, then the smaller lower wing
      wing([[4, top + 22], [30, top - 10], [80, top - 22], [92, top + 2], [98, top + 26], [70, top + 52], [6, top + 50]], "#f2b9b4", "#d98c8a", [[70, top - 6, 5], [80, top + 12, 3.5]]);
      wing([[4, top + 52], [40, top + 54], [70, top + 70], [66, top + 98], [58, top + 122], [24, top + 118], [6, top + 76]], "#f6d6c4", "#d99f8e", [[48, top + 100, 4]]);
    });
    hx.save(); hx.globalCompositeOperation = "destination-in"; hx.drawImage(cv, 0, 0); hx.restore();
    hx.save(); hx.globalCompositeOperation = "destination-over"; hx.fillStyle = grey(20); hx.fillRect(0, 0, W, H); hx.restore();
    const alpha = createCanvas(W, H);
    alpha.getContext("2d").drawImage(cv, 0, 0);
    lightRelief(cv, hcv, W, H, 1.1);
    ctx.save(); ctx.globalCompositeOperation = "destination-in"; ctx.drawImage(alpha, 0, 0); ctx.restore();
    PAINT.hx = null;
    out[part] = cv;
  }
  return { out, hotspot: [cx / W, (top - 2) / H] };
}

/**
 * The Scene 1 lamppost: a traditional iron streetlamp in dark bronze — a stepped
 * stone plinth, a fluted lower post with rings, an ornamental collar, a slender
 * upper post, scrolled brackets, and a lantern that widens toward the top under
 * a domed cap and finial, with amber glass. Painted twice on the same canvas:
 * glass smoky and unlit (off), and glowing warm with a flame (lit), so the page
 * can cross-fade between them.
 */
function paintLamp(lit) {
  const W = 220, H = 820, cx = 110;
  const cv = createCanvas(W, H), ctx = cv.getContext("2d");
  const hcv = createCanvas(W, H), hx = hcv.getContext("2d");
  hx.fillStyle = grey(20);
  hx.fillRect(0, 0, W, H);
  PAINT.hx = hx;
  const r = rng(1600);
  const iron = (t) => mix(hex("#1d211e"), hex("#5a5240"), t); // dark bronze
  const stone = (t) => mix(hex("#b9a58a"), hex("#ecdcc0"), t);
  const bar = (x0, y0, x1, y1, w, col) => { ctx.strokeStyle = rgba(col); ctx.lineWidth = w; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
  withThickness(0.85, () => {
    // stepped stone plinth
    for (const [y, w, h2, t] of [[H - 26, 96, 26, 0.45], [H - 50, 80, 24, 0.6], [H - 68, 64, 18, 0.75]]) {
      knife(ctx, r, cx - w / 2, y + h2 / 2, 0, w, h2, stone(t));
      for (let n = 0; n < 4; n++) stroke(ctx, r, cx - w / 2 + r() * w * 0.8, y + h2 * 0.3 + r() * h2 * 0.4, 0, w * 0.25, 4, stone(t + 0.2), 0.6, 2);
    }
    // fluted lower post with rings
    bar(cx, H - 74, cx, H - 300, 24, iron(0.15));
    for (const u of [-6, 0, 6]) bar(cx + u, H - 80, cx + u * 0.8, H - 296, 2, iron(0.5));
    for (const y of [H - 86, H - 300]) knife(ctx, r, cx - 17, y, 0, 34, 10, iron(0.4));
    // ornamental collar: a swelling knop and two small rings
    dab(ctx, cx, H - 318, 16, 12, 0, iron(0.3), 1);
    dab(ctx, cx - 4, H - 322, 6, 5, 0, iron(0.75), 0.8);
    knife(ctx, r, cx - 11, H - 336, 0, 22, 7, iron(0.45));
    // slender upper post
    bar(cx, H - 336, cx, 240, 13, iron(0.2));
    bar(cx - 2, H - 344, cx - 2, 244, 2.5, iron(0.62));
    // scrolled brackets under the lantern
    for (const side of [-1, 1]) {
      ctx.strokeStyle = rgba(iron(0.25));
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, 300);
      ctx.bezierCurveTo(cx + side * 10, 270, cx + side * 44, 268, cx + side * 40, 238);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + side * 30, 296, 6, side < 0 ? 0 : Math.PI, side < 0 ? Math.PI * 1.6 : Math.PI * 2.6);
      ctx.stroke();
    }
    knife(ctx, r, cx - 26, 240, 0, 52, 9, iron(0.35)); // the lantern's foot
    // the lantern: wider at the top, four amber panes
    const glass = new Path2D();
    glass.moveTo(cx - 46, 128); glass.lineTo(cx + 46, 128); glass.lineTo(cx + 30, 234); glass.lineTo(cx - 30, 234); glass.closePath();
    ctx.fillStyle = rgba(lit ? hex("#ffc66b") : hex("#6b5f4c"));
    ctx.fill(glass);
    clipBoth(ctx, glass);
    for (let n = 0; n < 26; n++) stroke(ctx, r, cx - 44 + r() * 88, 130 + r() * 102, Math.PI / 2 + (r() - 0.5) * 0.4, 26, 9, lit ? mix(hex("#fff0c4"), hex("#f0a24a"), r()) : mix(hex("#8a7a5e"), hex("#433c31"), r()), 0.85, 2);
    if (lit) { dab(ctx, cx, 190, 16, 24, 0, hex("#fff8dc"), 0.95); dab(ctx, cx, 196, 7, 12, 0, hex("#ffffff"), 0.9); }
    else for (let n = 0; n < 3; n++) stroke(ctx, r, cx - 34 + n * 10, 138, 1.35, 60, 5, hex("#a39377"), 0.45, 0); // a faint reflection
    unclipBoth(ctx);
    for (const [x0, x1, w] of [[cx - 46, cx - 30, 6], [cx - 15, cx - 10, 3.5], [cx + 15, cx + 10, 3.5], [cx + 46, cx + 30, 6]]) bar(x0, 128, x1, 234, w, iron(0.15));
    bar(cx - 30, 234, cx + 30, 234, 6, iron(0.2));
    // domed cap, crown and finial
    knife(ctx, r, cx - 54, 126, 0, 108, 12, iron(0.3));
    const dome = new Path2D();
    dome.moveTo(cx - 50, 122);
    dome.bezierCurveTo(cx - 44, 86, cx - 18, 74, cx, 72);
    dome.bezierCurveTo(cx + 18, 74, cx + 44, 86, cx + 50, 122);
    dome.closePath();
    ctx.fillStyle = rgba(iron(0.18));
    ctx.fill(dome);
    clipBoth(ctx, dome);
    for (let n = 0; n < 8; n++) stroke(ctx, r, cx - 40 + r() * 50, 90 + r() * 26, -0.4 + r() * 0.3, 30, 7, iron(0.35 + r() * 0.35), 0.7, 2);
    unclipBoth(ctx);
    for (const u of [-14, 0, 14]) dab(ctx, cx + u, 72 - (u ? 2 : 8), 5, 5, 0, iron(0.35), 1); // crown
    bar(cx, 64, cx, 30, 4, iron(0.3));
    dab(ctx, cx, 26, 6, 8, 0, iron(0.4), 1);
    // a little light catching the iron's left edges
    bar(cx - 11, H - 90, cx - 10, H - 290, 2, iron(0.85));
    bar(cx - 6, H - 350, cx - 6, 250, 1.5, iron(0.85));
  });
  // repaint it by hand: the drawing above is only the underpainting. Short loaded strokes, each in the
  // colour beneath it (iron warmed toward brown-black, charcoal and dark bronze), run along the post and
  // round the lantern; then the silhouette gets a soft, slightly broken painted edge.
  const under = createCanvas(W, H);
  under.getContext("2d").drawImage(cv, 0, 0);
  const ud = under.getContext("2d").getImageData(0, 0, W, H).data;
  const warm = (c) => {
    const l = (c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255, sat = Math.max(...c) - Math.min(...c);
    if (l > 0.45 || sat > 60) return c; // stone and amber glass keep their colours
    return mix(mix(hex("#2b231d"), hex("#6e5a40"), Math.pow(l / 0.45, 0.9)), c, 0.25);
  };
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(under, 0, 0);
  // recolour the underpainting's iron too, so no pure black shows between the strokes
  {
    const id = ctx.getImageData(0, 0, W, H);
    for (let p2 = 0; p2 < id.data.length; p2 += 4) if (id.data[p2 + 3] > 0) { const c = warm([id.data[p2], id.data[p2 + 1], id.data[p2 + 2]]); id.data[p2] = c[0]; id.data[p2 + 1] = c[1]; id.data[p2 + 2] = c[2]; }
    ctx.putImageData(id, 0, 0);
  }
  withThickness(0.9, () => {
    for (let n = 0; n < 2600; n++) {
      const x = Math.floor(r() * W), y = Math.floor(r() * H), q = (y * W + x) * 4;
      if (ud[q + 3] < 160) continue;
      if (y > 126 && y < 236 && Math.abs(x - cx) < 44) continue; // leave the lantern's glass and frame as painted
      const c = warm([ud[q], ud[q + 1], ud[q + 2]]);
      const ang = y > 250 && y < H - 70 ? -Math.PI / 2 + (r() - 0.5) * 0.25 : r() * Math.PI;
      stroke(ctx, r, x, y, ang, 8 + r() * 16, 3 + r() * 4, mix(c, r() < 0.5 ? hex("#8a7356") : hex("#1c1714"), r() * 0.25), 0.9, 2);
    }
  });
  {
    // a soft, organic edge: the underpainting's shape, lightly blurred and thresholded against noise
    const mk = createCanvas(W, H), mc = mk.getContext("2d");
    mc.filter = "blur(1.4px)";
    mc.drawImage(under, 0, 0);
    const md = mc.getImageData(0, 0, W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const q = (y * W + x) * 4;
      const t = 118 + fbm(x / 9, y / 9, 1611, 2) * 70;
      md.data[q + 3] = clamp((md.data[q + 3] - t) / 30 + 0.5) * 255;
    }
    mc.filter = "none";
    mc.putImageData(md, 0, 0);
    for (const c of [ctx, hx]) { c.save(); c.globalCompositeOperation = "destination-in"; c.drawImage(mk, 0, 0); c.restore(); }
  }
  hx.save(); hx.globalCompositeOperation = "destination-in"; hx.drawImage(cv, 0, 0); hx.restore();
  hx.save(); hx.globalCompositeOperation = "destination-over"; hx.fillStyle = grey(20); hx.fillRect(0, 0, W, H); hx.restore();
  const alpha = createCanvas(W, H);
  alpha.getContext("2d").drawImage(cv, 0, 0);
  lightRelief(cv, hcv, W, H, 1);
  ctx.save(); ctx.globalCompositeOperation = "destination-in"; ctx.drawImage(alpha, 0, 0); ctx.restore();
  // set into the ground: a soft shadow round the plinth and a few blades of grass painted over its foot
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  ctx.filter = "blur(6px)";
  glaze(ctx, cx + 8, H - 10, 84, 12, hex("#3d4a2e"), 0.4);
  ctx.restore();
  for (let n = 0; n < 34; n++) {
    const x = cx + (r() - 0.5) * 130, h2 = 10 + r() * 20;
    stroke(ctx, r, x, H - 2, -Math.PI / 2 + (r() - 0.5) * 0.9, h2, 2.5 + r() * 2, mix(hex("#6f8a55"), hex("#a8bd88"), r()), 0.9, 1);
  }
  PAINT.hx = null;
  return cv;
}

if (process.argv.includes("--lamp")) {
  const dir = path.resolve("public/assets/garden/lamp");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "lamp-off.webp"), paintLamp(false).toBuffer("image/webp", 92));
  fs.writeFileSync(path.join(dir, "lamp-lit.webp"), paintLamp(true).toBuffer("image/webp", 92));
  console.log("lamp: off + lit");
  process.exit(0);
}

if (process.argv.includes("--butterfly")) {
  const dir = path.resolve("public/assets/garden/butterfly");
  fs.mkdirSync(dir, { recursive: true });
  const { out, hotspot } = paintButterfly();
  for (const [k, cv] of Object.entries(out)) fs.writeFileSync(path.join(dir, `butterfly-${k}.webp`), cv.toBuffer("image/webp", 92));
  console.log("butterfly hotspot", hotspot.map((v) => v.toFixed(3)).join(", "));
  process.exit(0);
}

if (process.argv.includes("--title")) {
  const dir = path.resolve("public/assets/garden/title");
  fs.mkdirSync(dir, { recursive: true });
  const { letters, meta } = paintTitle();
  for (const L of letters) fs.writeFileSync(path.join(dir, `letter-${String(L.idx).padStart(2, "0")}.webp`), L.canvas.toBuffer("image/webp", 92));
  fs.writeFileSync(path.resolve("src/data/title-letters.json"), JSON.stringify(meta, null, 2) + "\n");
  console.log(`title: ${letters.length} letters`);
  process.exit(0);
}

/**
 * The case-study backdrop: a quiet painted landscape in three colour families —
 * soft sky blue, painted white clouds and meadow green. An open sky fills the
 * page; a few cumulus clouds, laid with real lobes of white pigment and a little
 * impasto, drift in the upper margins; gentle green hills rise at the foot of
 * the frame. The reading column stays clear, pale sky (no cloud behind the
 * text), and the colour moves from blue to green gradually — one continuous
 * painting, no panels. Light canvas relief; brushwork only where it helps.
 */
/**
 * The three contact icons (Email, LinkedIn, WeChat) as one hand-painted set: each symbol is a
 * simple, recognisable shape filled with directional oil strokes, edged with a painted contour and
 * a few knife highlights, then lit for relief. Same canvas, weight and palette for all three.
 */
function paintIcon(kind) {
  const S = 360;
  const cv = createCanvas(S, S), ctx = cv.getContext("2d");
  const hcv = createCanvas(S, S), hx = hcv.getContext("2d");
  hx.fillStyle = grey(20);
  hx.fillRect(0, 0, S, S);
  PAINT.hx = hx;
  const r = rng({ email: 1701, linkedin: 1702, wechat: 1703 }[kind]);
  const C = { cream: hex("#f7eedd"), cream2: hex("#fdf7ea"), creamD: hex("#ead9bd"), sage: hex("#8eab78"), sageD: hex("#6f8a5a"), sageL: hex("#b4c99c"), blue: hex("#8fb3d6"), blueD: hex("#7099c2"), blueL: hex("#b8d1e8"), blush: hex("#e7a8a2") };
  // fill a path with a soft-edged base, then lay strokes inside it in the given direction
  const body = (p, base, tones, ang, n, w) => {
    ctx.save();
    ctx.filter = "blur(1.2px)";
    ctx.fillStyle = rgba(base);
    ctx.fill(p);
    ctx.restore();
    clipBoth(ctx, p);
    withThickness(0.7, () => {
      for (let i = 0; i < n; i++) {
        const x = 20 + r() * (S - 40), y = 20 + r() * (S - 40);
        stroke(ctx, r, x - Math.cos(ang) * 40, y - Math.sin(ang) * 40, ang + (r() - 0.5) * 0.25, 60 + r() * 70, w * (0.7 + r() * 0.6), tones[Math.floor(r() * tones.length)], 0.55, 3);
      }
    });
    unclipBoth(ctx);
  };
  // a painted contour: short overlapping strokes following the outline points
  const contour = (pts, w, col, alpha = 0.95) => withThickness(0.85, () => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const len = Math.hypot(x1 - x0, y1 - y0);
      stroke(ctx, r, x0, y0, Math.atan2(y1 - y0, x1 - x0), len + w * 0.6, w * (0.85 + r() * 0.3), mix(col, hex("#ffffff"), r() * 0.12), alpha, 2);
    }
  });
  const rrect = (x, y, w, h, rad, n = 64) => {
    const pts = [];
    const corners = [[x + w - rad, y + rad, -Math.PI / 2], [x + w - rad, y + h - rad, 0], [x + rad, y + h - rad, Math.PI / 2], [x + rad, y + rad, Math.PI]];
    for (const [cx, cy, a0] of corners) for (let i = 0; i <= n / 4; i++) { const a = a0 + (i / (n / 4)) * (Math.PI / 2); pts.push([cx + Math.cos(a) * rad + (r() - 0.5) * 1.5, cy + Math.sin(a) * rad + (r() - 0.5) * 1.5]); }
    pts.push(pts[0]);
    return pts;
  };
  const toPath = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
  const line = (x0, y0, x1, y1, n = 6) => Array.from({ length: n + 1 }, (_, i) => [lerp(x0, x1, i / n) + (r() - 0.5) * 1.2, lerp(y0, y1, i / n) + (r() - 0.5) * 1.2]);
  // a bubble: an ellipse with a small tail
  const bubble = (cx, cy, rx, ry, tail) => {
    const pts = [];
    // the arc between a0 and a1 (degrees, clockwise on screen) is replaced by a point out to the tip
    let tipped = false;
    for (let i = 0; i <= 72; i++) {
      const deg = (i / 72) * 360, a = (deg * Math.PI) / 180;
      if (deg > tail.a0 && deg < tail.a1) { if (!tipped) { pts.push(tail.tip); tipped = true; } continue; }
      pts.push([cx + Math.cos(a) * rx * (1 + (r() - 0.5) * 0.012), cy + Math.sin(a) * ry * (1 + (r() - 0.5) * 0.012)]);
    }
    return pts;
  };

  if (kind === "email") {
    const x = 42, y = 86, w = 276, h = 192;
    const out = rrect(x, y, w, h, 24);
    body(toPath(out), C.cream, [C.cream2, C.creamD, C.cream], 0.05, 70, 18);
    // the lower folds, faint, then the flap
    contour(line(x + 14, y + h - 12, x + w * 0.42, y + h * 0.52), 5, C.creamD, 0.8);
    contour(line(x + w - 14, y + h - 12, x + w * 0.58, y + h * 0.52), 5, C.creamD, 0.8);
    const flap = [[x + 8, y + 12], [x + w / 2, y + h * 0.6], [x + w - 8, y + 12]];
    const fp = new Path2D(); fp.moveTo(...flap[0]); fp.lineTo(...flap[1]); fp.lineTo(...flap[2]); fp.closePath();
    body(fp, C.cream2, [C.cream2, C.cream], -0.1, 18, 14);
    contour([...line(...flap[0], ...flap[1]), ...line(...flap[1], ...flap[2]).slice(1)], 8, C.sage);
    contour(out, 10, C.sage);
    // a small blush seal where the flap meets
    withThickness(0.9, () => { dab(ctx, x + w / 2, y + h * 0.6, 15, 14, 0, C.blush, 1); dab(ctx, x + w / 2 - 4, y + h * 0.6 - 4, 6, 5, 0, mix(C.blush, hex("#ffffff"), 0.45), 0.9); });
    for (let i = 0; i < 4; i++) knife(ctx, r, x + 40 + r() * (w - 80), y + h - 30 - r() * 30, (r() - 0.5) * 0.2, 30 + r() * 20, 6, C.cream2, 0.7);
  } else if (kind === "linkedin") {
    const x = 58, y = 58, w = 244, h = 244;
    const out = rrect(x, y, w, h, 54);
    body(toPath(out), C.blue, [C.blueL, C.blueD, C.blue, C.blueL], -0.6, 80, 20);
    contour(out, 9, C.blueD, 0.85);
    // "in": the i's dot and stem, then the n's stem and arch, in thick cream paint
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = rgba(C.cream);
    ctx.fillStyle = rgba(C.cream);
    ctx.beginPath(); ctx.arc(122, 120, 19, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 34;
    ctx.beginPath(); ctx.moveTo(122, 166); ctx.lineTo(122, 252); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(176, 252); ctx.lineTo(176, 166); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(176, 200); ctx.bezierCurveTo(182, 166, 240, 158, 244, 204); ctx.lineTo(244, 252); ctx.stroke();
    withThickness(0.9, () => {
      for (const [x0, y0, x1, y1] of [[122, 168, 122, 250], [176, 168, 176, 250], [244, 210, 244, 250]]) for (let i = 0; i < 3; i++) stroke(ctx, r, x0 + (r() - 0.5) * 12, y1, -Math.PI / 2, y1 - y0, 10, mix(C.cream2, C.creamD, r() * 0.6), 0.8, 2);
      dab(ctx, 122, 120, 16, 15, 0, C.cream2, 0.9);
      dab(ctx, 116, 114, 7, 6, 0, hex("#ffffff"), 0.8);
      for (const [px, py, a] of [[184, 180, -0.9], [206, 168, -0.15], [230, 176, 0.6], [240, 192, 1.2]]) stroke(ctx, r, px, py, a, 26, 12, mix(C.cream2, C.creamD, r() * 0.5), 0.8, 2);
      knife(ctx, r, 112, 190, -Math.PI / 2, 40, 6, C.cream2, 0.75);
      knife(ctx, r, 166, 230, -Math.PI / 2, 40, 6, C.cream2, 0.75);
    });
    for (let i = 0; i < 3; i++) knife(ctx, r, x + 30 + r() * 50, y + 26 + r() * 20, -0.5, 40, 7, C.blueL, 0.7);
  } else {
    // the familiar pair of bubbles: a large sage one behind, a smaller cream one in front
    const big = bubble(146, 150, 112, 94, { a0: 112, a1: 140, tip: [56, 268] });
    body(toPath(big), C.sage, [C.sageL, C.sage, hex("#a2bd8a"), C.sageD], -0.25, 70, 18);
    contour(big, 8, C.sageD, 0.85);
    for (const [ex, ey] of [[108, 132], [184, 132]]) withThickness(0.9, () => { dab(ctx, ex, ey, 13, 12, 0, hex("#4f6b45"), 1); dab(ctx, ex - 4, ey - 4, 4, 4, 0, C.sageL, 0.8); });
    const small = bubble(238, 226, 90, 74, { a0: 34, a1: 60, tip: [322, 310] });
    body(toPath(small), C.cream, [C.cream2, C.cream, C.creamD], 0.2, 50, 16);
    contour(small, 8, C.sage, 0.95);
    for (const [ex, ey] of [[210, 214], [266, 214]]) withThickness(0.9, () => { dab(ctx, ex, ey, 10, 9, 0, C.sageD, 1); dab(ctx, ex - 3, ey - 3, 3, 3, 0, C.cream2, 0.8); });
    for (let i = 0; i < 3; i++) knife(ctx, r, 100 + r() * 60, 92 + r() * 14, -0.2, 40, 7, C.sageL, 0.75);
    for (let i = 0; i < 2; i++) knife(ctx, r, 214 + r() * 40, 176 + r() * 10, -0.1, 34, 6, C.cream2, 0.75);
  }
  lightRelief(cv, hcv, S, S, 0.9);
  PAINT.hx = null;
  return cv;
}

if (process.argv.includes("--icons")) {
  const dir = path.resolve("public/assets/garden/contact");
  fs.mkdirSync(dir, { recursive: true });
  for (const kind of ["email", "linkedin", "wechat"]) {
    fs.writeFileSync(path.join(dir, `icon-${kind}.webp`), paintIcon(kind).toBuffer("image/webp", 92));
    console.log(`icon-${kind}`);
  }
  process.exit(0);
}

/**
 * Floating foreground flora for the inner pages: single painted flowers, loose petals, leaves and one
 * small sprig, each its own transparent sprite so it can drift above the page with its own depth.
 */
function paintFlora(kind) {
  const S = kind === "sprig" ? 360 : 260;
  const cv = createCanvas(S, S), ctx = cv.getContext("2d");
  const hcv = createCanvas(S, S), hx = hcv.getContext("2d");
  hx.fillStyle = grey(20);
  hx.fillRect(0, 0, S, S);
  PAINT.hx = hx;
  const r = rng(1800 + kind.length * 7 + kind.charCodeAt(0));
  const c = S / 2;
  // a petal: an elongated soft dab with a few bristle strokes along it and a lit tip
  const petal = (x, y, ang, len, w, col, rr = r) => {
    const cx = x + Math.cos(ang) * len * 0.5, cy = y + Math.sin(ang) * len * 0.5;
    dab(ctx, cx, cy, len * 0.52, w * 0.5, ang, col, 0.95);
    for (let i = 0; i < 3; i++) stroke(ctx, rr, x + Math.cos(ang) * len * 0.12, y + Math.sin(ang) * len * 0.12, ang + (rr() - 0.5) * 0.25, len * (0.7 + rr() * 0.2), w * 0.28, mix(col, hex("#ffffff"), 0.15 + rr() * 0.25), 0.7, 2);
    stroke(ctx, rr, x + Math.cos(ang) * len * 0.45, y + Math.sin(ang) * len * 0.45, ang, len * 0.4, w * 0.14, mix(col, hex("#fffaf2"), 0.45), 0.45, 2); // a soft lit ridge
  };
  const leaf = (x, y, ang, len, w, col) => {
    const p = new Path2D();
    const tx = x + Math.cos(ang) * len, ty = y + Math.sin(ang) * len, nx = -Math.sin(ang) * w, ny = Math.cos(ang) * w;
    p.moveTo(x, y);
    p.quadraticCurveTo((x + tx) / 2 + nx, (y + ty) / 2 + ny, tx, ty);
    p.quadraticCurveTo((x + tx) / 2 - nx, (y + ty) / 2 - ny, x, y);
    ctx.save(); ctx.filter = "blur(0.8px)"; ctx.fillStyle = rgba(col); ctx.fill(p); ctx.restore();
    clipBoth(ctx, p);
    for (let i = 0; i < 10; i++) stroke(ctx, r, x + Math.cos(ang) * len * r() * 0.6 + (r() - 0.5) * w, y + Math.sin(ang) * len * r() * 0.6 + (r() - 0.5) * w, ang + (r() - 0.5) * 0.5, len * 0.5, w * 0.35, mix(col, r() < 0.5 ? hex("#fff4dc") : hex("#5f7a4c"), 0.18 + r() * 0.15), 0.6, 2);
    unclipBoth(ctx);
    stroke(ctx, r, x, y, ang, len * 0.9, Math.max(2, w * 0.08), mix(col, hex("#fff4dc"), 0.35), 0.75, 1); // the midrib
  };
  withThickness(0.85, () => {
    if (kind === "cosmos" || kind === "daisy") {
      const n = kind === "cosmos" ? 8 : 13, len = kind === "cosmos" ? 92 : 84, w = kind === "cosmos" ? 54 : 26;
      const base = kind === "cosmos" ? hex("#eeaab3") : hex("#fbf3e6");
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r() * 0.15;
        petal(c, c, a, len * (0.9 + r() * 0.15), w, mix(base, kind === "cosmos" ? hex("#f6cfd2") : hex("#f3e1cc"), r() * 0.6));
      }
      dab(ctx, c, c, 24, 22, 0, hex("#e0b04e"), 1);
      for (let i = 0; i < 14; i++) dab(ctx, c + (r() - 0.5) * 30, c + (r() - 0.5) * 28, 4, 4, 0, mix(hex("#c98f3a"), hex("#f6d98a"), r()), 0.95);
      dab(ctx, c - 7, c - 8, 7, 5, 0, hex("#fbe7a8"), 0.85);
    } else if (kind === "petal-pink" || kind === "petal-peach") {
      petal(c - 70, c + 30, -0.45, 150, 74, kind === "petal-pink" ? hex("#efb1b8") : hex("#f1c2a4"));
    } else if (kind === "leaf-sage" || kind === "leaf-autumn") {
      stroke(ctx, r, c - 104, c + 70, -0.55, 30, 5, hex("#8a7a5c"), 0.9, 1);
      leaf(c - 80, c + 56, -0.55, 190, 50, kind === "leaf-sage" ? hex("#a3bb85") : hex("#dfa65a"));
    } else if (kind === "lavender") {
      stroke(ctx, r, c + 10, S - 20, -Math.PI / 2 - 0.12, 210, 5, hex("#8fa775"), 0.95, 1);
      const da = -Math.PI / 2 - 0.12;
      for (let i = 0; i < 16; i++) {
        const t = i / 16, x = c + 10 + Math.cos(da) * 210 * (0.4 + t * 0.58), y = S - 20 + Math.sin(da) * 210 * (0.4 + t * 0.58);
        for (const sd of [-1, 1]) dab(ctx, x + sd * (10 - t * 5), y, 10 - t * 3, 7 - t * 2, sd * 0.6, mix(hex("#b39bd0"), hex("#d9c8ea"), r()), 0.95);
      }
      leaf(c + 6, S - 50, -2.2, 80, 14, hex("#a3bb85"));
    } else {
      // a sprig: a curving stem with two small cosmos, a bud and a few leaves
      const p0 = [S * 0.2, S * 0.9], p1 = [S * 0.4, S * 0.5], p2 = [S * 0.72, S * 0.2];
      for (let i = 0; i < 12; i++) {
        const t0 = i / 12, t1 = (i + 1) / 12, P = (t) => [lerp(lerp(p0[0], p1[0], t), lerp(p1[0], p2[0], t), t), lerp(lerp(p0[1], p1[1], t), lerp(p1[1], p2[1], t), t)];
        const [x0, y0] = P(t0), [x1, y1] = P(t1);
        stroke(ctx, r, x0, y0, Math.atan2(y1 - y0, x1 - x0), Math.hypot(x1 - x0, y1 - y0) + 6, 6, hex("#8fa775"), 0.95, 1);
      }
      leaf(S * 0.3, S * 0.72, -2.4, 90, 22, hex("#a3bb85"));
      leaf(S * 0.36, S * 0.6, -0.6, 84, 20, hex("#b1c38e"));
      leaf(S * 0.5, S * 0.38, -2.7, 70, 18, hex("#dcb067"));
      for (const [x, y, sc, col] of [[S * 0.72, S * 0.2, 1, hex("#eeaab3")], [S * 0.52, S * 0.42, 0.75, hex("#f3c0c4")]]) {
        for (let i = 0; i < 8; i++) petal(x, y, (i / 8) * Math.PI * 2 + r() * 0.2, 46 * sc, 28 * sc, mix(col, hex("#f8d8da"), r() * 0.5));
        dab(ctx, x, y, 12 * sc, 11 * sc, 0, hex("#e0b04e"), 1);
        dab(ctx, x - 3, y - 4, 4 * sc, 3 * sc, 0, hex("#fbe7a8"), 0.85);
      }
      dab(ctx, S * 0.26, S * 0.66, 12, 16, -0.5, hex("#e7a3ab"), 0.95); // a bud
      dab(ctx, S * 0.27, S * 0.7, 9, 8, 0, hex("#9db582"), 0.95);
    }
  });
  lightRelief(cv, hcv, S, S, 0.9);
  PAINT.hx = null;
  return cv;
}

if (process.argv.includes("--flora")) {
  const dir = path.resolve("public/assets/garden/flora");
  fs.mkdirSync(dir, { recursive: true });
  for (const kind of ["cosmos", "daisy", "lavender", "sprig", "petal-pink", "petal-peach", "leaf-sage", "leaf-autumn"]) {
    fs.writeFileSync(path.join(dir, `${kind}.webp`), paintFlora(kind).toBuffer("image/webp", 92));
    console.log(kind);
  }
  process.exit(0);
}

/**
 * The garden mailbox, in three layers so it can move: the body (post, vine, box and the dark mouth of the
 * box), the arched front door (hinged at its foot, it tips open on hover) and the little flag (pivoting
 * at its back end). All three share one 400 × 520 canvas, so they stack exactly.
 */
function paintMailbox() {
  // drawn in 400 × 520 units at twice the resolution, so the larger Contact mailbox stays crisp
  const W = 400, H = 520, SC = 2;
  const make = () => {
    const cv = createCanvas(W * SC, H * SC), hcv = createCanvas(W * SC, H * SC), hx = hcv.getContext("2d"), ctx = cv.getContext("2d");
    hx.fillStyle = grey(20); hx.fillRect(0, 0, W * SC, H * SC);
    ctx.scale(SC, SC); hx.scale(SC, SC);
    return { cv, ctx, hcv, hx };
  };
  const r = rng(1900);
  const C = { rose: hex("#e2a59c"), roseL: hex("#f0bfb4"), roseD: hex("#c98a82"), cream: hex("#f7eedd"), creamD: hex("#e6d4b8"), mouth: hex("#5a3f37"), wood: hex("#a7805f"), woodD: hex("#7f604a"), woodL: hex("#c49e7a"), sage: hex("#8eab78"), sageD: hex("#6f8a5a"), blush: hex("#efb4ae"), flag: hex("#cf7a6b") };
  const fillPaint = (ctx, p, base, tones, ang, n, w, area) => {
    ctx.save(); ctx.filter = "blur(1px)"; ctx.fillStyle = rgba(base); ctx.fill(p); ctx.restore();
    clipBoth(ctx, p);
    withThickness(0.7, () => {
      for (let i = 0; i < n; i++) {
        const x = area[0] + r() * (area[2] - area[0]), y = area[1] + r() * (area[3] - area[1]);
        stroke(ctx, r, x - Math.cos(ang) * 30, y - Math.sin(ang) * 30, ang + (r() - 0.5) * 0.2, 50 + r() * 60, w * (0.7 + r() * 0.6), tones[Math.floor(r() * tones.length)], 0.55, 3);
      }
    });
    unclipBoth(ctx);
  };
  const edge = (ctx, pts, w, col, alpha = 0.9) => withThickness(0.8, () => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      stroke(ctx, r, x0, y0, Math.atan2(y1 - y0, x1 - x0), Math.hypot(x1 - x0, y1 - y0) + w * 0.6, w * (0.85 + r() * 0.3), mix(col, hex("#ffffff"), r() * 0.1), alpha, 2);
    }
  });
  const archPts = (cx, cy, rad, bottom, n = 28) => {
    const pts = [[cx - rad, bottom]];
    for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI; pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); }
    pts.push([cx + rad, bottom]);
    return pts;
  };
  const toPath = (pts, close = true) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); if (close) p.closePath(); return p; };
  const F = [118, 200], FR = 60, FB = 262;

  // ---- body
  const B = make();
  PAINT.hx = B.hx;
  {
    const ctx = B.ctx;
    glaze(ctx, 214, 500, 130, 13, hex("#7f9a66"), 0.4);
    // post and bracket
    fillPaint(ctx, toPath([[185, 256], [227, 256], [229, 504], [183, 504]]), C.wood, [C.woodL, C.woodD, C.wood], Math.PI / 2, 34, 10, [180, 250, 232, 508]);
    withThickness(0.6, () => { for (let i = 0; i < 5; i++) stroke(ctx, r, 214 + r() * 10, 280 + r() * 200, Math.PI / 2, 40, 5, C.woodD, 0.45, 2); }); // the shaded side of the post
    fillPaint(ctx, toPath([[150, 252], [262, 250], [262, 266], [150, 268]]), C.woodD, [C.wood, C.woodD], 0, 10, 7, [146, 246, 266, 270]);
    // the side of the box, lit from the upper left, with a cream band at its foot
    const side = new Path2D();
    side.moveTo(F[0], F[1] - FR); side.lineTo(300, 134); side.arc(300, 190, 56, -Math.PI / 2, 0); side.lineTo(356, 250); side.lineTo(F[0], FB); side.closePath();
    fillPaint(ctx, side, C.rose, [C.roseL, C.rose, C.roseD, C.rose], -0.03, 70, 16, [110, 128, 362, 266]);
    clipBoth(ctx, side);
    withThickness(0.85, () => {
      for (let i = 0; i < 9; i++) stroke(ctx, r, 140 + r() * 160, 148 + r() * 8, -0.03, 70 + r() * 50, 7, mix(C.roseL, hex("#fff2ea"), 0.35 + r() * 0.3), 0.75, 2);
      for (let i = 0; i < 6; i++) stroke(ctx, r, 140 + r() * 180, 236 + r() * 14, -0.04, 60 + r() * 50, 8, mix(C.roseD, hex("#9a6a66"), r() * 0.4), 0.55, 2);
    });
    unclipBoth(ctx);
    // a soft darker edge along the back and a cream band at the foot, painted inside the shape so nothing spills
    clipBoth(ctx, side);
    withThickness(0.6, () => {
      for (let i = 0; i < 10; i++) stroke(ctx, r, 322 + r() * 20, 150 + r() * 90, Math.PI / 2 + (r() - 0.5) * 0.3, 40, 9, mix(C.roseD, hex("#a87470"), r() * 0.4), 0.5, 2);
      for (let i = 0; i < 10; i++) stroke(ctx, r, F[0] + r() * 210, 252 + r() * 6, -0.04, 50 + r() * 30, 7, mix(C.creamD, C.cream, r()), 0.85, 2);
    });
    unclipBoth(ctx);
    // the front: a cream rim round the dark mouth of the box (seen when the door tips open)
    const rim = toPath(archPts(F[0], F[1], FR, FB));
    fillPaint(ctx, rim, C.cream, [C.cream, C.creamD, hex("#fdf7ea")], Math.PI / 2, 20, 10, [56, 136, 182, 266]);
    const mouth = toPath(archPts(F[0], F[1] + 4, FR - 10, FB - 6));
    ctx.save(); ctx.filter = "blur(1.5px)"; ctx.fillStyle = rgba(C.mouth); ctx.fill(mouth); ctx.restore();
    edge(ctx, archPts(F[0], F[1], FR, FB), 6, C.creamD, 0.8);
    // a flowering vine winding up the post
    const vine = [[200, 500], [216, 470], [196, 440], [218, 410], [198, 378], [214, 346], [200, 316], [212, 286], [204, 262]];
    edge(ctx, vine, 4, C.sageD, 0.9);
    vine.slice(1, -1).forEach(([x, y], i) => {
      const sd = i % 2 ? 1 : -1;
      withThickness(0.8, () => {
        dab(ctx, x + sd * 12, y - 4, 10, 5, sd * 0.6, mix(C.sage, hex("#b9cc9c"), r()), 0.95);
        if (i % 2 === 0) {
          for (let k2 = 0; k2 < 5; k2++) { const a = (k2 / 5) * Math.PI * 2; dab(ctx, x - sd * 4 + Math.cos(a) * 6, y + 6 + Math.sin(a) * 6, 6, 4, a, mix(C.blush, hex("#fbe2dc"), r() * 0.5), 0.95); }
          dab(ctx, x - sd * 4, y + 6, 3, 3, 0, hex("#f0cc7e"), 1);
        }
      });
    });
    // grass at the foot of the post
    withThickness(0.7, () => { for (let i = 0; i < 26; i++) { const x = 140 + r() * 150; stroke(ctx, r, x, 506, -Math.PI / 2 + (r() - 0.5) * 0.6, 14 + r() * 22, 3, mix(hex("#7fa66a"), hex("#b5c98e"), r()), 0.9, 1); } });
    lightRelief(B.cv, B.hcv, W * SC, H * SC, 0.8);
  }

  // ---- door: the arched front, a little lighter than the side, with a cream rim and a small knob
  const D = make();
  PAINT.hx = D.hx;
  {
    const ctx = D.ctx;
    const door = archPts(F[0], F[1], FR - 4, FB - 2);
    fillPaint(ctx, toPath(door), C.roseL, [C.roseL, C.rose, hex("#f5cdc2")], -Math.PI / 2, 30, 12, [58, 136, 180, 264]);
    withThickness(0.8, () => { for (let i = 0; i < 4; i++) stroke(ctx, r, 86 + r() * 30, 168 + r() * 50, -Math.PI / 2 - 0.1, 30, 6, hex("#fbe0d6"), 0.6, 2); });
    edge(ctx, door, 7, C.cream, 0.95);
    withThickness(0.95, () => { dab(ctx, F[0], 156, 9, 7, 0, C.cream, 1); dab(ctx, F[0] - 2, 154, 3.5, 3, 0, hex("#ffffff"), 0.9); });
    lightRelief(D.cv, D.hcv, W * SC, H * SC, 0.8);
  }

  // ---- flag: an arm along the side, the little flag at its front end; pivots at (330, 206)
  const G = make();
  PAINT.hx = G.hx;
  {
    const ctx = G.ctx;
    withThickness(0.9, () => {
      stroke(ctx, r, 318, 206, Math.PI, 90, 7, hex("#8a6a52"), 0.95, 1);
      dab(ctx, 312, 206, 7, 7, 0, hex("#6f5442"), 1);
    });
    fillPaint(ctx, toPath([[220, 186], [252, 188], [250, 214], [220, 214]]), C.flag, [C.flag, hex("#de907f"), hex("#b9685c")], 0, 10, 8, [214, 182, 256, 218]);
    lightRelief(G.cv, G.hcv, W * SC, H * SC, 0.8);
  }
  // ---- envelope: a little cream letter waiting just inside the mouth (hidden by the closed door)
  const E = make();
  PAINT.hx = E.hx;
  {
    const ctx = E.ctx;
    ctx.save(); ctx.translate(F[0] + 2, 222); ctx.rotate(-0.12);
    const env = toPath([[-40, -24], [40, -24], [40, 24], [-40, 24]]);
    fillPaint(ctx, env, C.cream, [C.cream, hex("#fdf7ea"), C.creamD], 0.05, 14, 8, [-44, -28, 44, 28]);
    edge(ctx, [[-38, -22], [0, 4], [38, -22]], 3.5, C.creamD, 0.9);
    edge(ctx, [[-40, -24], [40, -24], [40, 24], [-40, 24], [-40, -24]], 2.5, hex("#d9c4a2"), 0.7);
    withThickness(0.95, () => { dab(ctx, 0, 4, 7, 6.5, 0, C.flag, 1); dab(ctx, -2, 2, 2.5, 2, 0, hex("#fbd7cc"), 0.9); });
    ctx.restore();
    lightRelief(E.cv, E.hcv, W * SC, H * SC, 0.8);
  }

  // ---- garden: the little patch at the foot of the post for the larger Contact mailbox — grass, a few white
  // daisies, soft pink flowers and leaves, and a broader painted ground shadow
  const P2 = make();
  PAINT.hx = P2.hx;
  {
    const ctx = P2.ctx;
    ctx.save(); ctx.filter = "blur(6px)"; glaze(ctx, 214, 506, 150, 14, hex("#7f9a66"), 0.35); ctx.restore();
    withThickness(0.75, () => {
      for (let i = 0; i < 60; i++) { const x = 70 + r() * 290; stroke(ctx, r, x, 512 - r() * 6, -Math.PI / 2 + (r() - 0.5) * 0.7, 14 + r() * 26, 3, mix(hex("#7fa66a"), hex("#b9cc92"), r()), 0.9, 1); }
      for (const [x, y, a] of [[150, 494, -2.4], [262, 492, -0.7], [118, 500, -2.8], [300, 498, -0.4]]) dab(ctx, x + Math.cos(a) * 12, y + Math.sin(a) * 12, 14, 6, a, mix(C.sage, hex("#b4c99a"), r()), 0.95);
      const daisy = (x, y, R) => {
        for (let k = 0; k < 11; k++) { const a = (k / 11) * Math.PI * 2; dab(ctx, x + Math.cos(a) * R * 0.6, y + Math.sin(a) * R * 0.45, R * 0.48, R * 0.18, a, mix(hex("#fdf8f0"), hex("#efe4d4"), r() * 0.5), 0.97); }
        dab(ctx, x, y, R * 0.24, R * 0.2, 0, hex("#e8b03e"), 1);
      };
      const blossom = (x, y, R) => {
        for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + 0.3; dab(ctx, x + Math.cos(a) * R * 0.55, y + Math.sin(a) * R * 0.45, R * 0.5, R * 0.34, a, mix(C.blush, hex("#f8d4d0"), r() * 0.5), 0.96); }
        dab(ctx, x, y, R * 0.2, R * 0.18, 0, hex("#f3d38a"), 1);
      };
      for (const [x, y, R] of [[136, 488, 13], [158, 500, 11], [272, 486, 12], [294, 502, 10], [118, 504, 9]]) { stroke(ctx, r, x, y + 22, -Math.PI / 2, 20, 2.4, hex("#7f9e68"), 0.9, 1); daisy(x, y, R); }
      for (const [x, y, R] of [[176, 506, 10], [250, 500, 11], [318, 490, 9], [96, 494, 8]]) { stroke(ctx, r, x, y + 20, -Math.PI / 2, 18, 2.2, hex("#7f9e68"), 0.9, 1); blossom(x, y, R); }
    });
    lightRelief(P2.cv, P2.hcv, W * SC, H * SC, 0.8);
  }
  PAINT.hx = null;
  return { body: B.cv, door: D.cv, flag: G.cv, envelope: E.cv, garden: P2.cv };
}

if (process.argv.includes("--mailbox")) {
  const dir = path.resolve("public/assets/garden/mailbox");
  fs.mkdirSync(dir, { recursive: true });
  const m = paintMailbox();
  for (const [k, cv] of Object.entries(m)) fs.writeFileSync(path.join(dir, `mailbox-${k}.webp`), cv.toBuffer("image/webp", 92));
  console.log("mailbox: body, door, flag, envelope, garden");
  process.exit(0);
}

/**
 * Foreground clusters for the inner pages: larger, richer, more detailed than the backdrop's flowers,
 * because they sit closest to the viewer. Each enters from the LEFT edge (stems run off the canvas there);
 * the page mirrors them for the right edge.
 */
function paintForeground(kind) {
  const S = kind === "fg-petals" ? 360 : 640;
  const cv = createCanvas(S, S), ctx = cv.getContext("2d");
  const hcv = createCanvas(S, S), hx = hcv.getContext("2d");
  hx.fillStyle = grey(20);
  hx.fillRect(0, 0, S, S);
  PAINT.hx = hx;
  const r = rng(2100 + kind.length * 13 + kind.charCodeAt(3));
  const P = { coral: hex("#e9806b"), coralD: hex("#cf5f50"), blush: hex("#f2a7ae"), blushD: hex("#de8794"), white: hex("#fdf8f0"), whiteS: hex("#e7dccd"), gold: hex("#e8b03e"), goldD: hex("#c58a2c"), sage: hex("#8fb077"), sageD: hex("#5f804f"), sageL: hex("#b4cb98"), stem: hex("#7d9a62") };
  const curve = (p0, p1, p2, w, col) => {
    const B = (t) => [lerp(lerp(p0[0], p1[0], t), lerp(p1[0], p2[0], t), t), lerp(lerp(p0[1], p1[1], t), lerp(p1[1], p2[1], t), t)];
    for (let i = 0; i < 16; i++) { const [x0, y0] = B(i / 16), [x1, y1] = B((i + 1) / 16); stroke(ctx, r, x0, y0, Math.atan2(y1 - y0, x1 - x0), Math.hypot(x1 - x0, y1 - y0) + w, w * (1 - i / 40), mix(col, hex("#c9d8a8"), r() * 0.2), 0.95, 1); }
    return B;
  };
  const petal = (x, y, ang, len, w, col, shade) => {
    dab(ctx, x + Math.cos(ang) * len * 0.5, y + Math.sin(ang) * len * 0.5, len * 0.52, w * 0.5, ang, col, 0.97);
    for (let i = 0; i < 4; i++) stroke(ctx, r, x + Math.cos(ang) * len * 0.1, y + Math.sin(ang) * len * 0.1, ang + (r() - 0.5) * 0.3, len * (0.6 + r() * 0.3), w * 0.22, mix(col, i % 2 ? hex("#ffffff") : shade, 0.2 + r() * 0.25), 0.75, 2);
    dab(ctx, x + Math.cos(ang) * len * 0.22, y + Math.sin(ang) * len * 0.22, len * 0.18, w * 0.3, ang, shade, 0.45);
  };
  const leaf = (x, y, ang, len, w, col) => {
    const tx = x + Math.cos(ang) * len, ty = y + Math.sin(ang) * len, nx = -Math.sin(ang) * w, ny = Math.cos(ang) * w;
    const p = new Path2D();
    p.moveTo(x, y); p.quadraticCurveTo((x + tx) / 2 + nx, (y + ty) / 2 + ny, tx, ty); p.quadraticCurveTo((x + tx) / 2 - nx, (y + ty) / 2 - ny, x, y);
    ctx.save(); ctx.filter = "blur(0.8px)"; ctx.fillStyle = rgba(col); ctx.fill(p); ctx.restore();
    clipBoth(ctx, p);
    for (let i = 0; i < 14; i++) stroke(ctx, r, x + Math.cos(ang) * len * r() * 0.7 + (r() - 0.5) * w, y + Math.sin(ang) * len * r() * 0.7 + (r() - 0.5) * w, ang + (r() - 0.5) * 0.5, len * 0.45, w * 0.32, mix(col, r() < 0.5 ? hex("#f4f0d0") : P.sageD, 0.18 + r() * 0.2), 0.65, 2);
    unclipBoth(ctx);
    stroke(ctx, r, x, y, ang, len * 0.92, Math.max(2, w * 0.07), mix(col, hex("#f4f0d0"), 0.4), 0.8, 1);
  };
  const daisy = (x, y, R, tilt = 0) => {
    const n = 16;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + r() * 0.12; petal(x, y, a, R * (0.9 + r() * 0.18), R * 0.34, mix(P.white, hex("#fff6e8"), r() * 0.5), P.whiteS); }
    dab(ctx, x, y, R * 0.3, R * 0.28, 0, P.gold, 1);
    for (let i = 0; i < 18; i++) dab(ctx, x + (r() - 0.5) * R * 0.42, y + (r() - 0.5) * R * 0.4, R * 0.05, R * 0.05, 0, mix(P.goldD, hex("#f8d987"), r()), 0.95);
    dab(ctx, x - R * 0.09, y - R * 0.1, R * 0.1, R * 0.07, tilt, hex("#fbe7a8"), 0.85);
  };
  const cosmos = (x, y, R, col, shade) => {
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + r() * 0.15; petal(x, y, a, R * (0.92 + r() * 0.14), R * 0.62, mix(col, hex("#ffffff"), r() * 0.18), shade); }
    dab(ctx, x, y, R * 0.24, R * 0.22, 0, P.gold, 1);
    for (let i = 0; i < 14; i++) dab(ctx, x + (r() - 0.5) * R * 0.32, y + (r() - 0.5) * R * 0.3, R * 0.045, R * 0.045, 0, mix(P.goldD, hex("#f6d98a"), r()), 0.95);
  };
  withThickness(0.9, () => {
    if (kind === "fg-cosmos") {
      curve([-20, 600], [160, 470], [330, 270], 9, P.stem);
      curve([-20, 610], [110, 520], [200, 430], 8, P.stem);
      curve([-20, 560], [120, 380], [180, 250], 6, P.stem);
      leaf(70, 520, -0.9, 150, 22, P.sage); leaf(120, 470, -0.2, 130, 20, P.sageL); leaf(60, 560, 0.3, 120, 18, P.sageD);
      cosmos(330, 270, 120, P.coral, P.coralD);
      cosmos(200, 430, 84, P.blush, P.blushD);
      dab(ctx, 180, 238, 18, 26, -0.3, P.coralD, 0.95); dab(ctx, 184, 262, 12, 10, 0, P.sage, 0.95); // a bud
    } else if (kind === "fg-daisies") {
      curve([-20, 620], [150, 470], [300, 210], 7, P.stem);
      curve([-20, 600], [230, 520], [430, 330], 7, P.stem);
      curve([-20, 560], [120, 470], [220, 340], 6, P.stem);
      curve([-20, 640], [200, 600], [340, 470], 6, P.stem);
      leaf(40, 540, -0.6, 160, 24, P.sage); leaf(100, 590, 0.2, 150, 22, P.sageL); leaf(160, 480, -1.3, 110, 18, P.sageD);
      daisy(300, 210, 96); daisy(430, 330, 84); daisy(220, 340, 70); daisy(340, 470, 62);
    } else if (kind === "fg-rose") {
      curve([-20, 610], [140, 520], [300, 330], 10, P.stem);
      curve([-20, 520], [260, 300], [470, 180], 6, P.stem);
      leaf(90, 520, -0.5, 170, 34, P.sage); leaf(170, 430, -1.6, 140, 30, P.sageD); leaf(220, 400, 0.4, 150, 30, P.sageL); leaf(360, 240, -0.9, 110, 22, P.sage);
      const cx = 310, cy = 320, R = 150;
      // a garden rose, petal by petal from the outside in: each cupped petal a soft dab with a shaded inner
      // edge and a lit rim, deepening toward a rolled centre
      for (let k = 0; k < 5; k++) {
        const rad = R * (1 - k * 0.19), n = [7, 6, 5, 5, 4][k];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + k * 0.7 + (r() - 0.5) * 0.3;
          const d = rad * (0.5 - k * 0.04), px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d * 0.82;
          const col = mix(mix(P.blush, hex("#fbd6da"), r() * 0.5 + 0.1 - k * 0.05), P.blushD, k * 0.14);
          dab(ctx, px, py, rad * (0.46 + r() * 0.08), rad * (0.33 + r() * 0.06), a + Math.PI / 2, col, 0.97);
          // the shaded edge toward the centre and the lit outer rim
          stroke(ctx, r, px - Math.cos(a) * rad * 0.22 - Math.cos(a + Math.PI / 2) * rad * 0.3, py - Math.sin(a) * rad * 0.18 - Math.sin(a + Math.PI / 2) * rad * 0.3, a + Math.PI / 2, rad * 0.6, rad * 0.07, mix(col, hex("#b9606f"), 0.4), 0.55, 2);
          stroke(ctx, r, px + Math.cos(a) * rad * 0.26 - Math.cos(a + Math.PI / 2) * rad * 0.28, py + Math.sin(a) * rad * 0.22 - Math.sin(a + Math.PI / 2) * rad * 0.28, a + Math.PI / 2, rad * 0.56, rad * 0.06, mix(col, hex("#fff3f1"), 0.6), 0.75, 2);
        }
      }
      for (let i = 0; i < 4; i++) stroke(ctx, r, cx - 22 + i * 4, cy - 6 + i * 5, 0.3 + i * 0.5, 34, 7, mix(hex("#c96f7d"), P.blushD, r()), 0.8, 2);
      dab(ctx, 470, 180, 22, 32, 0.5, P.blushD, 0.95); dab(ctx, 462, 205, 14, 12, 0, P.sage, 0.95);
    } else if (kind === "fg-leaves") {
      const B = curve([-30, 420], [260, 330], [580, 170], 8, hex("#8d7a5c"));
      for (let i = 1; i < 12; i++) {
        const t = i / 12, [x, y] = B(t), sd = i % 2 ? -1 : 1;
        leaf(x, y, -0.45 + sd * (0.9 - t * 0.3), 160 - t * 60, 44 - t * 14, i === 7 ? hex("#dfa65a") : mix(P.sage, P.sageL, r()));
      }
      for (const [x, y] of [[330, 330], [345, 345], [320, 352], [338, 362]]) { dab(ctx, x, y, 11, 11, 0, P.coral, 1); dab(ctx, x - 3, y - 3, 4, 3, 0, hex("#fde0d6"), 0.9); }
    } else {
      petal(40, 110, -0.35, 150, 80, P.coral, P.coralD);
      petal(200, 230, 0.6, 120, 64, P.blush, P.blushD);
      petal(170, 60, 0.15, 100, 44, P.white, P.whiteS);
    }
  });
  lightRelief(cv, hcv, S, S, 1);
  PAINT.hx = null;
  return cv;
}

if (process.argv.includes("--foreground")) {
  const dir = path.resolve("public/assets/garden/flora");
  fs.mkdirSync(dir, { recursive: true });
  for (const kind of ["fg-cosmos", "fg-daisies", "fg-rose", "fg-leaves", "fg-petals"]) {
    fs.writeFileSync(path.join(dir, `${kind}.webp`), paintForeground(kind).toBuffer("image/webp", 90));
    console.log(kind);
  }
  process.exit(0);
}

/**
 * Stemless flower heads for the Contact page's foreground: an anemone (white), a garden rose (blush), a
 * ranunculus (soft red) and one loose petal. Seen a little from the side, painted loosely petal by petal
 * with soft tonal shading, a lit rim and impasto in the lights, so they read as oil paint, not icons.
 */
function paintHead(kind) {
  const S = kind === "head-petal" ? 240 : 420;
  const cv = createCanvas(S, S), ctx = cv.getContext("2d");
  const hcv = createCanvas(S, S), hx = hcv.getContext("2d");
  hx.fillStyle = grey(20);
  hx.fillRect(0, 0, S, S);
  PAINT.hx = hx;
  const r = rng(2300 + kind.charCodeAt(5) * 3 + kind.length);
  const c = S / 2, squash = 0.84; // a slight three-quarter view
  // a cupped petal: a soft body, a shaded base toward the centre, bristle strokes along it and a lit rim
  const petal = (ang, d, len, w, col, shade, light) => {
    const x = c + Math.cos(ang) * d, y = c + Math.sin(ang) * d * squash;
    const tx = c + Math.cos(ang) * (d + len * 0.5), ty = c + Math.sin(ang) * (d + len * 0.5) * squash;
    ctx.save(); ctx.filter = "blur(1.2px)"; dab(ctx, tx, ty, len * 0.55, w * 0.5, ang, col, 0.96); ctx.restore();
    dab(ctx, tx, ty, len * 0.5, w * 0.44, ang, col, 0.9);
    dab(ctx, x + Math.cos(ang) * len * 0.1, y + Math.sin(ang) * len * 0.1 * squash, len * 0.24, w * 0.3, ang, shade, 0.5);
    // a few soft bristle marks that stay inside the petal, and a lit rim toward its outer edge
    for (let i = 0; i < 4; i++) {
      const o = (r() - 0.5) * w * 0.4;
      stroke(ctx, r, x + Math.cos(ang) * len * 0.15 - Math.sin(ang) * o, y + (Math.sin(ang) * len * 0.15 + Math.cos(ang) * o) * squash, ang + (r() - 0.5) * 0.12, len * (0.4 + r() * 0.2), w * 0.1, mix(col, i % 2 ? light : shade, 0.2 + r() * 0.15), 0.4, 2);
    }
    const ex = c + Math.cos(ang) * (d + len * 0.78), ey = c + Math.sin(ang) * (d + len * 0.78) * squash;
    if (r() < 0.6) dab(ctx, ex + (r() - 0.5) * w * 0.2, ey, len * (0.1 + r() * 0.12), w * (0.14 + r() * 0.16), ang + Math.PI / 2 + (r() - 0.5) * 0.5, light, 0.22 + r() * 0.25);
  };
  withThickness(0.85, () => {
    if (kind === "head-white") {
      // an anemone: broad white petals, cool grey-violet in the shadows, a dark velvet heart ringed with stamens
      const n = 6;
      for (let i = 0; i < n; i++) petal((i / n) * Math.PI * 2 + 0.3 + (r() - 0.5) * 0.15, 12, 150, 132, mix(hex("#fbf7f0"), hex("#f1ece6"), r()), hex("#c9c3cf"), hex("#fffdf8"));
      for (let i = 0; i < n; i++) petal((i / n) * Math.PI * 2 + 0.3 + Math.PI / n, 8, 120, 104, mix(hex("#fdfaf4"), hex("#f4eee8"), r()), hex("#d4cdd6"), hex("#ffffff"));
      dab(ctx, c, c, 30, 27, 0, hex("#3e3a3c"), 1);
      for (let i = 0; i < 36; i++) { const a = r() * Math.PI * 2, d2 = 26 + r() * 14; dab(ctx, c + Math.cos(a) * d2, c + Math.sin(a) * d2 * squash, 3.2, 3.2, 0, r() < 0.8 ? hex("#2f2b2d") : hex("#d9b25a"), 0.95); }
      dab(ctx, c - 8, c - 9, 9, 7, 0, hex("#6a6466"), 0.8);
    } else if (kind === "head-blush" || kind === "head-red") {
      // a garden rose (blush) or a ranunculus (soft red): rings of cupped petals deepening to a rolled heart
      const red = kind === "head-red";
      const base = red ? hex("#d9675c") : hex("#f0aab2"), deep = red ? hex("#a8433d") : hex("#cf7c8a"), lite = red ? hex("#f4b3a3") : hex("#fde3e3");
      const rings = red ? [12, 11, 10, 9, 8, 7, 6] : [8, 7, 6, 5, 5, 4];
      rings.forEach((n, k) => {
        const t = k / rings.length, len = (red ? 150 : 165) * (1 - t * 0.72), w = len * (red ? 0.8 : 1.0);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + k * 0.55 + (r() - 0.5) * 0.2;
          petal(a, 4 + (1 - t) * 6, len, w, mix(mix(base, lite, 0.35 - t * 0.2 + r() * 0.15), deep, t * 0.45), mix(deep, hex("#6e2a2c"), 0.2), mix(lite, hex("#ffffff"), 0.3));
        }
      });
      dab(ctx, c, c, 16, 14, 0.3, red ? hex("#8e9a5a") : deep, 0.9);
      for (let i = 0; i < 4; i++) stroke(ctx, r, c - 12 + i * 5, c - 4 + i * 3, 0.4 + i * 0.6, 22, 5, mix(deep, lite, r() * 0.3), 0.8, 2);
    } else {
      // a single petal, curling a little, soft red with a pale edge
      const p = new Path2D();
      p.moveTo(40, 170); p.bezierCurveTo(60, 60, 180, 30, 210, 70); p.bezierCurveTo(200, 140, 120, 200, 40, 170); p.closePath();
      ctx.save(); ctx.filter = "blur(1.2px)"; ctx.fillStyle = rgba(hex("#e07a6c")); ctx.fill(p); ctx.restore();
      clipBoth(ctx, p);
      for (let i = 0; i < 18; i++) stroke(ctx, r, 50 + r() * 40, 150 + r() * 20, -0.7 + (r() - 0.5) * 0.3, 120 + r() * 60, 10, mix(hex("#e07a6c"), r() < 0.5 ? hex("#f6c2b4") : hex("#b5524a"), 0.3 + r() * 0.3), 0.6, 2);
      unclipBoth(ctx);
      dab(ctx, 160, 80, 26, 8, -0.4, hex("#fbd8cc"), 0.6);
    }
  });
  lightRelief(cv, hcv, S, S, 1);
  PAINT.hx = null;
  return cv;
}

if (process.argv.includes("--heads")) {
  const dir = path.resolve("public/assets/garden/flora");
  fs.mkdirSync(dir, { recursive: true });
  for (const kind of ["head-white", "head-blush", "head-red", "head-petal"]) {
    fs.writeFileSync(path.join(dir, `${kind}.webp`), paintHead(kind).toBuffer("image/webp", 90));
    console.log(kind);
  }
  process.exit(0);
}

/**
 * Loose painted blossoms for the floating foreground: expressive, asymmetric and a little unfinished, like
 * flowers laid down quickly with a loaded brush and a knife. No stems. Each is built from heavy, tapering
 * strokes and thick dabs rather than neat petal shapes; some petals are missing, some barely suggested.
 */
function paintLoose(kind) {
  const S = 480;
  const cv = createCanvas(S, S), ctx = cv.getContext("2d");
  const hcv = createCanvas(S, S), hx = hcv.getContext("2d");
  hx.fillStyle = grey(20);
  hx.fillRect(0, 0, S, S);
  PAINT.hx = hx;
  const r = rng(2500 + [...kind].reduce((a, ch) => a + ch.charCodeAt(0), 0));
  const jit = (v, a) => v + (r() - 0.5) * a;
  // a loaded brushstroke petal: a few parallel, tapering bristle strokes from the heart outward, the paint
  // thick at the start and dragging thin at the end; lights pulled through it in a second pass
  const brushPetal = (cx, cy, ang, len, w, col, shade, light, rough = 1) => {
    const n = 2 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const o = (i - (n - 1) / 2) * w * 0.32 + (r() - 0.5) * w * 0.2 * rough;
      const a = ang + (r() - 0.5) * 0.16 * rough;
      const x = cx - Math.sin(ang) * o, y = cy + Math.cos(ang) * o;
      stroke(ctx, r, x, y, a, len * jit(1, 0.35 * rough), w * jit(0.42, 0.18), mix(col, r() < 0.4 ? shade : col, r() * 0.45), 0.9, 3);
    }
    if (r() < 0.75) stroke(ctx, r, cx + Math.cos(ang) * len * 0.15, cy + Math.sin(ang) * len * 0.15, ang + (r() - 0.5) * 0.1, len * jit(0.6, 0.3), w * 0.16, light, 0.7, 2);
  };
  // a curved, loaded stroke: short overlapping bristle strokes laid along an arc (the curling edge of a
  // petal, a swirl of impasto)
  const arcStroke = (cx, cy, rad, a0, a1, w, col, alpha = 0.92, sq = 1) => {
    const n = Math.max(2, Math.round(Math.abs(a1 - a0) * rad / 30));
    for (let i = 0; i < n; i++) {
      const t0 = a0 + ((a1 - a0) * i) / n, t1 = a0 + ((a1 - a0) * (i + 1)) / n;
      const x0 = cx + Math.cos(t0) * rad, y0 = cy + Math.sin(t0) * rad * sq, x1 = cx + Math.cos(t1) * rad, y1 = cy + Math.sin(t1) * rad * sq;
      const taper = Math.sin(((i + 0.5) / n) * Math.PI) * 0.6 + 0.4;
      stroke(ctx, r, x0, y0, Math.atan2(y1 - y0, x1 - x0), Math.hypot(x1 - x0, y1 - y0) * 1.35, w * taper, col, alpha, 3);
    }
  };
  // a shaped petal (a soft teardrop from base to tip), filled with bristle strokes that stay inside it
  const shapedPetal = (x, y, ang, len, w, col, shade, light) => {
    const tx = x + Math.cos(ang) * len, ty = y + Math.sin(ang) * len, nx = -Math.sin(ang), ny = Math.cos(ang);
    const p = new Path2D();
    p.moveTo(x, y);
    p.bezierCurveTo(x + Math.cos(ang) * len * 0.3 + nx * w * jit(0.7, 0.3), y + Math.sin(ang) * len * 0.3 + ny * w * jit(0.7, 0.3), tx + nx * w * 0.4, ty + ny * w * 0.4, tx + jit(0, 8), ty + jit(0, 8));
    p.bezierCurveTo(tx - nx * w * 0.5, ty - ny * w * 0.5, x + Math.cos(ang) * len * 0.3 - nx * w * jit(0.6, 0.3), y + Math.sin(ang) * len * 0.3 - ny * w * jit(0.6, 0.3), x, y);
    ctx.save(); ctx.filter = "blur(1.2px)"; ctx.fillStyle = rgba(col); ctx.fill(p); ctx.restore();
    clipBoth(ctx, p);
    for (let i = 0; i < 9; i++) { const o = (r() - 0.5) * w * 0.9; stroke(ctx, r, x + nx * o * 0.3, y + ny * o * 0.3, ang + (r() - 0.5) * 0.25, len * jit(0.95, 0.2), jit(w * 0.22, w * 0.1), mix(col, i % 3 === 0 ? shade : i % 3 === 1 ? light : col, 0.25 + r() * 0.3), 0.75, 3); }
    unclipBoth(ctx);
    arcStroke(x + Math.cos(ang) * len * 0.62, y + Math.sin(ang) * len * 0.62, w * 0.5, ang - 1.2, ang + 0.6, 5, light, 0.6);
  };
  // a cupped, crumpled petal mass laid with the flat of the knife (for roses and peonies)
  const swirl = (cx, cy, rad, ang0, col, light, shade) => {
    for (let i = 0; i < 3; i++) {
      const a = ang0 + i * 0.5 + (r() - 0.5) * 0.4;
      knife(ctx, r, cx + Math.cos(a) * rad * 0.3, cy + Math.sin(a) * rad * 0.3, a + Math.PI / 2, rad * jit(1.1, 0.4), rad * jit(0.32, 0.12), mix(col, i === 2 ? light : shade, r() * 0.4), 0.92);
    }
  };
  withThickness(0.95, () => {
    if (kind === "loose-daisy" || kind === "loose-daisy-half") {
      // a white daisy: long brushstroke petals radiating unevenly, some short, some missing; the half version
      // keeps only one arc of petals, like a blossom drifting in from outside the frame
      const cx = S / 2 + jit(0, 20), cy = S / 2 + jit(0, 20);
      const n = 17, from = kind === "loose-daisy-half" ? -0.4 : 0, span = kind === "loose-daisy-half" ? Math.PI * 1.15 : Math.PI * 2;
      for (let i = 0; i < n; i++) {
        if (r() < 0.14) continue;
        const a = from + (i / n) * span + jit(0, 0.2);
        const len = 150 * jit(1, 0.45), d = 26 + r() * 10;
        brushPetal(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.9, a, len, 44, mix(hex("#fbf8f1"), hex("#f2ece2"), r()), hex("#cfc8c9"), hex("#ffffff"));
      }
      // the heart: thick dabs of ochre and butter, a few darker flecks, not quite round
      for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = r() * 30; dab(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.85, jit(10, 6), jit(8, 5), r() * 3, mix(hex("#e6b347"), r() < 0.25 ? hex("#a8742a") : hex("#f7dc8c"), r()), 0.95); }
    } else if (kind === "lily") {
      // a pink stargazer lily, after the first reference: six long pointed petals of uneven length, curling
      // back at the tips, white-edged, deeper magenta down the middle and freckled; curved stamens
      const cx = S / 2 + jit(0, 16), cy = S / 2 + jit(0, 16);
      const petals = [...Array(6)].map((_, i) => ({ a: (i / 6) * Math.PI * 2 + jit(0.2, 0.35), len: jit(185, 60) }));
      for (const { a, len } of petals) {
        shapedPetal(cx, cy, a, len, jit(100, 22), mix(hex("#f2a0b8"), hex("#f8c6d4"), r() * 0.5), hex("#c44a78"), hex("#fff2f4"));
        stroke(ctx, r, cx + Math.cos(a) * 10, cy + Math.sin(a) * 10, a + jit(0, 0.08), len * 0.6, 10, hex("#d6467a"), 0.55, 3); // the deeper vein
        for (let i = 0; i < 7; i++) { const t = 0.2 + r() * 0.5, o = (r() - 0.5) * 22; dab(ctx, cx + Math.cos(a) * len * t - Math.sin(a) * o, cy + Math.sin(a) * len * t + Math.cos(a) * o, 3, 2.4, a, hex("#8e2a4c"), 0.85); }
        if (r() < 0.6) stroke(ctx, r, cx + Math.cos(a) * len * 0.35 + Math.sin(a) * 14, cy + Math.sin(a) * len * 0.35 - Math.cos(a) * 14, a, len * 0.5, 4, hex("#fff1f4"), 0.6, 2); // a pale edge
      }
      for (let i = 0; i < 6; i++) {
        const a = jit(-1.2, 1.6), len = jit(80, 20);
        stroke(ctx, r, cx, cy, a, len, 3, hex("#c7d79a"), 0.9, 1);
        dab(ctx, cx + Math.cos(a) * len, cy + Math.sin(a) * len, 7, 3.5, a + Math.PI / 2, hex("#6b3226"), 0.95);
      }
    } else if (kind === "hibiscus") {
      // a soft pink hibiscus, after the second reference: five broad, crumpled petals laid with a flat brush,
      // warm rose deepening to crimson at the throat, a long pistil tipped with yellow and red
      const cx = S / 2 + jit(0, 16), cy = S / 2 + jit(0, 16);
      ctx.save(); ctx.filter = "blur(3px)"; glaze(ctx, cx, cy, 150, 130, hex("#ec9fb4"), 0.6); ctx.restore();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + jit(0.4, 0.3), rad = jit(150, 36);
        // a broad petal: from the throat out to a rounded, wavy outer edge of uneven reach
        const p = new Path2D();
        const edge = [...Array(6)].map((_, k) => { const t = a - 0.78 + (k / 5) * 1.56 + jit(0, 0.06); const rr = rad * (k === 0 || k === 5 ? 0.78 : jit(1, 0.14)); return [cx + Math.cos(t) * rr, cy + Math.sin(t) * rr * 0.88]; });
        p.moveTo(cx, cy);
        p.lineTo(...edge[0]);
        for (let k = 1; k < edge.length; k++) { const [x0, y0] = edge[k - 1], [x1, y1] = edge[k]; const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, ox = mx - cx, oy = my - cy; p.quadraticCurveTo(mx + ox * jit(0.14, 0.08), my + oy * jit(0.14, 0.08), x1, y1); }
        p.closePath();
        ctx.save(); ctx.filter = "blur(1.5px)"; ctx.fillStyle = rgba(mix(hex("#ef9fb6"), hex("#f6bccb"), r())); ctx.fill(p); ctx.restore();
        clipBoth(ctx, p);
        for (let j = 0; j < 16; j++) { const t = a + jit(0, 1.3); stroke(ctx, r, cx, cy, t, rad * jit(1.1, 0.25), jit(26, 12), mix(hex("#f2a7bd"), j % 3 ? hex("#fcd8e2") : hex("#c95a82"), 0.2 + r() * 0.45), 0.7, 3); }
        for (let j = 0; j < 3; j++) arcStroke(cx, cy, rad * jit(0.9, 0.1), a - 0.6 + j * 0.4, a - 0.3 + j * 0.4, 8, hex("#fde3ea"), 0.7);
        unclipBoth(ctx);
      }
      ctx.save(); ctx.filter = "blur(4px)"; glaze(ctx, cx, cy, 46, 40, hex("#b02a58"), 0.8); ctx.restore();
      const pa = jit(-0.9, 0.5);
      stroke(ctx, r, cx, cy, pa, 120, 6, hex("#d24a6a"), 0.95, 1);
      for (let i = 0; i < 9; i++) dab(ctx, cx + Math.cos(pa) * jit(105, 20) + jit(0, 10), cy + Math.sin(pa) * jit(105, 20) + jit(0, 10), 4, 4, 0, r() < 0.6 ? hex("#f2c955") : hex("#b8233f"), 0.95);
    } else if (kind === "daffodil") {
      // a daffodil, after the fourth reference: six broad cream-yellow petals in thick strokes, an orange,
      // ruffled trumpet with a darker throat
      const cx = S / 2 + jit(0, 16), cy = S / 2 + jit(0, 16);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + jit(0.3, 0.3);
        shapedPetal(cx, cy, a, jit(160, 34), jit(92, 20), mix(hex("#f6e3a0"), hex("#fbf1cf"), r()), hex("#d8b45a"), hex("#fffbea"));
      }
      ctx.save(); ctx.filter = "blur(2px)"; glaze(ctx, cx, cy, 68, 62, hex("#ec8a3a"), 0.95); ctx.restore();
      for (let k = 0; k < 3; k++) for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + k * 0.3; arcStroke(cx + jit(0, 4), cy + jit(0, 4), 64 - k * 16 + jit(0, 6), a, a + 0.7, 14 - k * 3, mix(hex("#f29a3e"), k === 2 ? hex("#b8481e") : hex("#f6c25c"), r() * 0.6), 0.9); }
      dab(ctx, cx, cy, 18, 16, 0, hex("#9a3a18"), 0.9);
    } else if (kind === "loose-peony" || kind === "loose-peony-red" || kind === "rose-lavender") {
      // a full, ragged peony: a soft irregular body, then curling swirls of thick paint — the cupped petals —
      // deepening toward a dark pocket at the heart, with a few lights dragged across the top; open on one side
      // (the lavender rose, after the fifth reference, is the same sculptural build in lavender-blue)
      const pal = { "loose-peony": ["#f2a9b3", "#fde4e4", "#d27c8d"], "loose-peony-red": ["#e57766", "#f9cdbd", "#b34c45"], "rose-lavender": ["#a9a8d8", "#e8e6f8", "#6f6aa8"] }[kind];
      const [base, light, shade] = pal.map(hex);
      const cx = S / 2 + jit(0, 24), cy = S / 2 + jit(0, 24);
      ctx.save(); ctx.filter = "blur(5px)";
      for (let i = 0; i < 7; i++) { const a = r() * Math.PI * 2, d = r() * 20; glaze(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, jit(80, 24), jit(66, 18), mix(base, shade, r() * 0.3), 0.4); }
      ctx.restore();
      const open = r() * Math.PI * 2; // the side where the outer petals fall away
      // petals as broad, uneven curls: each centred somewhere off the heart, at its own radius and sweep,
      // so the bloom is lopsided and loose rather than a tidy spiral
      for (let k = 0; k < 5; k++) {
        const rad = 150 * (1 - k * 0.17), n = 6 - Math.floor(k / 2);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + k * 1.1 + jit(0, 0.9);
          if (k < 2 && Math.cos(a - open) > 0.4) continue;
          const pc = cx + Math.cos(a) * rad * jit(0.3, 0.3), py = cy + Math.sin(a) * rad * jit(0.25, 0.25);
          const col = mix(mix(base, light, 0.08 + k * 0.1 + r() * 0.25), shade, r() < 0.35 ? 0.4 : 0);
          const sweep = jit(0.8, 0.5);
          arcStroke(pc, py, rad * jit(0.62, 0.3), a - sweep, a + sweep * jit(1, 0.5), jit(40, 16) * (1 - k * 0.12), col, 0.94, 0.82);
          if (r() < 0.45) arcStroke(pc, py, rad * jit(0.7, 0.2), a - sweep * 0.6, a + sweep * 0.2, 7, light, 0.7, 0.82);
        }
      }
      for (let i = 0; i < 5; i++) arcStroke(cx + jit(0, 14), cy + jit(0, 12), jit(18, 10), r() * 6, r() * 6 + 2.4, 8, mix(shade, kind === "rose-lavender" ? hex("#3e3a72") : hex("#6f2a30"), 0.35), 0.85);
    } else if (kind === "loose-poppy") {
      // a soft coral poppy: four broad, uneven petals — strokes radiating inside each, a crinkled lit rim — and a
      // dark heart with a few stamens
      const cx = S / 2 + jit(0, 20), cy = S / 2 + jit(0, 20);
      const base = hex("#ec8a76"), light = hex("#fbd0be"), shade = hex("#c25a4f");
      for (let i = 0; i < 4; i++) {
        const a = i * (Math.PI / 2) + jit(0.3, 0.5), rad = jit(128, 46);
        const px = cx + Math.cos(a) * rad * 0.52, py = cy + Math.sin(a) * rad * 0.48;
        const p = new Path2D();
        p.ellipse(px, py, rad * 0.68, rad * 0.56, a, 0, Math.PI * 2);
        ctx.save(); ctx.filter = "blur(1.5px)"; ctx.fillStyle = rgba(mix(base, shade, r() * 0.25)); ctx.fill(p); ctx.restore();
        clipBoth(ctx, p);
        for (let j = 0; j < 14; j++) stroke(ctx, r, cx, cy, a + jit(0, 1.1), rad * jit(1.2, 0.3), jit(20, 10), mix(base, j % 3 ? light : shade, 0.2 + r() * 0.4), 0.7, 3);
        for (let j = 0; j < 4; j++) arcStroke(px, py, rad * jit(0.55, 0.12), a - 1.1 + j * 0.5, a - 0.6 + j * 0.5, 7, j % 2 ? light : mix(base, light, 0.5), 0.75);
        unclipBoth(ctx);
      }
      dab(ctx, cx, cy, 28, 25, 0.4, hex("#3d3534"), 1);
      for (let i = 0; i < 22; i++) { const a = r() * Math.PI * 2, d = 24 + r() * 16; stroke(ctx, r, cx, cy, a, d, 3, r() < 0.7 ? hex("#2e2828") : hex("#d9b25a"), 0.85, 1); }
    } else {
      // drifting fragments: three or four loose petals, a white one and two pinks, scattered as if blown
      for (const [x, y, a, len, col, sh] of [[150, 160, -0.6, 160, hex("#fbf7f0"), hex("#d6cfcf")], [300, 250, 0.5, 130, hex("#f2a9b3"), hex("#d47f8f")], [210, 340, -1.8, 110, hex("#e57766"), hex("#b34c45")], [350, 120, 2.6, 90, hex("#f6c9cf"), hex("#d47f8f")]]) {
        shapedPetal(x, y, a, len, 62, col, sh, mix(col, hex("#ffffff"), 0.5));
      }
    }
  });
  lightRelief(cv, hcv, S, S, 0.75); // close to the backdrop's relief (0.6): textured, but not glossy
  PAINT.hx = null;
  return harmonize(cv, S);
}

/**
 * Bring a foreground flower into the backdrop's world: colours drawn a little toward the garden's warm
 * light (less saturated, a touch of peach and cream, as in the sky and meadow), and the silhouette softened
 * with a faint halo of its own paint so the edge reads as a brush edge, not a cut-out.
 */
function harmonize(cv, S) {
  const ctx = cv.getContext("2d");
  const img = ctx.getImageData(0, 0, S, S), d = img.data;
  const warm = hex("#f3dcc8");
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
    for (let c = 0; c < 3; c++) d[i + c] = lerp(lerp(d[i + c], l, 0.14), warm[c], 0.1);
  }
  ctx.putImageData(img, 0, 0);
  const out = createCanvas(S, S), o = out.getContext("2d");
  o.filter = "blur(2.5px)";
  o.globalAlpha = 0.55;
  o.drawImage(cv, 0, 0);
  o.filter = "none";
  o.globalAlpha = 1;
  o.drawImage(cv, 0, 0);
  return out;
}

if (process.argv.includes("--loose")) {
  const dir = path.resolve("public/assets/garden/flora");
  fs.mkdirSync(dir, { recursive: true });
  for (const kind of ["loose-daisy", "loose-daisy-half", "loose-peony", "loose-peony-red", "loose-poppy", "loose-petals", "lily", "hibiscus", "daffodil", "rose-lavender"]) {
    fs.writeFileSync(path.join(dir, `${kind}.webp`), paintLoose(kind).toBuffer("image/webp", 90));
    console.log(kind);
  }
  process.exit(0);
}

// ---------------------------------------------------------------- refinements: navigation wash, About ornaments

/**
 * The navigation's painted wash and the About page's small ornaments (a sprig of pink buds by the name, a
 * blossom by Education, daisies by Experience, the vine under each heading, the portrait's painted mat), all
 * built from the same bristle strokes, dabs and impasto relief as the garden. Decorative only (Category A).
 *
 *   node scripts/paint-landing.mjs --refine   → public/assets/garden/nav/*.webp, public/assets/garden/about/orn-*.webp
 */
function paintRefine(kind) {
  const SIZES = { "nav-wash": [2400, 150], "nav-wash-night": [2400, 150], "nav-cloud": [720, 190], "nav-cloud-night": [720, 190], "orn-sprig": [300, 600], "orn-blossom": [420, 420], "orn-daisies": [380, 560], "orn-vine": [576, 72], "frame": [640, 910] };
  const [W, H] = SIZES[kind];
  const cv = createCanvas(W, H), ctx = cv.getContext("2d");
  const hcv = createCanvas(W, H), hx = hcv.getContext("2d");
  hx.fillStyle = grey(20);
  hx.fillRect(0, 0, W, H);
  PAINT.hx = hx;
  const r = rng(4100 + [...kind].reduce((a, ch) => a + ch.charCodeAt(0), 0));
  const jit = (v, a) => v + (r() - 0.5) * a;
  const pick = (cols) => hex(cols[Math.floor(r() * cols.length)]);
  // a small leaf or petal: a soft teardrop from base to tip, filled with a few bristle strokes kept inside it
  const leaf = (x, y, ang, len, w, col, shade, light, alpha = 0.92) => {
    const tx = x + Math.cos(ang) * len, ty = y + Math.sin(ang) * len, nx = -Math.sin(ang), ny = Math.cos(ang);
    const p = new Path2D();
    p.moveTo(x, y);
    p.bezierCurveTo(x + Math.cos(ang) * len * 0.3 + nx * w * jit(0.75, 0.25), y + Math.sin(ang) * len * 0.3 + ny * w * jit(0.75, 0.25), tx + nx * w * 0.35, ty + ny * w * 0.35, tx, ty);
    p.bezierCurveTo(tx - nx * w * 0.45, ty - ny * w * 0.45, x + Math.cos(ang) * len * 0.3 - nx * w * jit(0.6, 0.25), y + Math.sin(ang) * len * 0.3 - ny * w * jit(0.6, 0.25), x, y);
    ctx.save(); ctx.filter = `blur(${Math.max(0.6, w * 0.03)}px)`; ctx.fillStyle = rgba(col, alpha); ctx.fill(p); ctx.restore();
    clipBoth(ctx, p);
    for (let i = 0; i < 7; i++) {
      const o = (r() - 0.5) * w * 0.8;
      stroke(ctx, r, x + nx * o * 0.3, y + ny * o * 0.3, ang + (r() - 0.5) * 0.3, len * jit(0.95, 0.2), Math.max(1.5, jit(w * 0.24, w * 0.1)), mix(col, i % 3 === 0 ? shade : i % 3 === 1 ? light : col, 0.25 + r() * 0.35), 0.75, 3);
    }
    unclipBoth(ctx);
  };
  // a stem: overlapping short strokes along a curve, so the line is a little uneven like a loaded brush
  const stem = (pts, w, cols) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      for (let k = 0; k < 2; k++) stroke(ctx, r, x0 + jit(0, w * 0.12), y0 + jit(0, w * 0.12), Math.atan2(y1 - y0, x1 - x0) + jit(0, 0.03), Math.hypot(x1 - x0, y1 - y0) * 1.2, w * (k ? 0.55 : jit(1, 0.3)), pick(cols), 0.9, 2);
    }
  };
  const curve = (x0, y0, x1, y1, bend, n = 14) => [...Array(n + 1)].map((_, i) => { const t = i / n; return [lerp(x0, x1, t) + Math.sin(t * Math.PI) * bend, lerp(y0, y1, t)]; });
  const daisy = (cx, cy, R, tilt = 1) => {
    const n = 15;
    for (let i = 0; i < n; i++) {
      if (r() < 0.1) continue;
      const a = (i / n) * Math.PI * 2 + jit(0, 0.18), len = R * jit(1, 0.35);
      const x = cx + Math.cos(a) * R * 0.16, y = cy + Math.sin(a) * R * 0.16 * tilt;
      stroke(ctx, r, x, y, Math.atan2(Math.sin(a) * tilt, Math.cos(a)), len * Math.hypot(Math.cos(a), Math.sin(a) * tilt), R * 0.24, mix(hex("#fbf7ef"), hex("#efe7dc"), r()), 0.95, 3);
      if (r() < 0.6) stroke(ctx, r, x, y, Math.atan2(Math.sin(a) * tilt, Math.cos(a)), len * 0.55, R * 0.08, hex("#ffffff"), 0.7, 1);
    }
    for (let i = 0; i < 20; i++) { const a = r() * Math.PI * 2, d = r() * R * 0.2; dab(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d * tilt, jit(R * 0.08, R * 0.05), jit(R * 0.065, R * 0.04), r() * 3, mix(hex("#e6b347"), r() < 0.25 ? hex("#a8742a") : hex("#f7dc8c"), r()), 0.95); }
  };
  const SAGE = ["#93ab78", "#a9bc8b", "#87a06d", "#9fb583"], STEM = ["#7d9468", "#6f8a5a", "#869d6e"];

  withThickness(kind.startsWith("nav") ? 0.35 : 0.8, () => {
    if (kind === "nav-wash" || kind === "nav-wash-night") {
      // a band of thin paint laid with long horizontal strokes, its lower edge left ragged where each stroke ends
      const night = kind.endsWith("night");
      const cols = night ? ["#252d47", "#2a334f", "#232a42", "#2e3756"] : ["#fbf6ec", "#f7f0e2", "#fdf9f1", "#f4ecdc"];
      ctx.fillStyle = rgba(hex(cols[0]), 0.96);
      ctx.fillRect(0, 0, W, 100);
      for (let row = 0; row < 7; row++) {
        const y = 8 + row * 14;
        for (let x = -100; x < W + 100; x += jit(220, 120)) stroke(ctx, r, x, y + jit(0, 8), jit(0, 0.03), jit(320, 160), jit(34, 12), pick(cols), 0.9, 3);
      }
      // the ragged lower edge: shorter strokes dipping to different depths
      for (let x = -60; x < W + 60; x += jit(90, 60)) stroke(ctx, r, x, jit(108, 22), jit(0, 0.08), jit(140, 90), jit(20, 10), pick(cols), 0.8, 3);
      // a whisper of the garden along it: faint sage (or, at night, lavender) brushed under the edge
      const hint = night ? ["#4a5078", "#3c4468"] : ["#d8e0c6", "#cfd9bb", "#ecd9cf"];
      for (let x = 0; x < W; x += jit(260, 160)) stroke(ctx, r, x, jit(112, 16), jit(0, 0.05), jit(200, 120), jit(8, 5), pick(hint), 0.45, 2);
    } else if (kind === "nav-cloud" || kind === "nav-cloud-night") {
      // the same paint as a small soft cloud behind the links on the Landing, ragged at every edge
      const night = kind.endsWith("night");
      const cols = night ? ["#252d47", "#2a334f", "#232a42", "#2e3756"] : ["#fbf6ec", "#f7f0e2", "#fdf9f1", "#f4ecdc"];
      const cx = W / 2, cy = H / 2;
      for (let i = 0; i < 70; i++) {
        const t = r() * Math.PI * 2, d = Math.sqrt(r());
        const x = cx + Math.cos(t) * d * (W / 2 - 90), y = cy + Math.sin(t) * d * (H / 2 - 40);
        stroke(ctx, r, x - 80, y, jit(0, 0.12), jit(190, 80), jit(32, 12), pick(cols), 0.85, 3);
      }
    } else if (kind === "orn-sprig") {
      // a sprig of sweet-pea buds: a slender stem, alternating sage leaves, pink buds opening at the top
      const pts = curve(150, 590, 168, 70, -26);
      stem(pts, 7, STEM);
      for (let i = 0; i < 6; i++) {
        const [x, y] = pts[12 - i * 2 > 1 ? 12 - i * 2 : 2];
        const side = i % 2 ? 1 : -1;
        leaf(x, y, -Math.PI / 2 + side * jit(1.0, 0.25), jit(86, 24) - i * 4, jit(30, 8), pick(SAGE), hex("#5f7a4c"), hex("#d3dfbd"));
      }
      // the buds: small cupped dabs, deeper at the base, a lit edge; one opened into a little flower
      const buds = [[168, 72, 1], [196, 112, 0.85], [138, 118, 0.8], [184, 160, 0.65]];
      for (const [x, y, s] of buds) {
        stroke(ctx, r, x, y + 30 * s, -Math.PI / 2 + jit(0, 0.3), 30 * s, 4, pick(STEM), 0.9, 1);
        for (let k = 0; k < 4; k++) leaf(x, y + 8 * s, -Math.PI / 2 + (k - 1.5) * 0.55 + jit(0, 0.2), 40 * s * jit(1, 0.25), 28 * s, mix(hex("#eaa7a3"), hex("#f6cbc5"), r()), hex("#c4706c"), hex("#fde6e1"));
        dab(ctx, x, y + 12 * s, 9 * s, 7 * s, 0, hex("#c9807b"), 0.55);
      }
    } else if (kind === "orn-blossom") {
      // a peach blossom: five rounded petals of uneven reach, brush-lit edges, a honey heart, two leaves behind
      const cx = 210 + jit(0, 10), cy = 205 + jit(0, 10);
      leaf(cx + 40, cy + 40, 0.75, 170, 60, pick(SAGE), hex("#5f7a4c"), hex("#d3dfbd"));
      leaf(cx - 30, cy + 50, 2.1, 150, 54, pick(SAGE), hex("#5f7a4c"), hex("#d3dfbd"));
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + jit(0, 0.25);
        leaf(cx, cy, a, jit(150, 30), jit(132, 20), mix(hex("#f2b8a0"), hex("#f8cdb8"), r()), hex("#d98f7f"), hex("#fff0e6"), 0.95);
        stroke(ctx, r, cx + Math.cos(a) * 14, cy + Math.sin(a) * 14, a + jit(0, 0.1), jit(60, 20), 5, hex("#d98f7f"), 0.55, 2);
      }
      for (let i = 0; i < 18; i++) { const a = r() * Math.PI * 2, d = r() * 22; dab(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, jit(8, 4), jit(7, 4), r() * 3, mix(hex("#e3bf73"), r() < 0.3 ? hex("#b9873c") : hex("#f4dc98"), r()), 0.95); }
    } else if (kind === "orn-daisies") {
      // two daisies on slim stems, one turned a little away, two leaves at their feet
      stem(curve(190, 556, 214, 150, -18), 6, STEM);
      stem(curve(170, 556, 112, 312, 22), 5, STEM);
      leaf(186, 470, -2.5, 120, 34, pick(SAGE), hex("#5f7a4c"), hex("#d3dfbd"));
      leaf(196, 430, -0.55, 110, 30, pick(SAGE), hex("#5f7a4c"), hex("#d3dfbd"));
      daisy(112, 300, 66, 0.72);
      daisy(214, 148, 112, 0.95);
    } else if (kind === "orn-vine") {
      // the little vine under a heading: an uneven stem with small leaves along it and one blush bud at its tip
      const pts = [...Array(17)].map((_, i) => [14 + i * 33, 40 + Math.sin(i * 0.75 + 0.4) * 9 + jit(0, 3)]);
      stem(pts, 5, STEM);
      for (let i = 1; i < 15; i += 2.4) {
        const [x, y] = pts[Math.round(i)], up = Math.round(i) % 2 ? -1 : 1;
        leaf(x, y, up * jit(1.05, 0.3) - (up > 0 ? 0 : 0) , jit(30, 8), jit(14, 4), pick(SAGE), hex("#5f7a4c"), hex("#d3dfbd"));
      }
      const [ex, ey] = pts[16];
      dab(ctx, ex + 6, ey - 4, 9, 7, 0.3, hex("#eaa7a3"), 0.95);
      dab(ctx, ex + 4, ey - 6, 4.5, 3.5, 0.3, hex("#fbe0dc"), 0.85);
    } else if (kind === "frame") {
      // the portrait's mat: warm cream laid with soft crossing strokes, its outer edge left uneven, a breath of
      // sage brushed into the border
      const cols = ["#fbf6ea", "#f8f1e3", "#fcf8ef", "#f6eedf"];
      const body = new Path2D();
      body.roundRect(16, 14, W - 32, H - 28, 26);
      ctx.save(); ctx.filter = "blur(3px)"; ctx.fillStyle = rgba(hex("#f9f3e6")); ctx.fill(body); ctx.restore();
      for (let y = 20; y < H - 20; y += 26) for (let x = -30; x < W; x += jit(130, 50)) stroke(ctx, r, x, y + jit(0, 10), jit(0, 0.5), jit(150, 60), jit(28, 10), pick(cols), 0.55, 3);
      for (let i = 0; i < 46; i++) {
        // ragged edges: strokes that run a little past the border on every side
        const side = i % 4, t = r();
        const [x, y, a] = side === 0 ? [t * W, 8, 0] : side === 1 ? [t * W, H - 8, 0] : side === 2 ? [8, t * H, Math.PI / 2] : [W - 8, t * H, Math.PI / 2];
        stroke(ctx, r, x - Math.cos(a) * 60, y - Math.sin(a) * 60, a + jit(0, 0.15), jit(120, 50), jit(18, 8), pick(cols), 0.9, 3);
      }
      for (let i = 0; i < 12; i++) {
        const side = i % 4, t = 0.1 + r() * 0.8;
        const [x, y, a] = side === 0 ? [t * W, 18, 0] : side === 1 ? [t * W, H - 20, 0] : side === 2 ? [18, t * H, Math.PI / 2] : [W - 18, t * H, Math.PI / 2];
        stroke(ctx, r, x - Math.cos(a) * 30, y - Math.sin(a) * 30, a + jit(0, 0.08), jit(80, 30), jit(14, 4), pick(["#e3e8d4", "#dce3ca", "#efe2d6"]), 0.4, 2);
      }
    }
  });
  lightRelief(cv, hcv, W, H, kind.startsWith("nav") ? 0.45 : 0.75);
  PAINT.hx = null;
  // the same soft brush halo the garden's flowers have, so no edge reads as a cut-out
  const out = createCanvas(W, H), o = out.getContext("2d");
  o.filter = "blur(1.6px)";
  o.globalAlpha = 0.5;
  o.drawImage(cv, 0, 0);
  o.filter = "none";
  o.globalAlpha = 1;
  o.drawImage(cv, 0, 0);
  return out;
}

if (process.argv.includes("--refine")) {
  const navDir = path.resolve("public/assets/garden/nav"), aboutDir = path.resolve("public/assets/garden/about");
  fs.mkdirSync(navDir, { recursive: true });
  for (const kind of ["nav-wash", "nav-cloud", "orn-sprig", "orn-blossom", "orn-daisies", "orn-vine", "frame"]) {
    const dir = kind.startsWith("nav") ? navDir : aboutDir;
    fs.writeFileSync(path.join(dir, `${kind}.webp`), paintRefine(kind).toBuffer("image/webp", 88));
    console.log(kind);
  }
  process.exit(0);
}

/** v: "journal" (case studies), "about" (a quiet corner of the garden) or "contact" (the last stop). */
function paintJournal(W, H, portrait, v = "journal") {
  const cv = createCanvas(W, H);
  const ctx = cv.getContext("2d");
  const hcv = createCanvas(W, H);
  const hx = hcv.getContext("2d");
  primeCanvas(hx, W, H);
  PAINT.hx = hx;
  const r = rng(v === "journal" ? 1401 : v === "about" ? 1501 : 1601);
  const k = W / 1600;
  // the sky of the Landing's first scene: dusty rose at the top, warming to peach and cream at the horizon
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#e4a7b3");
  sky.addColorStop(0.35, "#eec0c1");
  sky.addColorStop(0.62, "#f5d7cb");
  sky.addColorStop(0.82, "#f8e5d3");
  sky.addColorStop(1, "#f3e8d6");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.filter = `blur(${160 * k}px)`;
  glaze(ctx, W / 2, H * 0.55, W * (portrait ? 0.5 : 0.32), H * 0.6, hex("#fbeee6"), 0.5); // calm light behind the text
  if (v === "about") glaze(ctx, W * 0.08, H * 0.04, W * 0.32, H * 0.3, hex("#fff3e6"), 0.45); // warm cream light from the upper left
  if (v === "contact") glaze(ctx, W / 2, H * (portrait ? 0.86 : 0.74), W * 0.7, H * 0.16, hex("#f9dcc6"), 0.5); // a soft peach warmth low in the sky
  ctx.restore();
  // long, soft horizontal strokes in the sky: it should read as paint, not a gradient
  withThickness(0.22, () => {
    for (let i = 0; i < (W * H) / 26000; i++) {
      const x = r() * W, y = r() * H * 0.85;
      const t = clamp(y / H);
      const col = r() < 0.18 && t < 0.5 ? mix(hex("#d6bcd6"), hex("#f2dde6"), r() * 0.5) : mix(mix(hex("#e7b1bc"), hex("#f8e3d3"), t), hex("#fff6ee"), 0.2 + r() * 0.35);
      stroke(ctx, r, x, y, (r() - 0.5) * 0.12 + (r() < 0.5 ? 0 : Math.PI), (180 + r() * 220) * k, (26 + r() * 30) * k, col, 0.16, 3);
    }
  });
  // long, thin streaks of cloud high in the sky, cream lit from below with a little rose and lavender, as in
  // the Landing's first scene: layered, but too faint to compete with the text
  const streak = (cx, cy, w, seed) => {
    const rr = rng(seed);
    withThickness(0.45, () => {
      for (let i = 0; i < 16; i++) {
        const x = cx + (rr() - 0.5) * w, y = cy + (rr() - 0.5) * w * 0.05;
        const col = rr() < 0.3 ? mix(hex("#e2c4d6"), hex("#f0d7df"), rr()) : mix(hex("#fbeadf"), hex("#fff6ec"), rr());
        stroke(ctx, rr, x - w * 0.15, y, (rr() - 0.5) * 0.06, w * (0.18 + rr() * 0.22), (10 + rr() * 9) * k, col, 0.3 + rr() * 0.18, 3);
      }
      for (let i = 0; i < 4; i++) knife(ctx, rr, cx + (rr() - 0.5) * w * 0.7, cy - 4 * k + rr() * 6 * k, (rr() - 0.5) * 0.05, w * 0.12, 5 * k, hex("#fff8ef"), 0.45);
    });
  };
  const streaks = portrait
    ? [[0.55, 0.2, 0.7], [0.3, 0.33, 0.6], [0.7, 0.44, 0.5]]
    : v === "about" ? [[0.3, 0.16, 0.36], [0.62, 0.3, 0.32], [0.18, 0.5, 0.24]]
    : v === "contact" ? [[0.45, 0.2, 0.36], [0.75, 0.36, 0.3], [0.2, 0.42, 0.26]]
    : [[0.42, 0.12, 0.34], [0.7, 0.3, 0.3], [0.25, 0.38, 0.28]];
  streaks.forEach(([u, t, w], i) => streak(W * u, H * t, W * w, 1460 + i + (v === "about" ? 10 : v === "contact" ? 20 : 0)));
  // the meadow: soft green hills rising along the foot of the frame, highest at the sides
  const hill = (seed, base, amp, col, lift, tilt = 0) => {
    const p = new Path2D();
    p.moveTo(-20, H + 20);
    for (let x = -20; x <= W + 20; x += 8) {
      const u = x / W, side = portrait ? 0.35 : Math.pow(Math.abs(u - 0.5) * 2, 1.6);
      const y = H * (base - side * lift + tilt * (u - 0.5)) - amp * H * (0.5 + fbm(u * 3, seed * 0.1, seed, 3));
      p.lineTo(x, y);
    }
    p.lineTo(W + 20, H + 20);
    p.closePath();
    ctx.save();
    ctx.filter = `blur(${10 * k}px)`;
    ctx.fillStyle = rgba(hex(col[0]), 0.9);
    ctx.fill(p);
    ctx.restore();
    clipBoth(ctx, p);
    withThickness(0.5, () => {
      for (let i = 0; i < (W * H) / 30000; i++) {
        const x = r() * W, y = H * (base - 0.2) + r() * H * 0.3;
        const g = mix(hex(col[0]), hex(col[1]), r()), warm = r(); // early autumn: a few strokes of the grass turning
        stroke(ctx, r, x, y, (r() - 0.5) * 0.3 + (r() < 0.5 ? 0 : Math.PI), (70 + r() * 90) * k, (16 + r() * 14) * k, warm < 0.2 ? mix(g, hex("#dcc98a"), 0.3 + r() * 0.2) : warm < 0.27 ? mix(g, hex("#e2b796"), 0.3) : g, 0.55, 3);
      }
    });
    unclipBoth(ctx);
  };
  ctx.save();
  ctx.filter = `blur(${120 * k}px)`;
  for (const u of portrait ? [0.05, 0.95] : [0.06, 0.94]) glaze(ctx, W * u, H * (portrait ? 0.88 : 0.8), W * (portrait ? 0.18 : 0.2), H * (portrait ? 0.04 : 0.1), hex("#f1dfbd"), portrait ? 0.18 : 0.3);
  ctx.restore();
  // lavender hills on the far horizon, as in the Landing's first scene; the meadow covers all but the dip
  {
    const fb = portrait ? (v === "contact" ? 0.85 : 0.88) : v === "about" ? 0.815 : v === "contact" ? 0.795 : 0.835;
    const p = new Path2D();
    p.moveTo(-20, H + 20);
    for (let x = -20; x <= W + 20; x += 8) p.lineTo(x, H * fb - H * 0.022 * (0.3 + fbm(x / W * 3.2, 3.1, 1450, 3)));
    p.lineTo(W + 20, H + 20);
    p.closePath();
    ctx.save();
    ctx.filter = `blur(${18 * k}px)`;
    ctx.fillStyle = rgba(hex("#d9c5d8"), 0.7);
    ctx.fill(p);
    ctx.restore();
    clipBoth(ctx, p);
    withThickness(0.3, () => {
      for (let i = 0; i < 46; i++) stroke(ctx, r, r() * W, H * (fb - 0.015) + r() * H * 0.03, (r() - 0.5) * 0.1, (120 + r() * 160) * k, (10 + r() * 8) * k, mix(hex("#cbb6d0"), hex("#eedbe0"), r()), 0.35, 3);
    });
    unclipBoth(ctx);
  }
  // a small distant tree just beginning to turn: a few soft dabs of sage, muted gold and peach on a thin trunk
  const tree = (x, y, s, seed, tint) => {
    const rr = rng(seed);
    withThickness(0.6, () => {
      stroke(ctx, rr, x, y + s * 0.1, -Math.PI / 2, s * 1.05, s * 0.1, hex("#9a8670"), 0.7, 1);
      const cy = y - s * 1.2;
      ctx.save();
      ctx.filter = `blur(${s * 0.25}px)`; // a soft body first, so the crown has no hard outline
      glaze(ctx, x, cy, s * 0.8, s * 0.62, mix(hex("#b7c592"), hex("#dcae6c"), tint * 0.7), 0.8);
      ctx.restore();
      for (let d = 0; d < 46; d++) {
        const a = rr() * Math.PI * 2, rad = s * Math.sqrt(rr()) * 0.72;
        const ox = x + Math.cos(a) * rad, oy = cy + Math.sin(a) * rad * 0.78;
        const lit = clamp(0.5 - (oy - cy) / (s * 1.3));
        const t = rr();
        const base = t < tint * 0.7 ? mix(hex("#dcb466"), hex("#e19d5e"), rr()) : t < tint ? hex("#e2a88a") : mix(hex("#a8bd8a"), hex("#bfca95"), rr());
        dab(ctx, ox, oy, s * (0.12 + rr() * 0.1), s * (0.1 + rr() * 0.08), rr() * Math.PI, mix(base, hex("#f8f0dc"), lit * 0.3), 0.7);
      }
    });
  };
  // a small cluster of blush flowers: thin sage stems, five soft petals, a cream heart
  const bloom = (cx, cy, w, n, seed) => {
    const rr = rng(seed);
    withThickness(0.75, () => {
      for (let i = 0; i < n; i++) {
        const x = cx + (rr() - 0.5) * w, y = cy + (rr() - 0.5) * w * 0.25, f = (6 + rr() * 5) * k, stem = (18 + rr() * 30) * k;
        stroke(ctx, rr, x, y + stem, -Math.PI / 2 + (rr() - 0.5) * 0.3, stem, 2.2 * k, mix(hex("#7f9e68"), hex("#a3bd88"), rr()), 0.85, 1);
        if (rr() < 0.5) stroke(ctx, rr, x + 2 * k, y + stem * 0.6, -Math.PI / 2 + 0.7, 10 * k, 3.5 * k, hex("#9fba84"), 0.8, 1);
        const pc = [hex("#efb7b0"), hex("#f4cbc3"), hex("#e6a5a3"), hex("#f8e3da")][Math.floor(rr() * 4)];
        for (let p2 = 0; p2 < 5; p2++) {
          const a = (p2 / 5) * Math.PI * 2 + rr() * 0.4;
          dab(ctx, x + Math.cos(a) * f * 0.7, y + Math.sin(a) * f * 0.55, f * 0.62, f * 0.4, a, mix(pc, hex("#ffffff"), rr() * 0.25), 0.9);
        }
        dab(ctx, x, y, f * 0.28, f * 0.24, 0, hex("#f3d9a0"), 0.95);
      }
    });
  };
  if (v === "about") {
    if (portrait) {
      hill(1511, 0.9, 0.03, ["#bccd98", "#d6dcaa"], 0, -0.03);
      tree(W * 0.86, H * 0.885, 46 * k, 1531, 0.55);
      hill(1512, 0.97, 0.025, ["#9fb87e", "#bac98e"], 0);
      bloom(W * 0.12, H * 0.955, W * 0.2, 7, 1541);
      bloom(W * 0.9, H * 0.965, W * 0.16, 5, 1542);
    } else {
      hill(1511, 0.86, 0.025, ["#bccd98", "#d6dcaa"], 0.1, 0.12);
      tree(W * 0.93, H * 0.86, 62 * k, 1531, 0.55);
      tree(W * 0.975, H * 0.88, 34 * k, 1533, 0.35);
      tree(W * 0.05, H * 0.79, 30 * k, 1532, 0.45);
      hill(1512, 0.97, 0.02, ["#9fb87e", "#bac98e"], 0.14);
      bloom(W * 0.06, H * 0.93, W * 0.1, 9, 1541);
      bloom(W * 0.95, H * 0.95, W * 0.08, 7, 1542);
    }
  } else if (v === "contact") {
    if (portrait) {
      hill(1611, 0.88, 0.03, ["#bccd98", "#d6dcaa"], 0);
      tree(W * 0.1, H * 0.87, 36 * k, 1631, 0.5);
      tree(W * 0.9, H * 0.865, 30 * k, 1632, 0.6);
      hill(1612, 0.95, 0.025, ["#9fb87e", "#bac98e"], 0);
      bloom(W * 0.16, H * 0.95, W * 0.26, 9, 1641);
      bloom(W * 0.84, H * 0.96, W * 0.24, 8, 1642);
    } else {
      hill(1611, 0.84, 0.025, ["#bccd98", "#d6dcaa"], 0.12);
      tree(W * 0.06, H * 0.71, 44 * k, 1631, 0.5);
      tree(W * 0.11, H * 0.745, 26 * k, 1633, 0.7);
      tree(W * 0.94, H * 0.715, 40 * k, 1632, 0.55);
      hill(1612, 0.95, 0.02, ["#9fb87e", "#bac98e"], 0.12);
      bloom(W * 0.08, H * 0.93, W * 0.12, 11, 1641);
      bloom(W * 0.92, H * 0.94, W * 0.12, 10, 1642);
      bloom(W * 0.3, H * 0.975, W * 0.06, 4, 1643);
      bloom(W * 0.72, H * 0.98, W * 0.05, 3, 1644);
    }
  } else if (portrait) {
    hill(1411, 0.92, 0.03, ["#bccd98", "#d6dcaa"], 0);
    tree(W * 0.08, H * 0.905, 34 * k, 1431, 0.55);
    tree(W * 0.93, H * 0.9, 28 * k, 1432, 0.4);
    hill(1412, 0.97, 0.025, ["#9fb87e", "#bac98e"], 0);
  } else {
    hill(1411, 0.9, 0.025, ["#bccd98", "#d6dcaa"], 0.2);
    tree(W * 0.035, H * 0.73, 40 * k, 1431, 0.6);
    tree(W * 0.085, H * 0.765, 28 * k, 1433, 0.35);
    tree(W * 0.955, H * 0.725, 44 * k, 1432, 0.5);
    tree(W * 0.905, H * 0.775, 26 * k, 1434, 0.7);
    hill(1412, 0.97, 0.02, ["#9fb87e", "#bac98e"], 0.14);
  }
  // a few blades and small white-and-blue meadow flowers along the lowest hill, kept small
  withThickness(0.7, () => {
    for (let i = 0; i < (portrait ? 70 : 110); i++) {
      const u = r(), x = u * W, side = portrait ? 1 : Math.pow(Math.abs(u - 0.5) * 2, 0.8);
      if (r() > side) continue;
      const y = H * (0.97 - (portrait ? 0 : side * 0.12)) + r() * H * 0.05;
      stroke(ctx, r, x, y, -Math.PI / 2 + (r() - 0.5) * 0.5, (14 + r() * 26) * k, (3 + r() * 2) * k, mix(hex("#7fa66a"), hex("#a9c78d"), r()), 0.85, 1);
      if (r() < 0.12) dab(ctx, x, y - 22 * k, 4 * k, 4 * k, 0, [hex("#ffffff"), hex("#f0b9c0"), hex("#e9cf86")][Math.floor(r() * 3)], 0.95);
    }
  });
  // clouds: rounded lobes of white pigment, warm-lit on top, cool-shadowed below, in the upper margins only
  const cloud = (cx, cy, w, seed) => {
    const rr = rng(seed);
    // two tiers of rounded lobes: a broad base and a few billows on top
    const lobes = [];
    const n = 8 + Math.floor(rr() * 4);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      lobes.push([cx - w / 2 + t * w + (rr() - 0.5) * w * 0.06, cy + (rr() - 0.5) * w * 0.03, w * (0.07 + Math.sin(Math.PI * t) * 0.05) * (0.85 + rr() * 0.3)]);
    }
    for (let i = 0; i < 4 + Math.floor(rr() * 2); i++) {
      const t = 0.2 + rr() * 0.6;
      lobes.push([cx - w / 2 + t * w, cy - w * (0.07 + Math.sin(Math.PI * t) * 0.06), w * (0.07 + rr() * 0.06)]);
    }
    // a soft, cool shadowed underside and a hazy body, blurred so the cloud has no outline
    ctx.save();
    ctx.filter = `blur(${12 * k}px)`;
    glaze(ctx, cx, cy + w * 0.05, w * 0.5, w * 0.07, hex("#e3c0cd"), 0.75);
    for (const [x, y, rad] of lobes) glaze(ctx, x, y, rad * 1.05, rad * 0.9, hex("#fbefe8"), 0.9);
    ctx.restore();
    // pigment: overlapping soft round dabs, lighter toward the tops, cooler below; then a few short,
    // nearly level strokes on the brightest tops for the feel of the brush, and a little thick paint
    withThickness(0.7, () => {
      const top = Math.min(...lobes.map(([, y, rad]) => y - rad)), bottom = Math.max(...lobes.map(([, y, rad]) => y + rad));
      for (const [x, y, rad] of lobes) {
        for (let d = 0; d < 9; d++) {
          const ox = x + (rr() - 0.5) * rad * 0.9, oy = y + (rr() - 0.6) * rad * 0.7, dr = rad * (0.35 + rr() * 0.4);
          const lit = clamp(1 - (oy - top) / (bottom - top));
          dab(ctx, ox, oy, dr, dr * 0.85, rr() * Math.PI, mix(hex("#ead0d8"), mix(hex("#fffaf2"), hex("#fff0dc"), rr() * 0.6), 0.35 + lit * 0.65), 0.75);
        }
      }
      for (let s2 = 0; s2 < lobes.length * 2; s2++) {
        const [x, y, rad] = lobes[Math.floor(rr() * lobes.length)];
        stroke(ctx, rr, x - rad * 0.5, y - rad * (0.2 + rr() * 0.4), (rr() - 0.5) * 0.3, rad * (0.6 + rr() * 0.5), rad * 0.16, mix(hex("#ffffff"), hex("#fff3e4"), rr()), 0.7, 3);
      }
      for (let s2 = 0; s2 < 4; s2++) { const [x, y, rad] = lobes[n + Math.floor(rr() * (lobes.length - n))] ?? lobes[0]; knife(ctx, rr, x - rad * 0.3, y - rad * 0.55, -0.15 + rr() * 0.3, rad * 0.55, rad * 0.14, hex("#fffaf2"), 0.65); }
    });
  };
  if (v === "about") {
    if (portrait) { cloud(W * 0.78, H * 0.07, W * 0.46, 1521); }
    else { cloud(W * 0.88, H * 0.11, W * 0.24, 1521); cloud(W * 0.05, H * 0.42, W * 0.12, 1522); }
  } else if (v === "contact") {
    if (portrait) { cloud(W * 0.22, H * 0.08, W * 0.44, 1621); cloud(W * 0.86, H * 0.2, W * 0.3, 1622); }
    else { cloud(W * 0.12, H * 0.14, W * 0.24, 1621); cloud(W * 0.86, H * 0.2, W * 0.22, 1622); }
  } else if (portrait) {
    cloud(W * 0.2, H * 0.07, W * 0.5, 1421);
    cloud(W * 0.84, H * 0.15, W * 0.4, 1422);
  } else {
    cloud(W * 0.1, H * 0.13, W * 0.26, 1421);
    cloud(W * 0.9, H * 0.1, W * 0.28, 1422);
    cloud(W * 0.94, H * 0.45, W * 0.15, 1423);
    cloud(W * 0.05, H * 0.52, W * 0.13, 1424);
  }
  lightRelief(cv, hcv, W, H, 0.6);
  PAINT.hx = null;
  return cv;
}

if (process.argv.includes("--journal")) {
  const dir = path.resolve("public/assets/garden/journal");
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, W, H, portrait] of [["desktop", 2000, 1250, false], ["mobile", 900, 1600, true]]) {
    fs.writeFileSync(path.join(dir, `journal-${name}.webp`), paintJournal(W, H, portrait).toBuffer("image/webp", 84));
    console.log(`journal-${name}`);
  }
  process.exit(0);
}

// the About and Contact backdrops: the same sky and meadow, composed as other corners of the garden
for (const v of ["about", "contact"]) {
  if (!process.argv.includes(`--${v}`)) continue;
  const dir = path.resolve(`public/assets/garden/${v}`);
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, W, H, portrait] of [["desktop", 2000, 1250, false], ["mobile", 900, 1600, true]]) {
    fs.writeFileSync(path.join(dir, `${v}-${name}.webp`), paintJournal(W, H, portrait, v).toBuffer("image/webp", 84));
    console.log(`${v}-${name}`);
  }
  process.exit(0);
}

/**
 * The Work garden as a full-width panorama (3000 × 1350): the same scene, not
 * stretched. The landscape (sky, clouds, hills) is painted across the new width;
 * every object — landmarks, path, trees, flowers, the girl's start and stand
 * points — keeps its exact pixel size and is re-placed around the centre with a
 * little more room between the landmarks; new trees and flowers fill the sides.
 */
const WORK_WIDE = (() => {
  const W0 = WORK_DESKTOP.W, W1 = 3000, size = W0 / W1, spread = 1.12;
  const X = (x) => +(0.5 + (x - 0.5) * size * spread).toFixed(4);
  const L = WORK_DESKTOP.layout;
  return {
    ...WORK_DESKTOP,
    W: W1,
    layout: {
      ...L,
      trails: L.trails.map(([a, c, b, w0, w1]) => [[X(a[0]), a[1]], [X(c[0]), c[1]], [X(b[0]), b[1]], w0 * size, w1 * size]),
      trees: [
        ...L.trees.map(([x, y, sz, kind]) => [X(x), y, sz * size, kind]),
        [0.025, 0.62, 0.05, "turning"], [0.985, 0.6, 0.05, "autumn"], [0.2, 0.47, 0.014, "green"], [0.84, 0.46, 0.013, "green"],
      ],
      clusters: [
        ...L.clusters.map((c) => ({ ...c, x: X(c.x), rx: c.rx * size })),
        { seed: 904, x: 0.04, y: 0.93, rx: 0.05, ry: 0.025, n: 26, size: [9, 15], kinds: ["daisy", "cosmos", "tiny"], foliage: true, stems: true },
        { seed: 905, x: 0.965, y: 0.93, rx: 0.05, ry: 0.025, n: 26, size: [9, 15], kinds: ["daisy", "tiny"], foliage: true, stems: true },
      ],
      start: [X(L.start[0]), L.start[1]],
      landmarks: L.landmarks.map((m) => ({
        ...m,
        x: X(m.x),
        ...(m.w ? { w: m.w * size } : {}),
        ...(m.h ? { h: m.h * size } : {}),
        ...(m.puppy ? { puppy: [X(m.puppy[0]), m.puppy[1], m.puppy[2] * size] } : {}),
        stand: [X(m.stand[0]), m.stand[1]],
        label: [X(m.label[0]), m.label[1]],
      })),
    },
  };
})();

if (process.argv.includes("--work")) {
  const WORK_ANCHORS = path.resolve("src/data/work-anchors.json");
  const out = {};
  for (const F of [WORK_WIDE, WORK_MOBILE]) {
    const t0 = Date.now();
    const { cv, anchors, sprites } = paint(F);
    const fmt = F.name.replace("work-", "");
    out[fmt] = { ...anchors.work, sprites: anchors.sprites };
    const dir = path.resolve("public/assets/garden/work");
    fs.mkdirSync(path.join(dir, "sprites"), { recursive: true });
    const widths = fmt === "desktop" ? [3000, 2000] : [1080, 720];
    for (const w of widths) {
      const h = Math.round((F.H * w) / F.W);
      const o = createCanvas(w, h);
      const oc = o.getContext("2d");
      oc.imageSmoothingQuality = "high";
      oc.drawImage(cv, 0, 0, w, h);
      fs.writeFileSync(path.join(dir, `garden-${fmt}-${w}.webp`), o.toBuffer("image/webp", 88));
    }
    for (const sp of sprites) {
      const scale = fmt === "desktop" ? 2000 / 3000 : 1;
      const w = Math.max(2, Math.round(sp.canvas.width * scale)), h = Math.max(2, Math.round(sp.canvas.height * scale));
      const o = createCanvas(w, h);
      const oc = o.getContext("2d");
      oc.imageSmoothingQuality = "high";
      oc.drawImage(sp.canvas, 0, 0, w, h);
      fs.writeFileSync(path.join(dir, "sprites", `${fmt}-${sp.name.replace("work-", "")}.webp`), o.toBuffer("image/webp", 90));
    }
    console.log(`${F.name}: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  fs.writeFileSync(WORK_ANCHORS, JSON.stringify(out, null, 2) + "\n");
  process.exit(0);
}

fs.mkdirSync(PREVIEW ? PREVIEW_DIR : OUT, { recursive: true });
const allAnchors = fs.existsSync(ANCHORS) ? JSON.parse(fs.readFileSync(ANCHORS, "utf8")) : {};
for (const F of [DESKTOP, MOBILE]) {
  if (ONLY && ONLY !== F.name) continue;
  const t0 = Date.now();
  const { cv, anchors, sprites } = paint(F);
  allAnchors[F.name] = anchors;
  if (PREVIEW) {
    const w = Math.round(F.W / 3), h = F.S;
    const pv = createCanvas(w, h);
    pv.getContext("2d").drawImage(cv, 0, 0, w, h);
    fs.writeFileSync(path.join(PREVIEW_DIR, `preview-${F.name}.jpg`), pv.toBuffer("image/jpeg", 85));
  } else {
    fs.mkdirSync(path.join(OUT, "sprites"), { recursive: true });
    for (const sp of sprites) {
      // layers are stored at the 1600 / 1080 working width to stay light
      const scale = F.name === "desktop" ? 1600 / 2400 : 1;
      const w = Math.max(2, Math.round(sp.canvas.width * scale)), h = Math.max(2, Math.round(sp.canvas.height * scale));
      const out = createCanvas(w, h);
      const oc = out.getContext("2d");
      oc.imageSmoothingQuality = "high";
      oc.drawImage(sp.canvas, 0, 0, w, h);
      fs.writeFileSync(path.join(OUT, "sprites", `${F.name}-${sp.name}.webp`), out.toBuffer("image/webp", 90));
    }
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
