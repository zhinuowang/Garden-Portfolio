"use client";

import { useEffect, useRef, useState } from "react";

// Painted flowers, petals and leaves (scripts/paint-landing.mjs --flora) floating in the page margins,
// above the painted backdrop. Each has its own depth: as the page scrolls it drifts a little faster or
// slower than the content (measured against the middle of the window, so the drift stays small on long
// pages), and sways gently on its own. They stay in the margins, never take pointer events, and keep
// still with reduced motion. On narrow screens they only peek in at the edges, behind the text.

type Kind = "cosmos" | "daisy" | "lavender" | "sprig" | "petal-pink" | "petal-peach" | "leaf-sage" | "leaf-autumn";
type Item = { kind: Kind; side: "l" | "r"; x: number; size: number; depth: number; rot: number; sway: number; blur?: boolean };

// one gently varied pattern, repeated down the page as needed: near (large, faster, a touch soft) and far
// (small, slower) pieces alternate sides so the margins never mirror each other
const PATTERN: Item[] = [
  { kind: "cosmos", side: "l", x: -1.4, size: 150, depth: 0.22, rot: -14, sway: 9, blur: true },
  { kind: "petal-pink", side: "r", x: 3.4, size: 54, depth: -0.08, rot: 30, sway: 7 },
  { kind: "leaf-autumn", side: "r", x: -0.8, size: 126, depth: 0.16, rot: 20, sway: 10 },
  { kind: "daisy", side: "l", x: 3.2, size: 74, depth: -0.05, rot: 8, sway: 8 },
  { kind: "sprig", side: "r", x: -1.2, size: 172, depth: 0.12, rot: -6, sway: 11 },
  { kind: "petal-peach", side: "l", x: 1.6, size: 50, depth: 0.3, rot: -40, sway: 6 },
  { kind: "cosmos", side: "r", x: 0.6, size: 96, depth: 0.2, rot: 22, sway: 10 },
  { kind: "lavender", side: "l", x: -0.6, size: 136, depth: 0.1, rot: 12, sway: 12 },
  { kind: "leaf-sage", side: "r", x: 2.6, size: 80, depth: -0.06, rot: -28, sway: 9 },
  { kind: "daisy", side: "l", x: 0.2, size: 118, depth: 0.24, rot: -20, sway: 9, blur: true },
  { kind: "petal-pink", side: "r", x: 4.4, size: 44, depth: 0.26, rot: 60, sway: 7 },
];

export default function FloatingFlora({ count = 8, start = 3, end = 96, every = 520 }: { count?: number; start?: number; end?: number; every?: number }) {
  const root = useRef<HTMLDivElement>(null);
  // about one piece per `every` pixels of page, so long case studies keep a few in view
  const [n, setN] = useState(count);
  useEffect(() => {
    const box = root.current;
    if (!box) return;
    const fit = () => setN(Math.max(count, Math.round(box.offsetHeight / every)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [count, every]);

  useEffect(() => {
    const box = root.current;
    if (!box || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = [...box.querySelectorAll<HTMLElement>("[data-depth]")];
    let mids: number[] = [];
    const measure = () => {
      const top = box.getBoundingClientRect().top + window.scrollY;
      mids = els.map((el) => top + el.offsetTop + el.offsetHeight / 2);
    };
    let raf = 0;
    const update = () => {
      raf = 0;
      const centre = window.scrollY + window.innerHeight / 2;
      els.forEach((el, i) => {
        const d = Number(el.dataset.depth);
        el.style.transform = `translate3d(0, ${((centre - mids[i]) * d).toFixed(1)}px, 0)`;
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    const onResize = () => { measure(); onScroll(); };
    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(box);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [n]);

  const items = Array.from({ length: n }, (_, i) => ({ ...PATTERN[i % PATTERN.length], top: start + ((end - start) * (i + 0.5)) / n }));

  return (
    <div ref={root} aria-hidden="true" className="flora">
      {items.map((it, i) => (
        <span
          key={i}
          data-depth={it.depth}
          className="flora__item"
          data-side={it.side}
          style={{
            top: `${it.top}%`,
            ["--x" as string]: it.x,
            ["--n" as string]: it.size,
            ["--rot" as string]: `${it.rot}deg`,
            ["--sway" as string]: `${it.sway}s`,
            ["--delay" as string]: `${-(i * 1.7) % it.sway}s`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- small decorative painted sprite */}
          <img src={`/assets/garden/flora/${it.kind}.webp`} alt="" width={it.kind === "sprig" ? 360 : 260} height={it.kind === "sprig" ? 360 : 260} loading="lazy" decoding="async" draggable={false} className={it.blur ? "flora__soft" : ""} />
        </span>
      ))}
    </div>
  );
}
