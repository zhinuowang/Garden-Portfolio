// Paints the Landing garden: ONE tall painting in three scenes, rendered as
// layered watercolor washes and oil-style bristle strokes, then sliced into
// three scene images so the joins are seamless by construction.
//
// Decorative artwork only (Category A), never project work. These renders are
// interim placeholders until hand-painted artwork exists (docs/LANDING-ART-SPEC.md).
//
//   node scripts/paint-landing.mjs            → public/assets/garden/landing/*.webp
//   node scripts/paint-landing.mjs --preview  → quick quarter-size PNGs in /tmp-free scratch (see PREVIEW_DIR)

import { createCanvas, Path2D } from "@napi-rs/canvas";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("public/assets/garden/landing");
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

// ---------------------------------------------------------------- brushes

/**
 * One oil-paint stroke: a thin body of colour carrying streaks from individual
 * bristles, with ragged, uneven ends. `texture` 0 gives a plain dab (flowers).
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
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (const p of left) ctx.lineTo(p[0], p[1]);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fillStyle = rgba(col, texture ? alpha * 0.6 : alpha);
  ctx.fill();
  if (!texture) return;
  // bristles: each hair drags its own slightly different pigment, and stops at its own place
  ctx.lineCap = "round";
  const n = Math.min(14, Math.max(3, Math.round(w / 2.2)));
  for (let k = 0; k < n; k++) {
    const off = (-0.5 + (k + 0.2 + r() * 0.6) / n) * w * 0.92;
    const t0 = r() * 0.18, t1 = 0.62 + r() * 0.38;
    const shade = r() < 0.55 ? mix(col, WARM, r() * 0.16) : mix(col, SHADOW, r() * 0.14);
    ctx.beginPath();
    const a = pt(t0, off), m = pt((t0 + t1) / 2, off), b = pt(t1, off);
    ctx.moveTo(a[0], a[1]);
    ctx.quadraticCurveTo(m[0], m[1], b[0], b[1]);
    ctx.strokeStyle = rgba(shade, alpha * (0.45 + r() * 0.5));
    ctx.lineWidth = Math.max(0.7, (w / n) * (0.9 + r() * 0.7));
    ctx.stroke();
  }
}

/** Soft round dab (for distant foliage, blossoms, pigment spots). */
function dab(ctx, x, y, rx, ry, rot, col, alpha) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = rgba(col, alpha);
  ctx.fill();
}

// ---------------------------------------------------------------- painting

