"use client";

import { useEffect, useRef } from "react";

// The foreground layer of the inner pages: two painted flower clusters framing the window, one rising from the
// lower-left corner and one hanging into the upper-right (scripts/paint-landing.mjs --loose, after Zhinuo's
// oil-painting references). Each page has its own combination — a different corner of the same garden.
//
// Three depths: the painted backdrop is fixed, the content scrolls normally, and this layer — fixed to the
// window, above the content, never taking pointer events — answers the scroll at its own pace: as you scroll
// down the clusters drift against the page and sway, and scrolling back up brings them back the same way. A
// cluster moves as one; its blooms overlap and differ only a few pixels in depth.
//
// Each cluster is held to its corner, partly cropped by the window's edges, and reaches inward only as far as the
// content allows: up to the text column where the margin is clear; while a case study's contents list is
// beside it, it steps back into the outer margin, drawn smaller but still whole (it eases between the two). Smaller on tablets; on phones it only peeks in.
//
// Day only: when the lamp is lit the layer fades out gently and then rests — hidden, its sway paused and the
// scroll handler doing nothing — and when day returns it is placed where it belongs and fades back in. (Only on
// the project case studies; About and Contact have no floating layer.)

type Kind = "loose-daisy" | "loose-daisy-half" | "loose-peony" | "loose-peony-red" | "loose-poppy" | "loose-petals" | "lily" | "hibiscus" | "daffodil" | "rose-lavender";
// a bloom in a cluster, drawn for a cluster entering from the LEFT (the upper-right cluster is mirrored on the
// page); listed back to front; dz is how much nearer than the cluster it sits
type Member = { kind: Kind; x: number; y: number; size: number; rot: number; dz?: number };
type Cluster = { w: number; h: number; members: Member[] };

// computed from each painting's measured extent so the blooms genuinely overlap, with a clear front and back
const GARDENS: Record<string, { ll: Cluster; ur: Cluster }> = {
  "dog-nutrition-tracker": {
    ll: { w: 293, h: 250, members: [{ kind: "loose-peony-red", x: 0, y: 0, size: 250, rot: 8, dz: 0.006 }, { kind: "loose-daisy", x: 123, y: 13, size: 170, rot: 18, dz: 0.008 }, { kind: "loose-petals", x: 84, y: 12, size: 100, rot: 30, dz: 0.008 }] },
    ur: { w: 241, h: 275, members: [{ kind: "loose-peony", x: 66, y: 100, size: 175, rot: -12 }, { kind: "loose-daisy", x: 9, y: 0, size: 220, rot: 16, dz: 0.006 }, { kind: "loose-petals", x: 0, y: 115, size: 90, rot: 40, dz: 0.008 }] },
  },
  "eliminate-bacteria-pro": {
    ll: { w: 248, h: 282, members: [{ kind: "daffodil", x: 88, y: 122, size: 160, rot: 10 }, { kind: "lily", x: 0, y: 0, size: 235, rot: 30, dz: 0.006 }] },
    ur: { w: 292, h: 252, members: [{ kind: "loose-peony", x: 36, y: 0, size: 140, rot: 10 }, { kind: "rose-lavender", x: 0, y: 7, size: 245, rot: -6, dz: 0.006 }, { kind: "loose-daisy", x: 132, y: 48, size: 160, rot: 20, dz: 0.008 }] },
  },
  // AURELLE: blush and pale roses, soft and restrained beside the film
  aurelle: {
    ll: { w: 262, h: 262, members: [{ kind: "rose-lavender", x: 0, y: 12, size: 240, rot: 6 }, { kind: "loose-petals", x: 150, y: 150, size: 92, rot: 34, dz: 0.008 }] },
    // the whole daisy (not the half one), set in from the edge so the window doesn't crop its petals
    ur: { w: 262, h: 272, members: [{ kind: "loose-peony", x: 56, y: 24, size: 200, rot: -8 }, { kind: "loose-daisy", x: 72, y: 122, size: 150, rot: 14, dz: 0.006 }] },
  },
  "little-moments": {
    ll: { w: 235, h: 285, members: [{ kind: "loose-poppy", x: 54, y: 0, size: 175, rot: 12 }, { kind: "daffodil", x: 0, y: 50, size: 235, rot: -14, dz: 0.006 }, { kind: "loose-petals", x: 132, y: 126, size: 96, rot: 40, dz: 0.008 }] },
    ur: { w: 248, h: 269, members: [{ kind: "lily", x: 63, y: 84, size: 185, rot: -30 }, { kind: "loose-peony", x: 0, y: 0, size: 215, rot: 4, dz: 0.006 }] },
  },
};

