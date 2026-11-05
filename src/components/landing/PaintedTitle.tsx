"use client";

import { useEffect, useRef } from "react";
import title from "@/data/title-letters.json";

// "A Garden of Ideas", hand-lettered with a brush in oil (scripts/paint-landing.mjs
// --title): lowercase "a garden / of ideas" on two staggered lines, the i's dot
// a small painted flower. Each letter is its own layer, so the title can arrive
// one letter at a time, lift under the pointer, and — as the visitor scrolls
// into Scene 2 — be carried off by the wind: every letter drifts the same way
// (up and to the right), each at its own pace, distance and spin, fading as it
// goes, and all of them float back on the way up. The words are in the h1 for
// screen readers; the painted letters are decorative. With reduced motion the
// title simply fades.

type Layout = { width: number; height: number; letters: { idx: number; x: number; y: number; w: number; h: number }[] };
const layout = title.wide as Layout;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/** A repeatable random number per letter, so each one's flight is its own but never changes. */
const rand = (i: number, k: number) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const flights = layout.letters.map((l, i) => {
  const across = (l.x + l.w / 2) / layout.width; // the wind reaches the left letters first
  return {
    delay: across * 0.28 + rand(i, 1) * 0.12,
    span: 0.5 + rand(i, 2) * 0.25,
    dx: 0.35 + rand(i, 3) * 0.3, // in viewport widths
    dy: 0.12 + rand(i, 4) * 0.22, // in viewport heights, upward
    spin: (12 + rand(i, 5) * 38) * (rand(i, 6) < 0.8 ? 1 : -1),
    flutter: 6 + rand(i, 7) * 12,
    phase: rand(i, 8) * Math.PI * 2,
  };
});
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function PaintedTitle({ id, className = "" }: { id: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  // the wind: driven by how far Scene 1 has scrolled away, so it reverses exactly on the way back
  useEffect(() => {
    const h = ref.current;
    if (!h) return;
    const letters = Array.from(h.querySelectorAll<HTMLElement>(".pt-letter"));
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    const update = () => {
      raf = 0;
      const vw = window.innerWidth, vh = window.innerHeight;
      const p = Math.min(1.4, Math.max(0, window.scrollY / (vh * 0.6)));
      letters.forEach((el, i) => {
        const f = flights[i];
        const q = Math.min(1, Math.max(0, (p - f.delay) / f.span));
        if (calm.matches) {
          el.style.transform = "";
          el.style.opacity = String(1 - smooth(0, 1, p));
          return;
        }
        const e = Math.pow(q, 1.7); // starts gently, then the gust takes it
        const x = e * f.dx * vw + Math.sin(q * Math.PI * 1.5 + f.phase) * f.flutter * q;
        const y = -e * f.dy * vh + Math.sin(q * Math.PI * 2.2 + f.phase) * f.flutter * 0.6 * q;
        el.style.transform = q ? `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(e * f.spin).toFixed(1)}deg)` : "";
        el.style.opacity = String(1 - smooth(0.3, 1, q));
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <h1 id={id} ref={ref} className={`painted-title ${className}`}>
      <span className="sr-only">{title.text}</span>
      <span aria-hidden="true" className="relative mx-auto block w-[min(62vw,50rem)] portrait-art:w-[min(88vw,27rem)]" style={{ aspectRatio: `${layout.width} / ${layout.height}` }}>
        {layout.letters.map((l, n) => (
          <span
            key={l.idx}
            className="pt-letter absolute"
            style={{ left: pct(l.x, layout.width), top: pct(l.y, layout.height), width: pct(l.w, layout.width), ["--i" as string]: n, ["--tilt" as string]: `${n % 2 ? 5 : -5}deg` } as React.CSSProperties}
          >
            <span className="pt-rise block">
              {/* eslint-disable-next-line @next/next/no-img-element -- painted letter layer */}
              <img src={`/assets/garden/title/letter-${String(l.idx).padStart(2, "0")}.webp`} alt="" draggable={false} className="pt-paint block h-auto w-full select-none" />
            </span>
          </span>
        ))}
      </span>
    </h1>
  );
}