function paint(F) {
  const { W, S, k } = F; // width, scene height, brush scale
  const H = S * 3;
  const cv = createCanvas(W, H);
  const ctx = cv.getContext("2d");
  const X = (f) => f * W;
  const Y = (f) => f * S;
  const L = F.layout;

  // calm zones: where the words sit, the paint is quieter and lighter
  const zones = L.zones.map((z) => ({ cx: X(z.x), cy: Y(z.y), rx: X(z.rx), ry: Y(z.ry), light: hex(z.light), amt: z.amt }));
  const calm = (x, y) => {
    let c = 0;
    for (const z of zones) {
      const d = ((x - z.cx) / z.rx) ** 2 + ((y - z.cy) / z.ry) ** 2;
      if (d < 1) c = Math.max(c, (1 - d) * z.amt);
    }
    return c;
  };
  const zoneLight = (x, y) => {
    let best = null, bd = 1;
    for (const z of zones) {
      const d = ((x - z.cx) / z.rx) ** 2 + ((y - z.cy) / z.ry) ** 2;
      if (d < bd) { bd = d; best = z.light; }
    }
    return best;
  };

  /** Wash + strokes for one land or sky form. */
  function form(o) {
    const r = rng(o.seed);
    const p = o.path;
    const [bx0, by0, bx1, by1] = o.bbox;
    // 1 · watercolor wash: soft-edged gradient fill with a darker pooled edge
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
    // 2 · watercolor blooms: large, faint, uneven pigment patches inside the form
    ctx.save();
    ctx.clip(p);
    ctx.filter = `blur(${28 * k}px)`;
    const blooms = Math.round(((bx1 - bx0) * (by1 - by0)) / (260 * 260 * k * k));
    for (let i = 0; i < blooms; i++) {
      const x = lerp(bx0, bx1, r()), y = lerp(by0, by1, r());
      const c = o.color(x, y, 1);
      dab(ctx, x, y, (60 + r() * 140) * k, (30 + r() * 70) * k, r() * 0.6 - 0.3, mix(c, r() < 0.5 ? WARM : SHADOW, 0.25), 0.18);
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
      // pigment variation: small shifts either way, a few warm or cool accents
      const v = o.vary ?? 0.14;
      col = mix(col, r() < 0.6 ? WARM : SHADOW, r() * v * 0.6);
      if (o.accents && r() < 0.06) col = mix(col, hex(o.accents[Math.floor(r() * o.accents.length)]), 0.35);
      let alpha = lerp(o.alpha[0], o.alpha[1], r());
      const c = calm(x, y);
      if (c > 0) {
        const zl = zoneLight(x, y);
        if (zl) col = mix(col, zl, c * 0.55);
        alpha *= 1 - c * 0.45;
      }
      let ang = o.angle(x, y) + (r() - 0.5) * (o.spread ?? 0.35);
      let lk = 0.55 + r() * r() * 1.3; // mostly small marks, a few long sweeps
      if (o.grass && r() < o.grass(x, y)) { ang = -Math.PI / 2 + (r() - 0.5) * 1.6; lk *= 0.5; col = mix(col, WARM, 0.12); }
      stroke(ctx, r, x, y, ang, lerp(l0, l1, r()) * k * sz * lk, lerp(w0, w1, r()) * k * sz * (0.7 + r() * 0.5), col, alpha, o.bristles ?? 3);
    }
  }

  // shapes ------------------------------------------------------------
  const ridgeFn = (pts, amp, freq, seed) => {
    // pts: [[xf, yf], ...] in layout fractions; smooth interpolation + noise
    return (x) => {
      const xf = x / W;
      let i = 0;
      while (i < pts.length - 2 && xf > pts[i + 1][0]) i++;
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const t = clamp((xf - x0) / (x1 - x0));
      const s = t * t * (3 - 2 * t);
      return Y(lerp(y0, y1, s)) + amp * S * fbm(x * freq / W * 6, 0.5, seed, 3);
    };
  };
  const slope = (f, x) => (f(x + 4) - f(x - 4)) / 8;
  const landPath = (top, bottomY, x0 = -40, x1 = W + 40) => {
    const p = new Path2D();
    p.moveTo(x0, bottomY);
    for (let x = x0; x <= x1; x += 6) p.lineTo(x, top(x));
    p.lineTo(x1, bottomY);
    p.closePath();
    return p;
  };
  /** A rounded organic mound: dome top, shoulders spreading to the bottom. */
  const moundTop = (cxf, topf, rxf, hf, seed) => (x) => {
    const cx = X(cxf), rx = X(rxf), d = (x - cx) / rx;
    const base = Y(topf + hf);
    const n = 0.012 * S * fbm(x / W * 7, 1.7, seed, 3);
    if (Math.abs(d) <= 1) return base - Y(hf) * Math.pow(1 - d * d, 0.55) + n;
    return base + (Math.abs(d) - 1) * rx * 0.55 + n;
  };

  /** Colour of a hill at (x, y): lit crest → shaded foot, light from the upper left. */
  const hillColor = (top, stops, depth, opts = {}) => (x, y, detail) => {
    const t = clamp((y - top(x)) / (depth * S));
    let c = ramp(stops, Math.pow(t, 0.75));
    const sl = slope(top, x);
    c = mix(c, WARM, clamp(-sl * 0.9) * 0.22); // slopes facing the light
    c = mix(c, SHADOW, clamp(sl * 0.9) * 0.18); // slopes turned away
    if (t < 0.05) c = mix(c, hex("#f1e2b3"), (1 - t / 0.05) * 0.35); // sunset rim
    if (detail) c = mix(c, hex(opts.alt ?? "#8ea56a"), clamp(fbm(x / 240, y / 240, 5) * 0.8 + 0.25) * 0.3);
    if (opts.haze) c = mix(c, hex(opts.hazeCol ?? "#f3d9cc"), opts.haze);
    c = mix(c, hex("#e9c3a6"), clamp(1 - y / S) * 0.22); // sunset light reaching the first scene
    return c;
  };
  const hillAngle = (top, flat = 0.6) => (x, y) => {
    const t = clamp((y - top(x)) / (0.2 * S));
    return Math.atan(slope(top, x)) * (1 - t * flat) + fbm(x / 400, y / 400, 9) * 0.25;
  };

  // ================================================== SCENE 1 — the beginning
  // sky
  const skyStops = [[0, "#e3a5b4"], [0.18, "#eab1b6"], [0.34, "#f0c0b5"], [0.44, "#f6d0bb"], [0.5, "#fadfc6"], [0.6, "#fbe7d0"]];
  const skyPath = new Path2D();
  skyPath.rect(-40, -40, W + 80, Y(0.62) + 40);
  form({
    seed: 1, path: skyPath, bbox: [0, 0, W, Y(0.62)], edge: false, soft: 0,
    color: (x, y) => {
      let c = ramp(skyStops, y / S);
      const sd = Math.hypot((x - X(L.sun[0])) / W, (y - Y(L.sun[1])) / S * 1.6);
      c = mix(c, hex("#fff1d6"), clamp(1 - sd / 0.45) * 0.55);
      return c;
    },
    angle: (x, y) => fbm(x / 600, y / 300, 3) * 0.18, spread: 0.12,
    len: [70, 170], width: [14, 30], alpha: [0.12, 0.28], cover: 0.9, vary: 0.08, bristles: 4,
  });

  // clouds: rounded lobes, pink and lilac on top, lit gold underneath by the low sun
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
    // soft body
    ctx.save();
    ctx.filter = `blur(${10 * k}px)`;
    for (const [lx, ly, lr] of lobes) dab(ctx, lx, ly, lr * 1.25, lr, 0, hex(cl.col), 0.75);
    dab(ctx, cx, cy + ry * 0.25, rx * 1.05, ry * 0.45, 0, hex(cl.col), 0.7);
    ctx.restore();
    // strokes that wrap each lobe
    const n = (cl.strokes ?? 260) * 2.2 * (W / 2400);
    for (let j = 0; j < n; j++) {
      const [lx, ly, lr] = lobes[Math.floor(r() * lobes.length)];
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.78;
      const x = lx + Math.cos(a) * lr * 1.25 * d, y = ly + Math.sin(a) * lr * d;
      const under = clamp((y - (ly - lr)) / (2 * lr)); // 0 top … 1 underside
      let col = mix(hex(cl.top ?? "#e4a9bb"), hex(cl.col), clamp(under * 1.4));
      col = mix(col, hex("#ffe6c4"), clamp(under - 0.55) * 1.6 * (cl.glow ?? 1));
      col = mix(col, hex(cl.shade), clamp(0.35 - under) * 0.5);
      // mostly horizontal, curving a little with the lobe
      const tilt = (Math.cos(a) * -Math.sin(a)) * 0.35 + (r() - 0.5) * 0.15;
      stroke(ctx, r, x - 20 * k, y, tilt, (40 + r() * 80) * k, (9 + r() * 14) * k, col, 0.3 + r() * 0.3, 3);
    }
  }

  // sun glow low behind the hills
  {
    const g = ctx.createRadialGradient(X(L.sun[0]), Y(L.sun[1]), 0, X(L.sun[0]), Y(L.sun[1]), X(0.42));
    g.addColorStop(0, "rgba(255,244,214,0.85)");
    g.addColorStop(0.35, "rgba(255,226,190,0.35)");
    g.addColorStop(1, "rgba(255,226,190,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, Y(0.75));
  }

  // distant lavender ranges, then grey-sage — soft, hazy, little detail
  const far1 = ridgeFn(L.far1, 0.02, 1.4, 11);
  form({
    seed: 11, path: landPath(far1, Y(0.75)), bbox: [0, Y(0.4), W, Y(0.75)],
    color: hillColor(far1, [[0, "#cdb4c4"], [1, "#bba9bd"]], 0.1, { haze: 0.25, alt: "#c4b0c6" }),
    angle: hillAngle(far1, 0.9), len: [40, 90], width: [9, 16], alpha: [0.25, 0.45], cover: 1, vary: 0.06, soft: 3,
  });
  const far2 = ridgeFn(L.far2, 0.018, 1.8, 12);
  form({
    seed: 12, path: landPath(far2, Y(0.8)), bbox: [0, Y(0.44), W, Y(0.8)],
    color: hillColor(far2, [[0, "#c7c7ad"], [1, "#a9b293"]], 0.12, { haze: 0.22, alt: "#b7bda0" }),
    angle: hillAngle(far2, 0.9), len: [45, 100], width: [10, 18], alpha: [0.3, 0.5], cover: 1.1, vary: 0.08, soft: 3,
  });
  // a line of distant trees along the sage ridge
  {
    const r = rng(13);
    for (let i = 0; i < 70 * (W / 2400); i++) {
      const x = r() * W;
      if (r() < 0.5) continue;
      const y = far2(x) + 4 * k;
      const s = (5 + r() * 9) * k;
      dab(ctx, x, y - s * 0.6, s * 0.7, s, 0, mix(hex("#8e9a7e"), hex("#f3d9cc"), 0.3), 0.6);
    }
  }

  // middle rolling hills: two overlapping domes
  const midL = moundTop(L.midL[0], L.midL[1], L.midL[2], 0.07, 21);
  const midR = moundTop(L.midR[0], L.midR[1], L.midR[2], 0.06, 22);
  for (const [i, top] of [midR, midL].entries()) {
    form({
      seed: 21 + i, path: landPath(top, Y(1.0)), bbox: [0, Y(0.45), W, Y(1.0)],
      color: hillColor(top, [[0, "#b9c58f"], [0.5, "#a3b47c"], [1, "#8ea26c"]], 0.22, { haze: 0.1, alt: "#9cb07a" }),
      angle: hillAngle(top), len: [55, 120], width: [11, 20], alpha: [0.35, 0.6], cover: 1.15, vary: 0.12,
    });
    // hedgerow shadow along the crest
    ctx.save();
    ctx.filter = `blur(${5 * k}px)`;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 10) ctx.lineTo(x, top(x) + 14 * k);
    ctx.strokeStyle = rgba(hex("#6f8460"), 0.25);
    ctx.lineWidth = 10 * k;
    ctx.stroke();
    ctx.restore();
  }

  // small trees on the middle hills
  function tree(x, y, s, seed, lit = 1) {
    const r = rng(seed);
    stroke(ctx, r, x, y, -Math.PI / 2 + (r() - 0.5) * 0.1, s * 0.9, s * 0.16, hex("#6b5a46"), 0.85, 2);
    const blobs = [[0, -1.2, 0.75], [-0.45, -0.95, 0.55], [0.45, -1.0, 0.6], [0.1, -1.6, 0.5]];
    for (let j = 0; j < 90; j++) {
      const [bx, by, br] = blobs[j % blobs.length];
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * br;
      const px = x + (bx + Math.cos(a) * d) * s, py = y + (by + Math.sin(a) * d) * s;
      const light = clamp(0.5 - (px - x) / (s * 2) - (py - (y - s * 1.2)) / (s * 2));
      const col = mix(ramp([[0, "#3f5a3c"], [0.5, "#5f7d4f"], [1, "#9cb36b"]], light), WARM, light * 0.15 * lit);
      stroke(ctx, r, px, py, r() * Math.PI * 2, s * (0.18 + r() * 0.16), s * (0.1 + r() * 0.08), col, 0.75, 2);
    }
  };
  for (const [i, t] of L.midTrees.entries()) {
    const top = t[0] < 0.5 ? midL : midR;
    tree(X(t[0]), top(X(t[0])) + 6 * k, t[1] * W, 300 + i);
  }

  // ================================================== the ground, top to bottom
  // Overlapping rounded hills of different widths, each nearer (lower) one in
  // front of the last. Every hill is lit on its crest by the low sun and sinks
  // into shade at its foot, just before the next crest covers it: that value
  // step at each overlap is what gives the painting its depth.
  const PALETTES = {
    sage: [[0, "#c4cc93"], [0.3, "#a7b97c"], [0.7, "#7f9a62"], [1, "#5b7853"]],
    moss: [[0, "#c9ca86"], [0.3, "#adb872"], [0.7, "#86985a"], [1, "#5d744d"]],
    cool: [[0, "#bac895"], [0.32, "#98af7e"], [0.7, "#728d66"], [1, "#526d58"]],
  };
  const tops = {};
  for (const [i, m] of L.mounds.entries()) {
    const [cxf, topf, rxf, hf, depth, pal, name] = m;
    const top = moundTop(cxf, topf, rxf, hf, 31 + i);
    if (name) tops[name] = top;
    const bottom = Y(Math.min(3.06, topf + hf + 0.95));
    form({
      seed: 31 + i, path: landPath(top, bottom), bbox: [0, Y(topf - 0.01), W, bottom],
      color: hillColor(top, PALETTES[pal], depth, { alt: pal === "cool" ? "#86a27a" : "#9bb06e" }),
      angle: hillAngle(top, 0.45), len: [60, 140], width: [14, 26], alpha: [0.7, 0.92], cover: 1.7, vary: 0.16, spread: 0.55,
      accents: ["#d9b77a", "#e7b2a2", "#6f9a8a", "#c2cf7e"],
      grass: (x, y) => clamp((y - top(x)) / (depth * S) - 0.45) * 0.22,
      size: (x, y) => 0.75 + clamp(y / H) * 0.9,
    });
  }
  // the lone tree on the first near hill, rim-lit by the sunset
  tree(X(L.loneTree[0]), tops.near(X(L.loneTree[0])) + 10 * k, L.loneTree[1] * W, 401);

  // ================================================== the path (all three scenes)
  const pathPts = L.path; // [[xf, yf, halfWidthF]]
  const pathAt = (yf) => {
    let i = 0;
    while (i < pathPts.length - 2 && yf > pathPts[i + 1][1]) i++;
    const p0 = pathPts[Math.max(0, i - 1)], p1 = pathPts[i], p2 = pathPts[i + 1], p3 = pathPts[Math.min(pathPts.length - 1, i + 2)];
    const t = clamp((yf - p1[1]) / (p2[1] - p1[1]));
    const cr = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
    return [cr(p0[0], p1[0], p2[0], p3[0]), lerp(p1[2], p2[2], t)];
  };
  const pathShape = (yf0, yf1) => {
    const p = new Path2D();
    const L1 = [], R1 = [];
    for (let yf = yf0; yf <= yf1 + 1e-6; yf += 0.004) {
      const [xf, hw] = pathAt(yf);
      const wob = 0.004 * fbm(yf * 30, 2, 41);
      L1.push([X(xf - hw + wob), Y(yf)]);
      R1.push([X(xf + hw + wob * 0.6), Y(yf)]);
    }
    p.moveTo(L1[0][0], L1[0][1]);
    for (const q of L1) p.lineTo(q[0], q[1]);
    for (let i = R1.length - 1; i >= 0; i--) p.lineTo(R1[i][0], R1[i][1]);
    p.closePath();
    return p;
  };
  const paintPath = (yf0, yf1, seed) => {
    const p = pathShape(yf0, yf1);
    // the path takes the light and shade of the hills it crosses
    const ground = ctx.getImageData(0, 0, W, H).data;
    const shadeAt = (x, y) => {
      const i = ((Math.round(clamp(y, 0, H - 1)) * W) + Math.round(clamp(x, 0, W - 1))) * 4;
      return (ground[i] * 0.3 + ground[i + 1] * 0.59 + ground[i + 2] * 0.11) / 255;
    };
    const sideX = (y, side) => { const [xf, hw] = pathAt(y / S); return X(xf + side * hw * 1.6); };
    form({
      seed, path: p, bbox: [0, Y(yf0), W, Y(yf1)], soft: 2,
      color: (x, y) => {
        const [xf, hw] = pathAt(y / S);
        const across = clamp((x / W - (xf - hw)) / (2 * hw)); // 0 left edge … 1 right edge
        let c = ramp([[0, "#e2c9a0"], [0.45, "#f3e4c6"], [1, "#cfb38c"]], across);
        c = mix(c, hex("#f7e6c9"), clamp(fbm(x / 200, y / 200, 7) + 0.2) * 0.3);
        const lum = (shadeAt(sideX(y, -1), y) + shadeAt(sideX(y, 1), y)) / 2;
        return mix(c, hex("#8d7a5e"), clamp((0.62 - lum) * 1.6) * 0.6);
      },
      angle: (x, y) => {
        const a = pathAt(y / S - 0.01)[0], b = pathAt(y / S + 0.01)[0];
        return Math.atan2(Y(0.02), X(b - a)) + Math.PI / 2 + (fbm(x / 100, y / 100, 3) * 0.3);
      },
      len: [30, 70], width: [8, 16], alpha: [0.35, 0.6], cover: 1.4, vary: 0.1, spread: 0.6,
      size: (x, y) => 0.6 + (y / S) * 0.45,
    });
    // grass creeping over the path edges
    const r = rng(seed + 1);
    for (let yf = yf0; yf < yf1; yf += 0.0025) {
      const [xf, hw] = pathAt(yf);
      for (const side of [-1, 1]) {
        if (r() < 0.4) continue;
        const x = X(xf + side * hw * (0.9 + r() * 0.2)), y = Y(yf);
        stroke(ctx, r, x, y, -Math.PI / 2 + side * 0.3 + (r() - 0.5) * 0.5, (14 + r() * 22) * k * (0.5 + yf * 0.4), (4 + r() * 4) * k, mix(hex("#7f9a5f"), WARM, r() * 0.2), 0.55, 1);
      }
    }
  };

  paintPath(L.path[0][1], 3.0, 51);

  // a light wet-into-wet pass: softens the marks into each other without losing them
  {
    const copy = createCanvas(W, H);
    copy.getContext("2d").drawImage(cv, 0, 0);
    ctx.save();
    ctx.filter = `blur(${2.2 * k}px)`;
    ctx.globalAlpha = 0.45;
    ctx.drawImage(copy, 0, 0);
    ctx.restore();
  }

  // flowering shrub — the focal point of scene 2
  const shrub = (x, y, s, seed, bloom = [[0, "#c97a7c"], [0.5, "#e9a9aa"], [1, "#fbe2d8"]], blooms = 120) => {
    const r = rng(seed);
    // cast shadow on the grass
    ctx.save();
    ctx.filter = `blur(${12 * k}px)`;
    dab(ctx, x + s * 0.35, y + s * 0.15, s * 1.1, s * 0.28, 0, SHADOW, 0.35);
    ctx.restore();
    for (let j = 0; j < 260; j++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const px = x + Math.cos(a) * s * d, py = y - s * 0.55 + Math.sin(a) * s * 0.6 * d;
      const light = clamp(0.55 - (px - x) / (s * 1.6) - (py - (y - s * 0.55)) / (s * 1.4));
      const col = mix(ramp([[0, "#3e5a3b"], [0.5, "#5f7d4f"], [1, "#a3b872"]], light), WARM, light * 0.12);
      stroke(ctx, r, px, py, r() * Math.PI * 2, s * (0.12 + r() * 0.12), s * (0.06 + r() * 0.05), col, 0.8, 2);
    }
    for (let j = 0; j < blooms; j++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const px = x + Math.cos(a) * s * d * 0.95, py = y - s * 0.6 + Math.sin(a) * s * 0.55 * d;
      const light = clamp(0.6 - (px - x) / (s * 1.6) - (py - (y - s * 0.6)) / (s * 1.2));
      const col = mix(ramp(bloom, light), WARM, light * 0.2);
      const br = s * (0.035 + r() * 0.03);
      dab(ctx, px + br * 0.3, py + br * 0.35, br, br * 0.8, 0, mix(col, SHADOW, 0.35), 0.5);
      for (let q = 0; q < 3; q++) stroke(ctx, r, px - br * 0.6, py + (q - 1) * br * 0.45, (r() - 0.5) * 0.8, br * 1.5, br * 0.75, mix(col, q === 0 ? WARM : col, 0.3), 0.9, 0);
    }
  };

  // ---- flowers
  const daisy = (x, y, rr, r, tint = "#fbf6ec") => {
    const petals = 9 + Math.floor(r() * 4);
    const rot = r() * Math.PI;
    dab(ctx, x + rr * 0.25, y + rr * 0.3, rr * 1.05, rr * 0.7, 0, SHADOW, 0.2);
    for (let i = 0; i < petals; i++) {
      const a = rot + (i / petals) * Math.PI * 2;
      const col = mix(hex(tint), hex("#f2c9c4"), r() * 0.35);
      stroke(ctx, r, x, y, a, rr * (0.85 + r() * 0.3), rr * 0.42, col, 0.92, 1);
    }
    dab(ctx, x, y, rr * 0.34, rr * 0.3, 0, hex("#d99a3e"), 1);
    dab(ctx, x - rr * 0.1, y - rr * 0.1, rr * 0.16, rr * 0.13, 0, hex("#f6d27c"), 0.9);
  };
  const cosmos = (x, y, rr, r) => {
    const base = ramp([[0, "#d9827f"], [0.5, "#eba3a6"], [1, "#f6c7c3"]], r());
    dab(ctx, x + rr * 0.25, y + rr * 0.3, rr * 1.1, rr * 0.75, 0, SHADOW, 0.18);
    const rot = r() * Math.PI;
    for (let i = 0; i < 8; i++) {
      const a = rot + (i / 8) * Math.PI * 2;
      stroke(ctx, r, x, y, a, rr * 0.95, rr * 0.62, mix(base, WARM, r() * 0.25), 0.9, 2);
    }
    dab(ctx, x, y, rr * 0.22, rr * 0.2, 0, hex("#e3b04f"), 1);
  };
  const spike = (x, y, h, r) => {
    stroke(ctx, r, x, y, -Math.PI / 2, h, h * 0.05, hex("#6f8a5a"), 0.8, 1);
    for (let i = 0; i < 9; i++) {
      const t = 0.45 + (i / 9) * 0.55;
      const col = mix(hex("#9d8bc0"), hex("#d4c4e6"), r() * 0.6);
      dab(ctx, x + (r() - 0.5) * h * 0.06, y - h * t, h * 0.05 * (1.1 - t * 0.5), h * 0.035, 0, col, 0.9);
    }
  };
  const tinyFlower = (x, y, rr, r) => {
    const col = [hex("#fbf3ea"), hex("#f2b8a0"), hex("#e9afab"), hex("#e3bf73"), hex("#d4c4e6")][Math.floor(r() * 5)];
    dab(ctx, x, y, rr, rr * 0.8, r(), col, 0.9);
    dab(ctx, x - rr * 0.3, y - rr * 0.3, rr * 0.4, rr * 0.35, 0, WARM, 0.5);
  };
  /** A deliberate cluster: gaussian spread, bigger flowers in the middle and toward the viewer. */
  const cluster = (cl) => {
    const r = rng(cl.seed);
    const items = [];
    for (let i = 0; i < cl.n; i++) {
      const g = () => (r() + r() + r() - 1.5) / 1.5;
      const x = X(cl.x) + g() * X(cl.rx), y = Y(cl.y) + g() * Y(cl.ry);
      items.push([x, y]);
    }
    items.sort((a, b) => a[1] - b[1]);
    if (cl.foliage) {
      // leaves first: a darker, shadowed bed the blossoms sit in
      for (let i = 0; i < cl.n * 2.5; i++) {
        const g = () => (r() + r() + r() - 1.5) / 1.5;
        const x = X(cl.x) + g() * X(cl.rx) * 1.1, y = Y(cl.y) + g() * Y(cl.ry) * 1.1;
        const light = r();
        const col = mix(ramp([[0, "#3c5639"], [0.6, "#5d7a4c"], [1, "#93ac68"]], light), WARM, light * 0.1);
        stroke(ctx, r, x, y, -Math.PI / 2 + (r() - 0.5) * 2.2, (cl.size[1] * 2.4) * k * (0.6 + r() * 0.6), cl.size[1] * 0.75 * k, col, 0.8, 2);
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
  };

  shrub(X(L.shrub[0]), tops.shrubHill(X(L.shrub[0])) + Y(0.03), L.shrub[1] * W, 501);
  for (const cl of L.clusters2) cluster(cl);
  for (const cl of L.clusters1) cluster(cl);

  // warm light pouring through the arch: the destination
  {
    const [ax, ay] = L.glow;
    const g = ctx.createRadialGradient(X(ax), Y(ay), 0, X(ax), Y(ay), X(L.archSpan * 2.4));
    g.addColorStop(0, "rgba(255,246,222,0.95)");
    g.addColorStop(0.4, "rgba(255,232,196,0.55)");
    g.addColorStop(1, "rgba(255,232,196,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, Y(2.1), W, Y(0.9));
  }

  // flowering bushes flanking the way in, lavender along the path, then the beds
  for (const [i, b] of L.bushes.entries()) shrub(X(b[0]), Y(b[1]), b[2] * W, 520 + i, b[3] === "white" ? [[0, "#c9b9a6"], [0.5, "#efe6d8"], [1, "#fffaf0"]] : undefined, 200);
  {
    const r = rng(531);
    for (let yf = 2.3; yf < 2.92; yf += 0.006) {
      const [xf, hw] = pathAt(yf);
      for (const side of [-1, 1]) {
        if (r() < 0.35) continue;
        const x = X(xf + side * (hw + 0.012 + r() * 0.02)), y = Y(yf);
        spike(x, y, (30 + (yf - 2.3) * 80 + r() * 20) * k, r);
      }
    }
  }
  for (const cl of L.clusters3) cluster(cl);

  // the rose arch
  {
    const r = rng(601);
    const cx = X(0.5), span = X(L.archSpan), topY = Y(L.archTop), feet = Y(L.archFeet);
    const postW = Math.min(0.12 * span, 38 * k);
    for (const side of [-1, 1]) {
      const px = cx + side * span;
      for (let j = 0; j < 30; j++) {
        const y = lerp(topY + span * 0.5, feet, r());
        const col = mix(hex("#7a5f48"), side < 0 ? WARM : SHADOW, 0.15 + r() * 0.15);
        stroke(ctx, r, px + (r() - 0.5) * postW * 0.6, y, Math.PI / 2 + (r() - 0.5) * 0.05, postW * 3, postW * 0.5, col, 0.85, 2);
      }
    }
    // the bow of the arch
    for (let j = 0; j < 140; j++) {
      const t = r();
      const a = Math.PI + t * Math.PI;
      const x = cx + Math.cos(a) * span, y = topY + span * 0.5 + Math.sin(a) * span * 0.55;
      const tang = a + Math.PI / 2;
      stroke(ctx, r, x, y, tang, postW * 1.6, postW * 0.55, mix(hex("#7a5f48"), WARM, t < 0.5 ? 0.25 : 0.05), 0.85, 2);
    }
    // climbing roses: foliage then blooms along the posts and the bow
    const along = [];
    for (let j = 0; j < 160; j++) {
      const t = r();
      if (t < 0.3) along.push([cx - span + (r() - 0.5) * postW * 3, lerp(topY + span * 0.5, feet - span * 0.2, r())]);
      else if (t < 0.6) along.push([cx + span + (r() - 0.5) * postW * 3, lerp(topY + span * 0.5, feet - span * 0.2, r())]);
      else {
        const a = Math.PI + r() * Math.PI;
        along.push([cx + Math.cos(a) * span + (r() - 0.5) * postW * 2.5, topY + span * 0.5 + Math.sin(a) * span * 0.55 + (r() - 0.5) * postW * 2]);
      }
    }
    for (const [x, y] of along) {
      const light = clamp(0.5 - (x - cx) / (span * 3));
      const col = mix(ramp([[0, "#3e5a3b"], [0.6, "#5f7d4f"], [1, "#94ad69"]], light), WARM, 0.08);
      for (let q = 0; q < 3; q++) stroke(ctx, r, x + (r() - 0.5) * postW * 2, y + (r() - 0.5) * postW * 2, r() * 6.28, postW * (0.9 + r()), postW * 0.55, col, 0.85, 1);
    }
    for (const [x, y] of along) {
      if (r() < 0.45) continue;
      const rr = postW * (0.45 + r() * 0.35);
      const base = [hex("#e9a9aa"), hex("#d47a78"), hex("#fbe6dc"), hex("#f2b8a0")][Math.floor(r() * 4)];
      dab(ctx, x + rr * 0.3, y + rr * 0.3, rr, rr * 0.8, 0, SHADOW, 0.2);
      dab(ctx, x, y, rr, rr * 0.9, r(), base, 0.95);
      dab(ctx, x - rr * 0.2, y - rr * 0.25, rr * 0.5, rr * 0.4, 0, mix(base, WARM, 0.5), 0.8);
      stroke(ctx, r, x - rr * 0.5, y, -0.3, rr, rr * 0.25, mix(base, SHADOW, 0.3), 0.5, 0);
    }
  }

  // foreground framing: tall grass and large flowers in the bottom corners
  for (const fg of L.foreground) {
    const r = rng(fg.seed);
    const x0 = X(fg.x[0]), x1 = X(fg.x[1]);
    ctx.save();
    ctx.filter = `blur(${30 * k}px)`;
    dab(ctx, (x0 + x1) / 2, Y(3), (x1 - x0) * 0.7, Y(0.12), 0, SHADOW, 0.45);
    ctx.restore();
    for (let j = 0; j < fg.blades * (W / 2400); j++) {
      const x = lerp(x0, x1, r());
      const y = Y(fg.y) + r() * Y(3 - fg.y);
      const h = (120 + r() * 260) * k;
      const col = mix(ramp([[0, "#4d6a44"], [0.6, "#6f8f5a"], [1, "#a7bd78"]], r()), WARM, r() * 0.12);
      stroke(ctx, r, x, y, -Math.PI / 2 + (r() - 0.5) * 0.7, h, (9 + r() * 12) * k, col, 0.82, 2);
    }
    cluster({ seed: fg.seed + 1, x: (fg.x[0] + fg.x[1]) / 2, y: fg.y + 0.07, rx: (fg.x[1] - fg.x[0]) / 2.4, ry: 0.06, n: fg.flowers, size: [16, 30], kinds: ["daisy", "daisy", "cosmos", "spike"], stems: true });
  }

  // ================================================== unifying light and surface
  // warm sunset light from the upper left across the whole painting (no per-scene vignette: no seams)
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  const lg = ctx.createLinearGradient(0, 0, W, H * 0.35);
  lg.addColorStop(0, "rgba(255,214,170,0.45)");
  lg.addColorStop(1, "rgba(255,214,170,0)");
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, W, H);
  // soft darkening at the side edges, constant down the length
  const sg = ctx.createLinearGradient(0, 0, W, 0);
  sg.addColorStop(0, "rgba(40,50,35,0.35)");
  sg.addColorStop(0.12, "rgba(40,50,35,0)");
  sg.addColorStop(0.88, "rgba(40,50,35,0)");
  sg.addColorStop(1, "rgba(40,50,35,0.35)");
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // canvas weave + pigment grain
  const tile = createCanvas(160, 160);
  const tc = tile.getContext("2d");
  const id = tc.createImageData(160, 160);
  const tr = rng(999);
  for (let y = 0; y < 160; y++)
    for (let x = 0; x < 160; x++) {
      const weave = Math.sin((x * Math.PI) / 2.5) * Math.sin((y * Math.PI) / 2.5) * 22;
      const v = 128 + weave + (tr() - 0.5) * 46 + vnoise(x / 9, y / 9, 3) * 18;
      const i = (y * 160 + x) * 4;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = clamp(v, 0, 255);
      id.data[i + 3] = 255;
    }
  tc.putImageData(id, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = ctx.createPattern(tile, "repeat");
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  return cv;
}

// ---------------------------------------------------------------- layouts

// Desktop: 2400 × 1800 per scene (4:3). Mobile/portrait: 1080 × 2340 per scene.
// Coordinates are fractions: x of the width, y of ONE scene's height (0–3 down the whole painting).
const DESKTOP = {
  name: "desktop", W: 2400, S: 1800, k: 1,
  layout: {
    sun: [0.66, 0.5],
    clouds: [
      { x: 0.17, y: 0.27, rx: 0.2, ry: 0.07, col: "#efb5b8", shade: "#d98f9a", strokes: 320 },
      { x: 0.83, y: 0.15, rx: 0.22, ry: 0.1, col: "#f1bdb8", shade: "#d9929d", strokes: 460 },
      { x: 0.62, y: 0.33, rx: 0.16, ry: 0.025, col: "#f6c9b4", shade: "#e8a69a" },
      { x: 0.12, y: 0.4, rx: 0.14, ry: 0.02, col: "#f7d3bf", shade: "#eab0a4", strokes: 140 },
      { x: 0.86, y: 0.42, rx: 0.12, ry: 0.018, col: "#f9dcc4", shade: "#eab0a4", strokes: 120, glow: 1.4 },
    ],
    far1: [[0, 0.5], [0.22, 0.47], [0.45, 0.495], [0.7, 0.465], [1, 0.49]],
    far2: [[0, 0.54], [0.3, 0.52], [0.55, 0.545], [0.8, 0.525], [1, 0.54]],
    midL: [0.2, 0.55, 0.42],
    midR: [0.8, 0.585, 0.4],
    midTrees: [[0.33, 0.012], [0.36, 0.009], [0.7, 0.011], [0.88, 0.013], [0.91, 0.009]],
    // [centre x, crest y, half-width, height, shade depth, palette, name]
    mounds: [
      [0.3, 0.64, 0.55, 0.11, 0.2, "sage", "near"],
      [0.95, 0.74, 0.3, 0.1, 0.18, "moss"],
      [0.08, 0.93, 0.4, 0.12, 0.22, "moss"],
      [0.7, 1.0, 0.38, 0.13, 0.26, "cool"],
      [0.32, 1.3, 0.3, 0.12, 0.24, "sage"],
      [0.9, 1.28, 0.26, 0.14, 0.28, "moss", "shrubHill"],
      [0.06, 1.58, 0.34, 0.14, 0.3, "sage"],
      [0.6, 1.66, 0.36, 0.13, 0.28, "cool"],
      [0.22, 1.9, 0.38, 0.12, 0.26, "moss"],
      [0.85, 1.93, 0.34, 0.13, 0.26, "sage"],
      [0.5, 2.2, 0.95, 0.05, 0.6, "moss"],
    ],
    loneTree: [0.14, 0.045],
    path: [[0.6, 0.72, 0.002], [0.58, 0.82, 0.012], [0.56, 0.97, 0.024], [0.6, 1.15, 0.034], [0.55, 1.35, 0.044], [0.5, 1.55, 0.055], [0.6, 1.75, 0.065], [0.53, 1.98, 0.075], [0.5, 2.2, 0.085], [0.5, 2.5, 0.1], [0.5, 2.8, 0.13], [0.5, 3.05, 0.17]],
    shrub: [0.84, 0.075],
    clusters1: [
      { seed: 701, x: 0.26, y: 0.84, rx: 0.08, ry: 0.025, n: 40, size: [3, 6], kinds: ["daisy", "tiny"] },
      { seed: 702, x: 0.84, y: 0.9, rx: 0.09, ry: 0.03, n: 50, size: [3, 7], kinds: ["daisy", "tiny", "tiny"] },
      { seed: 703, x: 0.55, y: 0.98, rx: 0.12, ry: 0.02, n: 70, size: [2, 4], kinds: ["tiny"] },
    ],
    bushes: [[0.3, 2.62, 0.06, "pink"], [0.71, 2.6, 0.065, "white"], [0.07, 2.3, 0.07, "pink"], [0.95, 2.28, 0.06, "white"]],
    clusters2: [
      { seed: 711, x: 0.66, y: 1.6, rx: 0.06, ry: 0.035, n: 40, size: [6, 11], kinds: ["cosmos", "cosmos", "daisy", "tiny"], foliage: true },
      { seed: 712, x: 0.22, y: 1.86, rx: 0.12, ry: 0.06, n: 70, size: [8, 15], kinds: ["daisy", "daisy", "daisy", "tiny"], foliage: true },
      { seed: 713, x: 0.9, y: 1.62, rx: 0.06, ry: 0.05, n: 28, size: [8, 14], kinds: ["spike", "daisy", "tiny"] },
      { seed: 714, x: 0.42, y: 1.45, rx: 0.12, ry: 0.025, n: 90, size: [2.5, 5], kinds: ["tiny"] },
      { seed: 715, x: 0.75, y: 1.82, rx: 0.1, ry: 0.03, n: 70, size: [3, 6], kinds: ["tiny", "daisy"] },
    ],
    clusters3: [
      { seed: 721, x: 0.17, y: 2.5, rx: 0.16, ry: 0.13, n: 200, size: [10, 22], kinds: ["daisy", "cosmos", "spike", "daisy", "tiny"], stems: true, foliage: true },
      { seed: 722, x: 0.83, y: 2.5, rx: 0.16, ry: 0.13, n: 200, size: [10, 22], kinds: ["daisy", "cosmos", "spike", "cosmos", "tiny"], stems: true, foliage: true },
      { seed: 723, x: 0.36, y: 2.33, rx: 0.06, ry: 0.04, n: 30, size: [7, 12], kinds: ["cosmos", "tiny"] },
      { seed: 724, x: 0.65, y: 2.34, rx: 0.06, ry: 0.04, n: 30, size: [7, 12], kinds: ["daisy", "tiny"] },
    ],
    glow: [0.5, 2.62],
    archSpan: 0.13,
    archTop: 2.36,
    archFeet: 2.86,
    foreground: [
      { seed: 801, x: [-0.02, 0.26], y: 2.82, blades: 260, flowers: 22 },
      { seed: 802, x: [0.74, 1.02], y: 2.82, blades: 260, flowers: 22 },
    ],
    zones: [
      { x: 0.5, y: 0.15, rx: 0.36, ry: 0.11, light: "#f8dccb", amt: 0.8 }, // title
      { x: 0.27, y: 1.2, rx: 0.27, ry: 0.15, light: "#d9e0b4", amt: 0.85 }, // thoughts
      { x: 0.5, y: 2.09, rx: 0.32, ry: 0.07, light: "#d6dfae", amt: 0.8 }, // invitation
    ],
  },
};

const MOBILE = {
  name: "mobile", W: 1080, S: 2340, k: 0.75,
  layout: {
    ...DESKTOP.layout,
    sun: [0.62, 0.48],
    clouds: [
      { x: 0.15, y: 0.3, rx: 0.3, ry: 0.035, col: "#efb5b8", shade: "#d98f9a", strokes: 220 },
      { x: 0.85, y: 0.08, rx: 0.32, ry: 0.05, col: "#f1bdb8", shade: "#d9929d", strokes: 260 },
      { x: 0.6, y: 0.36, rx: 0.25, ry: 0.016, col: "#f6c9b4", shade: "#e8a69a", strokes: 140 },
    ],
    far1: [[0, 0.49], [0.4, 0.47], [0.7, 0.485], [1, 0.47]],
    far2: [[0, 0.525], [0.5, 0.515], [1, 0.53]],
    midL: [0.15, 0.555, 0.55],
    midR: [0.9, 0.58, 0.5],
    midTrees: [[0.3, 0.025], [0.78, 0.022]],
    mounds: [
      [0.3, 0.65, 0.75, 0.09, 0.2, "sage", "near"],
      [1.0, 0.75, 0.45, 0.08, 0.18, "moss"],
      [0.0, 0.93, 0.55, 0.1, 0.22, "moss"],
      [0.9, 1.02, 0.55, 0.1, 0.26, "cool"],
      [0.2, 1.32, 0.5, 0.09, 0.24, "sage"],
      [1.0, 1.32, 0.4, 0.11, 0.28, "moss", "shrubHill"],
      [0.0, 1.6, 0.5, 0.11, 0.3, "sage"],
      [0.75, 1.68, 0.55, 0.1, 0.28, "cool"],
      [0.12, 1.9, 0.55, 0.09, 0.26, "moss"],
      [0.95, 1.94, 0.5, 0.1, 0.26, "sage"],
      [0.5, 2.2, 1.2, 0.04, 0.6, "moss"],
    ],
    loneTree: [0.16, 0.085],
    path: [[0.62, 0.72, 0.004], [0.6, 0.82, 0.016], [0.5, 0.97, 0.028], [0.4, 1.15, 0.038], [0.42, 1.35, 0.048], [0.58, 1.55, 0.058], [0.62, 1.75, 0.066], [0.54, 1.98, 0.074], [0.5, 2.2, 0.085], [0.5, 2.5, 0.1], [0.5, 2.8, 0.14], [0.5, 3.05, 0.2]],
    shrub: [0.86, 0.15],
    clusters1: [
      { seed: 701, x: 0.25, y: 0.86, rx: 0.12, ry: 0.02, n: 18, size: [4, 7], kinds: ["daisy", "tiny"] },
      { seed: 702, x: 0.82, y: 0.92, rx: 0.12, ry: 0.025, n: 18, size: [4, 7], kinds: ["daisy", "tiny"] },
    ],
    clusters2: [
      { seed: 711, x: 0.74, y: 1.62, rx: 0.12, ry: 0.03, n: 30, size: [8, 13], kinds: ["cosmos", "cosmos", "daisy", "tiny"], foliage: true },
      { seed: 712, x: 0.2, y: 1.84, rx: 0.2, ry: 0.05, n: 45, size: [10, 17], kinds: ["daisy", "daisy", "tiny"] },
    ],
    clusters3: [
      { seed: 721, x: 0.12, y: 2.5, rx: 0.16, ry: 0.11, n: 70, size: [12, 22], kinds: ["daisy", "cosmos", "spike", "tiny"], stems: true, foliage: true },
      { seed: 722, x: 0.88, y: 2.5, rx: 0.16, ry: 0.11, n: 70, size: [12, 22], kinds: ["daisy", "cosmos", "spike", "tiny"], stems: true, foliage: true },
    ],
    bushes: [[0.1, 2.3, 0.14, "pink"], [0.92, 2.28, 0.13, "white"]],
    archSpan: 0.24,
    archTop: 2.38,
    archFeet: 2.86,
    foreground: [
      { seed: 801, x: [-0.05, 0.3], y: 2.85, blades: 160, flowers: 10 },
      { seed: 802, x: [0.7, 1.05], y: 2.85, blades: 160, flowers: 10 },
    ],
    zones: [
      { x: 0.5, y: 0.15, rx: 0.5, ry: 0.09, light: "#f8dccb", amt: 0.8 },
      { x: 0.5, y: 1.17, rx: 0.5, ry: 0.13, light: "#d9e0b4", amt: 0.85 },
      { x: 0.5, y: 2.1, rx: 0.5, ry: 0.07, light: "#d6dfae", amt: 0.8 },
    ],
  },
};

// ---------------------------------------------------------------- output

fs.mkdirSync(PREVIEW ? PREVIEW_DIR : OUT, { recursive: true });
for (const F of [DESKTOP, MOBILE]) {
  if (ONLY && ONLY !== F.name) continue;
  const t0 = Date.now();
  const cv = paint(F);
  const scenes = [1, 2, 3];
  if (PREVIEW) {
    const w = Math.round(F.W / 3), h = Math.round(F.S * 3 / 3);
    const pv = createCanvas(w, h);
    pv.getContext("2d").drawImage(cv, 0, 0, w, h);
    fs.writeFileSync(path.join(PREVIEW_DIR, `preview-${F.name}.jpg`), pv.toBuffer("image/jpeg", 85));
  } else {
    const widths = F.name === "desktop" ? [2400, 1600] : [1080, 720];
    for (const s of scenes) {
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
