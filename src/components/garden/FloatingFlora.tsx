"use client";

import { useEffect, useRef } from "react";

// The foreground layer of the inner pages: painted blossoms (scripts/paint-landing.mjs --loose, after
// Zhinuo's oil-painting references — lilies, hibiscus, daisies, daffodils, lavender roses, peonies) floating
// between the viewer and the page. Heads and petals only, never stems.
//
// Three depths: the painted backdrop is fixed, the content scrolls normally, and this layer — fixed to the
// window, above the content, never taking pointer events — moves FASTER than the content as you scroll.
//
// The flowers come in small composed clusters (a large bloom with smaller ones tucked behind it, a pair
// overlapping, a lone blossom with a few drifting petals), placed down the page at uneven intervals and on
// irregularly alternating sides, with some stretches left empty. A cluster drifts as one; its members differ
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
  hibiscus: { w: 250, h: 250, members: [{ kind: "hibiscus", x: 0, y: 0, size: 250, rot: 14 }] },
  lily: { w: 240, h: 240, members: [{ kind: "lily", x: 0, y: 0, size: 240, rot: 52 }] },
};

// the walk down a long page: which cluster, which side, how far after the previous one (in window heights:
// deliberately uneven, with a few long empty stretches), how much of it shows, and how near it is
type Beat = { c: keyof typeof CLUSTERS; side: "l" | "r"; gap: number; reach: number; speed: number; drift: number };
const BEATS: Beat[] = [
  { c: "lilyTrio", side: "l", gap: 0.55, reach: 0.78, speed: 1.3, drift: 10 },
  { c: "hibiscus", side: "r", gap: 1.35, reach: 0.78, speed: 1.38, drift: 8 },
  { c: "petals", side: "r", gap: 0.7, reach: 0.9, speed: 1.6, drift: 16 },
  { c: "rosePair", side: "l", gap: 1.9, reach: 0.6, speed: 1.26, drift: 8 },
  { c: "daffodilDaisy", side: "r", gap: 1.1, reach: 0.6, speed: 1.34, drift: 10 },
  { c: "lily", side: "l", gap: 2.2, reach: 0.78, speed: 1.42, drift: 12 },
  { c: "peonyDaisy", side: "l", gap: 0.8, reach: 0.6, speed: 1.28, drift: 8 },
  { c: "poppyPetal", side: "r", gap: 1.6, reach: 0.78, speed: 1.36, drift: 10 },
];

// a single-screen page (Contact): three small clusters composed round the window's corners, well clear of
// the text (at: how far down the window; scale: smaller than on long pages)
const CORNERS: (Beat & { at: number; scale: number })[] = [
  { c: "peonyDaisy", side: "r", gap: 0, reach: 0.6, speed: 1.35, drift: 8, at: 0.17, scale: 0.6 },
  { c: "lilyTrio", side: "l", gap: 0, reach: 0.6, speed: 1.3, drift: 8, at: 0.86, scale: 0.55 },
  { c: "petals", side: "r", gap: 0, reach: 0.8, speed: 1.55, drift: 12, at: 0.88, scale: 0.55 },
];

export default function FloatingFlora({ variant = "long" }: { variant?: "long" | "single" }) {
  const anchor = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = anchor.current, fg = layer.current;
    if (!box || !fg) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    type Item = { el: HTMLElement; parts: { el: HTMLElement; dz: number }[]; y: number; h: number; speed: number; drift: number; side: "l" | "r" };
    let items: Item[] = [];

    const update = () => {
      const vh = window.innerHeight, sy = window.scrollY, calm = still.matches;
      for (const it of items) {
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
        const height = box.offsetHeight;
        let y = 0;
        for (let i = 0; ; i++) {
          const b = BEATS[i % BEATS.length];
          y += b.gap * vh * (tier === "phone" ? 1.5 : tier === "tablet" ? 1.2 : 1);
          if (y > height - vh * 0.2) break;
          if (tier === "phone" && i % 2 === 1) continue; // fewer on phones
          beats.push({ ...b, k: 1, y: top + y });
        }
      }

      fg.replaceChildren();
      items = beats.map((b) => {
        const cl = CLUSTERS[b.c];
        const limit = b.side === "l" ? marginL + overlapL : marginR + overlapR;
        // where the margin is narrow, the whole cluster is painted smaller (down to 60%) rather than cropped
        // away, so its composition still reads
        const fit = Math.min(1, Math.max(0.6, limit / (cl.w * scale * b.k * b.reach)));
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
