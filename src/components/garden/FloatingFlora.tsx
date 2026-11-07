"use client";

import { useEffect, useRef } from "react";

// The foreground layer of the inner pages: painted blossoms (scripts/paint-landing.mjs --loose, after
// Zhinuo's oil-painting references — lilies, hibiscus, daisies, daffodils, lavender roses, peonies) floating
// between the viewer and the page. Heads and petals only, never stems.
//
// Three depths: the painted backdrop is fixed, the content scrolls normally, and this layer — fixed to the
// window, above the content, never taking pointer events — moves FASTER than the content as you scroll.
//
// The flowers come in small composed clusters (a large bloom with one or two smaller ones overlapping it, a
// few drifting petals), placed down each side of the page at uneven intervals, so the margins feel gently
// full without being crowded. A cluster drifts as one; its members differ
// only very slightly in depth (a few pixels at most) and sway gently on their own, so the group — and its
// overlaps — hold together. Clusters enter
// from the window's edges, partly cropped, and their reach is capped by the content column so they never
// cover the text. Smaller and fewer on tablets and phones; still with reduced motion.

type Kind = "loose-daisy" | "loose-daisy-half" | "loose-peony" | "loose-peony-red" | "loose-poppy" | "loose-petals" | "lily" | "hibiscus" | "daffodil" | "rose-lavender";
// a member of a cluster, drawn for a cluster entering from the LEFT (its box's right edge faces the content);
// listed back to front; dz is how much nearer than the cluster it sits (a touch faster when scrolling)
type Member = { kind: Kind; x: number; y: number; size: number; rot: number; dz?: number };
type Cluster = { w: number; h: number; members: Member[] };

// Positions are computed from each painting's measured extent (the paint fills only the middle of its canvas), so
// neighbouring blossoms genuinely overlap — roughly 15–30% of the smaller one, varied by cluster — with a
// clear front and back: the dominant bloom in front, supporting ones tucked behind, loose petals on top.
const CLUSTERS: Record<string, Cluster> = {
  // the two corner bouquets that frame the window (see FRAMES below): fuller, four or five blooms each
  bouquetLowerLeft: { w: 345, h: 332, members: [
    { kind: "lily", x: 109, y: 0, size: 220, rot: 40 },
    { kind: "hibiscus", x: 0, y: 29, size: 190, rot: -10 },
    { kind: "loose-peony-red", x: 31, y: 68, size: 250, rot: 8, dz: 0.006 },
    { kind: "loose-daisy", x: 154, y: 129, size: 175, rot: 18, dz: 0.008 },
    { kind: "loose-peony", x: 85, y: 192, size: 140, rot: -20, dz: 0.006 },
    { kind: "loose-petals", x: 245, y: 157, size: 100, rot: 30, dz: 0.01 },
  ] },
  bouquetUpperRight: { w: 327, h: 316, members: [
    { kind: "daffodil", x: 142, y: 114, size: 185, rot: 14 },
    { kind: "loose-daisy-half", x: 0, y: 108, size: 175, rot: -120 },
    { kind: "rose-lavender", x: 57, y: 0, size: 235, rot: -8, dz: 0.006 },
    { kind: "loose-peony", x: 186, y: 34, size: 135, rot: 10, dz: 0.006 },
    { kind: "loose-petals", x: 161, y: 221, size: 95, rot: 60, dz: 0.01 },
  ] },
  lilyTrio: { w: 291, h: 283, members: [
    { kind: "loose-daisy", x: 0, y: 113, size: 170, rot: 22 },
    { kind: "lily", x: 41, y: 0, size: 250, rot: -12, dz: 0.006 },
    { kind: "loose-petals", x: 177, y: 131, size: 100, rot: 40, dz: 0.01 },
  ] },
  rosePair: { w: 257, h: 267, members: [
    { kind: "loose-peony", x: 0, y: 92, size: 175, rot: 30 },
    { kind: "rose-lavender", x: 27, y: 0, size: 230, rot: -6, dz: 0.006 },
  ] },
  daffodilDaisy: { w: 283, h: 254, members: [
    { kind: "loose-daisy-half", x: 0, y: 69, size: 185, rot: -40 },
    { kind: "daffodil", x: 73, y: 0, size: 210, rot: 18, dz: 0.006 },
  ] },
  peonyDaisy: { w: 243, h: 239, members: [
    { kind: "loose-daisy", x: 93, y: 0, size: 150, rot: -14 },
    { kind: "loose-peony-red", x: 0, y: 24, size: 215, rot: 10, dz: 0.006 },
  ] },
  poppyPetal: { w: 200, h: 200, members: [
    { kind: "loose-poppy", x: 0, y: 0, size: 200, rot: -18, dz: 0.006 },
    { kind: "loose-petals", x: 93, y: 94, size: 100, rot: 10, dz: 0.008 },
  ] },
  petals: { w: 173, h: 164, members: [
    { kind: "loose-petals", x: 0, y: 0, size: 160, rot: -20, dz: 0.006 },
    { kind: "loose-petals", x: 53, y: 44, size: 120, rot: 64, dz: 0.008 },
  ] },
  hibiscusTrio: { w: 272, h: 240, members: [
    { kind: "loose-daisy", x: 0, y: 100, size: 140, rot: -18 },
    { kind: "hibiscus", x: 32, y: 0, size: 240, rot: 14, dz: 0.006 },
    { kind: "loose-petals", x: 166, y: 115, size: 90, rot: 30, dz: 0.008 },
  ] },
  lilyHalf: { w: 248, h: 278, members: [
    { kind: "loose-daisy-half", x: 88, y: 0, size: 160, rot: -60 },
    { kind: "lily", x: 0, y: 36, size: 230, rot: 52, dz: 0.006 },
    { kind: "loose-petals", x: 20, y: 182, size: 96, rot: -20, dz: 0.008 },
  ] },
  roseTrio: { w: 212, h: 244, members: [
    { kind: "loose-peony-red", x: 0, y: 0, size: 140, rot: 20 },
    { kind: "rose-lavender", x: 10, y: 7, size: 200, rot: -10, dz: 0.006 },
    { kind: "loose-daisy", x: 92, y: 124, size: 120, rot: 12, dz: 0.008 },
  ] },
  daffodilPeony: { w: 245, h: 201, members: [
    { kind: "loose-peony", x: 0, y: 51, size: 150, rot: 0 },
    { kind: "daffodil", x: 45, y: 0, size: 200, rot: -12, dz: 0.006 },
    { kind: "loose-petals", x: 147, y: 95, size: 84, rot: 50, dz: 0.01 },
  ] },
  poppyDaisy: { w: 208, h: 228, members: [
    { kind: "loose-daisy", x: 78, y: 0, size: 130, rot: 30 },
    { kind: "loose-poppy", x: 6, y: 38, size: 190, rot: 8, dz: 0.006 },
    { kind: "loose-peony", x: 0, y: 114, size: 110, rot: -10, dz: 0.008 },
  ] },
};

