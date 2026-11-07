"use client";

import { useEffect, useRef } from "react";

// The foreground layer of the inner pages: large painted flower clusters (scripts/paint-landing.mjs
// --foreground) between the viewer and the page.
//
// Three depths: the painted backdrop is fixed (it barely moves), the content scrolls normally, and this
// layer — fixed to the window, above the content, never taking pointer events — moves FASTER than the
// content as you scroll, so the flowers pass in front of it like stems close to the eye. Each cluster is
// anchored to a point down the page and sits exactly there when that point is mid-window; elsewhere it is
// ahead of (or behind) the page by its own speed, with a slight sideways drift.
//
// Clusters enter from the window's edges and are partly cropped by it. How far one reaches inward is capped
// by the content column (`.garden-mist`): it may overlap that column's outer edge a little, never the text.
// Smaller and fewer on tablets; on phones they only peek in at the edges, slower. With reduced motion they
// simply stay put on the page.

type Kind = "fg-cosmos" | "fg-daisies" | "fg-rose" | "fg-leaves" | "fg-petals" | "head-white" | "head-blush" | "head-red" | "head-petal";
type Spec = { kind: Kind; side: "l" | "r"; size: number; reach: number; speed: number; rot: number; drift: number };

// one editorial sequence, repeated down long pages: big clusters alternate sides, with a few loose petals
const SEQUENCE: Spec[] = [
  { kind: "fg-cosmos", side: "l", size: 360, reach: 0.92, speed: 1.32, rot: -6, drift: 10 },
  { kind: "fg-petals", side: "r", size: 150, reach: 0.95, speed: 1.6, rot: 8, drift: 18 },
  { kind: "fg-leaves", side: "r", size: 400, reach: 0.8, speed: 1.24, rot: 14, drift: 8 },
  { kind: "fg-daisies", side: "l", size: 330, reach: 0.9, speed: 1.38, rot: 4, drift: 12 },
  { kind: "fg-rose", side: "r", size: 340, reach: 0.9, speed: 1.3, rot: -8, drift: 10 },
  { kind: "fg-petals", side: "l", size: 120, reach: 0.95, speed: 1.65, rot: -30, drift: 20 },
  { kind: "fg-leaves", side: "l", size: 360, reach: 0.8, speed: 1.22, rot: -10, drift: 8 },
  { kind: "fg-cosmos", side: "r", size: 310, reach: 0.92, speed: 1.42, rot: 10, drift: 12 },
  { kind: "fg-daisies", side: "r", size: 290, reach: 0.9, speed: 1.3, rot: -4, drift: 10 },
  { kind: "fg-rose", side: "l", size: 300, reach: 0.9, speed: 1.34, rot: 8, drift: 10 },
];

// a single-screen page (Contact): a few small, stemless flower heads drifting round the corners of the
// window, kept well clear of the text (they stop short of the content column instead of overlapping it)
const CORNERS: (Spec & { at: number })[] = [
  { kind: "head-blush", side: "r", size: 128, reach: 0.62, speed: 1.35, rot: -12, drift: 8, at: 0.15 },
  { kind: "head-white", side: "l", size: 116, reach: 0.6, speed: 1.3, rot: 10, drift: 8, at: 0.86 },
  { kind: "head-red", side: "r", size: 88, reach: 0.7, speed: 1.45, rot: 18, drift: 10, at: 0.9 },
  { kind: "head-petal", side: "l", size: 54, reach: 0.95, speed: 1.6, rot: -24, drift: 14, at: 0.2 },
  { kind: "head-white", side: "r", size: 62, reach: 0.8, speed: 1.55, rot: -30, drift: 12, at: 0.52 },
];

const SPACING = 640; // page pixels between clusters on desktop

// where each painting ends, as a fraction of its canvas measured from the stem side (the rest is empty canvas)
const INK: Record<Kind, number> = { "fg-cosmos": 0.74, "fg-daisies": 0.8, "fg-rose": 0.78, "fg-leaves": 0.97, "fg-petals": 0.98, "head-white": 0.95, "head-blush": 0.95, "head-red": 0.95, "head-petal": 0.92 };

