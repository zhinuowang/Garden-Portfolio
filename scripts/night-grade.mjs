// Night versions of the painted garden, for the lamppost's day-to-night change.
// Each night image is the very same painting, colour-graded into moonlight
// (pinks to lavender-blue, greens to teal dusk, the sky a little deeper than the
// ground), so the page only cross-fades two prepared pictures: no live filters
// or blend modes during the transition. Decorative artwork only.
//
//   node scripts/night-grade.mjs   → *-night.webp beside each source image

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const clamp = (v) => Math.max(0, Math.min(255, v));

/** Moonlight: a colour matrix plus a vertical factor (sky darker), and an overall depth. */
function grade(data, w, h, ch, { sky = 0.2, skyTo = 0.55, depth = 1 }) {
  for (let y = 0; y < h; y++) {
    const f = depth * (1 - sky + sky * Math.min(1, y / (skyTo * h)));
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      data[i] = clamp((0.38 * r + 0.05 * g + 8) * f);
      data[i + 1] = clamp((0.46 * g + 0.03 * r + 14) * f);
      data[i + 2] = clamp((0.62 * b + 0.12 * g + 36) * f);
    }
  }
}

async function night(file, opts) {
  const out = file.replace(/\.webp$/, "-night.webp");
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  grade(data, info.width, info.height, info.channels, opts);
  await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } }).webp({ quality: 86 }).toFile(out);
  console.log(path.relative(process.cwd(), out));
}

const pub = path.resolve("public/assets/garden");
for (const s of [1, 2, 3]) {
  for (const [fmt, widths] of [["desktop", [2400, 1600]], ["mobile", [1080, 720]]]) {
    for (const w of widths) await night(`${pub}/landing/scene-${s}-${fmt}-${w}.webp`, s === 1 ? { sky: 0.22, skyTo: 0.5 } : { sky: 0, depth: 0.95 });
  }
}
for (const f of ["garden-desktop-2000", "garden-desktop-3000", "garden-mobile-720", "garden-mobile-1080"]) await night(`${pub}/work/${f}.webp`, { sky: 0.2, skyTo: 0.45 });
for (const f of ["journal-desktop", "journal-mobile"]) await night(`${pub}/journal/${f}.webp`, { sky: 0, depth: 0.56 });
fs.existsSync(pub);