// the walk down a long page, one lane for each side so neither edge is left bare for long: which cluster, how
// far after the previous one on that side (in window heights — uneven, but never a long empty stretch), how
// much of it shows, and how near it is. The two lanes start out of step, so the sides alternate loosely.
type Beat = { c: keyof typeof CLUSTERS; side: "l" | "r"; gap: number; reach: number; speed: number; drift: number };
const LEFT: Omit<Beat, "side">[] = [
  { c: "lilyTrio", gap: 0.5, reach: 0.78, speed: 1.3, drift: 10 },
  { c: "roseTrio", gap: 1.05, reach: 0.78, speed: 1.36, drift: 8 },
  { c: "daffodilDaisy", gap: 0.85, reach: 0.78, speed: 1.28, drift: 10 },
  { c: "poppyDaisy", gap: 1.25, reach: 0.78, speed: 1.4, drift: 12 },
  { c: "petals", gap: 0.7, reach: 0.9, speed: 1.6, drift: 16 },
  { c: "rosePair", gap: 0.95, reach: 0.78, speed: 1.26, drift: 8 },
  { c: "lilyHalf", gap: 1.15, reach: 0.78, speed: 1.34, drift: 10 },
];
const RIGHT: Omit<Beat, "side">[] = [
  { c: "hibiscusTrio", gap: 0.95, reach: 0.78, speed: 1.36, drift: 8 },
  { c: "peonyDaisy", gap: 1.0, reach: 0.78, speed: 1.28, drift: 8 },
  { c: "petals", gap: 0.75, reach: 0.9, speed: 1.58, drift: 16 },
  { c: "daffodilPeony", gap: 1.2, reach: 0.78, speed: 1.32, drift: 10 },
  { c: "lilyHalf", gap: 0.9, reach: 0.78, speed: 1.42, drift: 12 },
  { c: "poppyPetal", gap: 1.3, reach: 0.78, speed: 1.3, drift: 10 },
  { c: "roseTrio", gap: 0.85, reach: 0.78, speed: 1.38, drift: 8 },
];