export default function FloatingFlora({ variant = "long" }: { variant?: "long" | "single" }) {
  const anchor = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = anchor.current, fg = layer.current;
    if (!box || !fg) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let items: { el: HTMLElement; spec: Spec; y: number; h: number; speed: number }[] = [];
    const update = () => {
      const vh = window.innerHeight, sy = window.scrollY;
      for (const it of items) {
        // the cluster's centre on screen: exactly at its page point when that point is mid-window, and
        // `speed` times as far from the middle elsewhere — so it moves faster than the content
        const cy = vh / 2 + (it.y - sy - vh / 2) * it.speed;
        const visible = cy > -it.h && cy < vh + it.h;
        it.el.style.visibility = visible ? "visible" : "hidden";
        if (!visible) continue;
        const dx = still.matches ? 0 : Math.sin((cy / vh) * Math.PI) * it.spec.drift * (it.spec.side === "l" ? 1 : -1);
        it.el.style.transform = `translate3d(${dx.toFixed(1)}px, ${(cy - it.h / 2).toFixed(1)}px, 0)`;
      }
    };

    // lay the clusters out for the current page length and window size
    const build = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const tier = vw >= 1280 ? "desktop" : vw >= 768 ? "tablet" : "phone";
      const scale = tier === "desktop" ? 1 : tier === "tablet" ? 0.62 : 0.42;
      // how far a painting may reach past the content's edge: a little onto an image's outer edge on the right,
      // barely at all on the left, where the case studies keep their contents links
      // (on a single-screen page the heads stop well short of the content instead: negative overlap)
      const single = variant === "single";
      const overlapR = single ? (tier === "phone" ? -2 : -40) : tier === "desktop" ? 36 : tier === "tablet" ? 16 : 6;
      const overlapL = single ? (tier === "phone" ? -2 : -40) : tier === "desktop" ? 12 : tier === "tablet" ? 10 : 6;
      const top = box.getBoundingClientRect().top + window.scrollY;
      // the content's outer edges: the reading column on the left (its links stay clear), and on the right the
      // text-and-image column where a page marks one (data-flora-edge), so a cluster can just touch an image's edge
      const page = box.parentElement;
      const column = (page?.querySelector(".garden-mist") as HTMLElement | null)?.getBoundingClientRect();
      const edge = (page?.querySelector("[data-flora-edge]") as HTMLElement | null)?.getBoundingClientRect();
      const marginL = column ? Math.max(0, column.left) : 24;
      const marginR = edge && tier === "desktop" ? Math.max(0, vw - edge.right) : column ? Math.max(0, vw - column.right) : 24;
      let specs: (Spec & { y: number })[];
      if (variant === "single") {
        // composed for the unscrolled window: a head starts exactly at `at` of the window's height, then drifts
        specs = CORNERS.map((s) => ({ ...s, y: top + vh / 2 + (vh * s.at - vh / 2) / (still.matches ? 1 : s.speed) }));
      } else {
        const height = box.offsetHeight, step = SPACING * (tier === "phone" ? 1.5 : tier === "tablet" ? 1.2 : 1);
        specs = [];
        for (let i = 0, y = vh * 0.55; y < height - vh * 0.2; i++, y += step) specs.push({ ...SEQUENCE[i % SEQUENCE.length], y: top + y });
      }
      if (tier !== "desktop") specs = specs.filter((s) => s.kind !== "fg-petals" && s.size >= 80);
      fg.replaceChildren();
      items = specs.map((spec) => {
        const w = Math.round(spec.size * scale);
        const limit = spec.side === "l" ? marginL + overlapL : marginR + overlapR;
        const ink = w * INK[spec.kind];
        const inner = Math.min(ink * spec.reach, limit); // where the painting's inner edge falls in the window
        const shown = inner + (w - ink); // the same, measured to the element's inner edge
        const el = document.createElement("span");
        el.className = "flora-fg__item";
        el.dataset.side = spec.side;
        el.style.width = `${w}px`;
        el.style[spec.side === "l" ? "left" : "right"] = `${Math.round(shown - w)}px`;
        el.style.setProperty("--rot", `${spec.rot}deg`);
        const sway = document.createElement("span");
        sway.className = "flora-fg__sway";
        const img = document.createElement("img");
        img.src = `/assets/garden/flora/${spec.kind}.webp`;
        img.alt = "";
        img.width = spec.kind === "fg-petals" ? 360 : spec.kind === "head-petal" ? 240 : spec.kind.startsWith("head-") ? 420 : 640;
        img.height = img.width;
        img.decoding = "async";
        img.draggable = false;
        sway.append(img);
        el.append(sway);
        fg.append(el);
        const speed = still.matches ? 1 : tier === "phone" ? 1 + (spec.speed - 1) * 0.35 : spec.speed;
        return { el, spec, y: spec.y, h: w, speed };
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