export type GardenKey = keyof typeof GARDENS;

const GROW = 1.25; // the clusters' size on desktop, relative to the compositions above

export default function FloatingFlora({ garden }: { garden: string }) {
  const anchor = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = anchor.current, fg = layer.current;
    if (!box || !fg) return;
    const set = GARDENS[garden] ?? GARDENS["dog-nutrition-tracker"];
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    type Item = { el: HTMLElement; inner: HTMLElement; parts: { el: HTMLElement; dz: number }[]; corner: "ll" | "ur"; w: number; h: number; top: number; home: number; safe: number; amp: number };
    let items: Item[] = [];
    let toc: HTMLElement | null = null;

    // night: the layer rests (see the CSS for the fade); nothing is moved while it sleeps
    const html = document.documentElement;
    let asleep = html.dataset.night === "1";

    const update = () => {
      if (asleep) return;
      const vh = window.innerHeight, sy = window.scrollY, calm = still.matches;
      // the case studies' contents list (sticky in the left margin), if it is showing
      const t = toc && toc.offsetParent ? toc.getBoundingClientRect() : null;
      for (const it of items) {
        // scroll-linked drift: the cluster moves against the page as you scroll and sways back, the lower one
        // rising as the page goes down, the upper one sinking; reversing the scroll reverses it
        // (each only ever moves into open margin from its resting place — the lower one sinks below the window's
        // edge, the upper one drifts down the empty right margin, never up under the navigation — so the drift
        // never carries it onto the content; about a sixth of the scroll speed at its steepest)
        const phase = sy / 230 + (it.corner === "ll" ? 0 : 1.9);
        const swing = 0.5 - 0.5 * Math.cos(phase);
        const dy = calm ? 0 : swing * it.amp;
        const dx = calm ? 0 : Math.sin(phase * 0.6) * it.amp * 0.12 * (it.corner === "ll" ? -1 : 1);
        it.el.style.transform = `translate3d(${dx.toFixed(1)}px, ${(it.top + dy).toFixed(1)}px, 0)`;
        for (const [i, p] of it.parts.entries()) if (p.dz) p.el.style.transform = calm ? "" : `translate3d(0, ${(Math.sin(phase + i) * p.dz * 700).toFixed(1)}px, 0)`;
        // how far in it may come: home, unless the contents list shares its band of the window — then the whole
        // cluster steps back into the outer margin, drawn smaller so it stays complete rather than cut off
        let tx = 0, ty = 0, sc = 1;
        if (t && it.corner === "ll") {
          const bandTop = it.top + dy + it.h * 0.06;
          if (t.bottom > bandTop - 24 && t.top < vh) {
            sc = Math.min(1, it.safe / (it.w * 0.84));
            tx = it.safe - 0.84 * it.w * sc - (it.home - it.w); // its right edge just inside the margin
            ty = vh + 0.2 * it.h * sc - (it.top + dy + it.h); // its foot lifted: only a fifth of the smaller cluster below the edge
          }
        }
        // (on the inner cluster, so the step back eases independently of the scroll-linked motion above)
        it.inner.style.translate = `${tx.toFixed(0)}px ${ty.toFixed(0)}px`;
        it.inner.style.scale = sc.toFixed(3);
      }
    };

    const build = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const tier = vw >= 1280 ? "desktop" : vw >= 768 ? "tablet" : "phone";
      const scale = GROW * (tier === "desktop" ? 1 : tier === "tablet" ? 0.72 : 0.5);
      const page = box.parentElement;
      toc = page?.querySelector<HTMLElement>("nav[data-contents]") ?? null;
      const column = page?.querySelector(".garden-mist")?.getBoundingClientRect();
      const text = page?.querySelector("[data-flora-edge]")?.getBoundingClientRect();
      const leftEdge = page?.querySelector("[data-flora-left]")?.getBoundingClientRect(); // a page's content may start further in
      const marginL = column ? Math.max(0, column.left) : 24, marginR = column ? Math.max(0, vw - column.right) : 24;
      // where each cluster may reach: on the left up to the text column (or the content's edge) with a little air;
      // on the right up to the content's outer edge (clear of the images); on phones only a sliver
      // (on tablets the margins are narrow, so the clusters stop just short of the content's edge)
      const pad = tier === "tablet" ? -8 : 20;
      const homeL = tier === "phone" ? 20 : text && tier === "desktop" ? text.left - 28 : leftEdge && tier === "desktop" ? leftEdge.left - 28 : marginL + pad;
      const safeL = tier === "phone" ? 20 : Math.min(marginL - 12, homeL);
      const homeR = tier === "phone" ? 20 : text && tier === "desktop" ? vw - text.right - 8 : marginR + (tier === "tablet" ? -8 : 24);

      fg.replaceChildren();
      items = (["ll", "ur"] as const).map((corner) => {
        const cl = set[corner];
        const k = scale, w = Math.round(cl.w * k), h = Math.round(cl.h * k);
        const want = Math.round(w * (corner === "ll" ? 0.84 : 0.8)); // how much of it would ideally show
        const home = Math.min(want, corner === "ll" ? homeL : homeR);
        const safe = Math.min(home, corner === "ll" ? safeL : homeR);
        const el = document.createElement("span");
        el.className = "flora-fg__item";
        el.dataset.side = corner === "ll" ? "l" : "r";
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.visibility = "visible";
        el.style[corner === "ll" ? "left" : "right"] = `${home - w}px`;
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
        // the lower cluster rises from just below the bottom edge; the upper one hangs from just under the header
        const top = corner === "ll" ? vh - h * 0.78 : 52 - h * 0.12;
        // the lower-left cluster is kept to the margin's width while the contents list is beside it; the band it
        // occupies is its visible top part, so on case studies it sits a little lower to leave the list clear
        return { el, inner, parts, corner, w, h, top: corner === "ll" && toc?.offsetParent
          // on a case study: as high as it can sit while staying clear of the contents list once that list is
          // pinned (it is sticky 96 px from the top), and never more than about half hidden
          ? Math.min(vh - h * 0.45, Math.max(vh - h * 0.74, 96 + toc.offsetHeight + 24 - h * 0.06))
          : top, home, safe, amp: tier === "phone" ? 18 : tier === "tablet" ? 50 : 70 };
      });
      // place them where they belong straight away (no easing in from elsewhere), then let later changes ease
      for (const it of items) it.inner.style.transition = "none";
      update();
      requestAnimationFrame(() => requestAnimationFrame(() => { for (const it of items) it.inner.style.transition = ""; }));
    };

    // scroll events already arrive once per frame, so the layer is updated right in step with the page
    const onScroll = update;
    let resizeT = 0;
    const onResize = () => { clearTimeout(resizeT); resizeT = window.setTimeout(build, 120); };

    build();
    fg.toggleAttribute("data-asleep", asleep);
    // follow the lamp: fade out as dusk falls, and back in (already in place) when the day returns
    const mood = new MutationObserver(() => {
      const night = html.dataset.night === "1";
      if (night === asleep) return;
      asleep = night;
      if (!night) update();
      fg.toggleAttribute("data-asleep", night);
    });
    mood.observe(html, { attributes: true, attributeFilter: ["data-night"] });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // a change of language reflows the text (and the contents list beside the lower cluster): place them again
    window.addEventListener("garden-locale", onResize);
    still.addEventListener("change", build);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("garden-locale", onResize);
      still.removeEventListener("change", build);
      mood.disconnect();
      clearTimeout(resizeT);
    };
  }, [garden]);

  return (
    <>
      {/* marks the page, so the layer can find its content column */}
      <div ref={anchor} aria-hidden="true" className="pointer-events-none absolute inset-0" />
      {/* the foreground itself, fixed to the window and above the content */}
      <div ref={layer} aria-hidden="true" className="flora-fg" />
    </>
  );
}