// the frame: two fuller bouquets held to the window's corners — lower left and upper right, partly cropped by
// its edges — so every view has a balanced, roughly triangular composition with the clusters drifting past
// between them. They drift only gently with scrolling (a slow sway up and down), never away.
type Frame = { c: keyof typeof CLUSTERS; side: "l" | "r"; corner: "top" | "bottom"; sink: number; reach: number; drift: number };
const FRAMES: Frame[] = [
  { c: "bouquetLowerLeft", side: "l", corner: "bottom", sink: 0.12, reach: 0.78, drift: 14 },
  { c: "bouquetUpperRight", side: "r", corner: "top", sink: 0.16, reach: 0.68, drift: 12 },
];

// a single-screen page (Contact): the frame's two bouquets plus a few drifting petals low on the right, all well
// clear of the text (at: how far down the window; scale: smaller than on long pages)
const CORNERS: (Beat & { at: number; scale: number })[] = [
  { c: "petals", side: "r", gap: 0, reach: 0.8, speed: 1.55, drift: 12, at: 0.86, scale: 0.6 },
];

export default function FloatingFlora({ variant = "long" }: { variant?: "long" | "single" }) {
  const anchor = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = anchor.current, fg = layer.current;
    if (!box || !fg) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    type Item = { el: HTMLElement; parts: { el: HTMLElement; dz: number }[]; y: number; h: number; speed: number; drift: number; side: "l" | "r"; frame?: number };
    let items: Item[] = [];

    const update = () => {
      const vh = window.innerHeight, sy = window.scrollY, calm = still.matches;
      for (const it of items) {
        if (it.frame !== undefined) {
          // a corner bouquet: fixed to its corner (it.y is its top in the window), swaying a little as you scroll
          const t = sy / 650 + it.frame * 1.7;
          const dy = calm ? 0 : Math.sin(t) * it.drift, dx = calm ? 0 : Math.sin(t * 0.7) * it.drift * 0.4 * (it.side === "l" ? 1 : -1);
          it.el.style.visibility = "visible";
          it.el.style.transform = `translate3d(${dx.toFixed(1)}px, ${(it.y + dy).toFixed(1)}px, 0)`;
          for (const [i, p] of it.parts.entries()) if (p.dz) p.el.style.transform = calm ? "" : `translate3d(0, ${(Math.sin(t + i) * p.dz * 700).toFixed(1)}px, 0)`;
          continue;
        }
        // the cluster's centre on screen: exactly at its page point when that point is mid-window, and
        // `speed` times as far from the middle elsewhere — so it moves faster than the content
        const cy = vh / 2 + (it.y - sy - vh / 2) * it.speed;
        const visible = cy > -it.h && cy < vh + it.h;
        it.el.style.visibility = visible ? "visible" : "hidden";
        if (!visible) continue;
        const dx = calm ? 0 : Math.sin((cy / vh) * Math.PI) * it.drift * (it.side === "l" ? 1 : -1);
        it.el.style.transform = `translate3d(${dx.toFixed(1)}px, ${(cy - it.h / 2).toFixed(1)}px, 0)`;
        // members a little nearer than the cluster run very slightly ahead of it
        for (const p of it.parts) if (p.dz) p.el.style.transform = calm ? "" : `translate3d(0, ${((cy - vh / 2) * p.dz).toFixed(1)}px, 0)`;
      }
    };

    // lay the clusters out for the current page length and window size
    const build = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const tier = vw >= 1280 ? "desktop" : vw >= 768 ? "tablet" : "phone";
      const scale = tier === "desktop" ? 1 : tier === "tablet" ? 0.66 : 0.46;
      const single = variant === "single";
      // how far a cluster may reach past the content's edge (negative: it stops short of it)
      const overlapR = single ? (tier === "phone" ? -2 : -40) : tier === "desktop" ? 20 : tier === "tablet" ? 8 : 4;
      const overlapL = single ? (tier === "phone" ? -2 : -40) : tier === "desktop" ? -8 : tier === "tablet" ? 4 : 4;
      const top = box.getBoundingClientRect().top + window.scrollY;
      const page = box.parentElement;
      const column = (page?.querySelector(".garden-mist") as HTMLElement | null)?.getBoundingClientRect();
      const edge = (page?.querySelector("[data-flora-edge]") as HTMLElement | null)?.getBoundingClientRect();
      const marginL = column ? Math.max(0, column.left) : 24;
      const marginR = edge && tier === "desktop" ? Math.max(0, vw - edge.right) : column ? Math.max(0, vw - column.right) : 24;

      let beats: (Beat & { y: number; k: number })[] = [];
      if (single) {
        beats = CORNERS.map((b) => ({ ...b, k: b.scale, y: top + vh / 2 + (vh * b.at - vh / 2) / (still.matches ? 1 : b.speed) }));
      } else {
        const height = box.offsetHeight, stretch = tier === "phone" ? 1.6 : tier === "tablet" ? 1.2 : 1;
        for (const [lane, side] of [[LEFT, "l"], [RIGHT, "r"]] as const) {
          let y = 0;
          for (let i = 0; ; i++) {
            const b = lane[i % lane.length];
            y += b.gap * vh * stretch;
            if (y > height - vh * 0.2) break;
            if (tier === "phone" && i % 2 === 1) continue; // fewer on phones
            beats.push({ ...b, side, k: 1, y: top + y });
          }
        }
      }

      // the corner bouquets: kept on screen in every tier, smaller on tablets and phones
      const frames = FRAMES.map((f, i) => ({ ...f, gap: 0, speed: 1, k: 1, y: 0, frame: i }));

      fg.replaceChildren();
      items = [...beats, ...frames].map((b) => {
        const cl = CLUSTERS[b.c];
        const limit = b.side === "l" ? marginL + overlapL : marginR + overlapR;
        // where the margin is narrow, the whole cluster is painted smaller (down to 60%) rather than cropped
        // away, so its composition still reads
        const isFrame = "frame" in b;
        const fit = Math.min(1, Math.max(isFrame ? 0.75 : 0.6, limit / (cl.w * scale * b.k * b.reach)));
        const k = scale * b.k * fit, w = Math.round(cl.w * k), h = Math.round(cl.h * k);
        const shown = Math.max(Math.min(w * b.reach, limit), tier === "phone" ? 18 : Math.min(w * 0.3, 40)); // how much of the box is inside the window
        const el = document.createElement("span");
        el.className = "flora-fg__item";
        el.dataset.side = b.side;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style[b.side === "l" ? "left" : "right"] = `${Math.round(shown - w)}px`;
        const inner = document.createElement("span");
        inner.className = "flora-fg__cluster";
        const parts = cl.members.map((m) => {
          const part = document.createElement("span");
          part.className = "flora-fg__part";
          part.style.left = `${m.x * k}px`;
          part.style.top = `${m.y * k}px`;
          part.style.width = `${m.size * k}px`;
          const sway = document.createElement("span");
          sway.className = "flora-fg__sway";
          sway.style.setProperty("--rot", `${m.rot}deg`);
          const img = document.createElement("img");
          img.src = `/assets/garden/flora/${m.kind}.webp`;
          img.alt = "";
          img.width = 480;
          img.height = 480;
          img.decoding = "async";
          img.draggable = false;
          sway.append(img);
          part.append(sway);
          inner.append(part);
          return { el: part, dz: tier === "phone" ? 0 : m.dz ?? 0 };
        });
        el.append(inner);
        fg.append(el);
        const speed = still.matches ? 1 : tier === "phone" ? 1 + (b.speed - 1) * 0.35 : b.speed;
        if (isFrame) {
          // its top in the window: sunk a little below the bottom edge, or tucked a little under the header
          const f = b as (typeof frames)[number];
          const y = f.corner === "bottom" ? vh - h * (1 - f.sink) : 40 - h * f.sink;
          return { el, parts, y, h, speed: 1, drift: tier === "phone" ? 0 : f.drift, side: b.side, frame: f.frame };
        }
        return { el, parts, y: b.y, h, speed, drift: tier === "phone" ? 0 : b.drift, side: b.side };
      });
      update();
    };

    // scroll events already arrive once per frame, so the layer is updated right in step with the page
    const onScroll = update;
    let resizeT = 0;
    const onResize = () => { clearTimeout(resizeT); resizeT = window.setTimeout(build, 120); };

    build();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize); // the page grows as images load
    ro.observe(box);
    still.addEventListener("change", build);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      still.removeEventListener("change", build);
      ro.disconnect();
      clearTimeout(resizeT);
    };
  }, [variant]);

  return (
    <>
      {/* measures the page: where it starts and how long it is */}
      <div ref={anchor} aria-hidden="true" className="pointer-events-none absolute inset-0" />
      {/* the foreground itself, fixed to the window and above the content */}
      <div ref={layer} aria-hidden="true" className="flora-fg" />
    </>
  );
}
