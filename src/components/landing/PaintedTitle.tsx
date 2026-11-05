"use client";

import { useEffect, useRef } from "react";
import title from "@/data/title-letters.json";

// "A Garden of Ideas", hand-lettered with a brush in oil (scripts/paint-landing.mjs
// --title): lowercase "a garden / of ideas" on two staggered lines, the i's dot
// a small painted flower. Each letter is its own layer, so the title can arrive
// one letter at a time, lift under the pointer, and — as the visitor scrolls
// into Scene 2 — be blown gently away: every letter floats the same way (up
// and a little to the right), each on its own path, sway, spin and fade, growing
// smaller and fainter until it is gone well before Scene 2 settles; all of them
// float back on the way up. The words are in the h1 for
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
  const across = (l.x + l.w / 2) / layout.width; // the breeze reaches the left letters first
  return {
    delay: across * 0.18 + rand(i, 1) * 0.08, // ≤ 0.26
    span: 0.32 + rand(i, 2) * 0.16, // ≤ 0.48, so every letter has left by 74% of the way
    dx: 0.1 + rand(i, 3) * 0.14, // in viewport widths
    dy: 0.12 + rand(i, 4) * 0.12, // in viewport heights, upward
    spin: (8 + rand(i, 5) * 18) * (rand(i, 6) < 0.75 ? 1 : -1),
    sway: 10 + rand(i, 7) * 14, // px, side to side as it floats
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
      const p = Math.max(0, window.scrollY / (vh * 0.55));
      letters.forEach((el, i) => {
        const f = flights[i];
        const q = Math.min(1, Math.max(0, (p - f.delay) / f.span));
        const fade = 1 - smooth(0.08, 0.8, q);
        el.style.visibility = fade <= 0.001 ? "hidden" : ""; // once gone, truly gone: nothing lingers at the edges
        if (calm.matches) {
          el.style.transform = "";
          el.style.opacity = String(1 - smooth(0, 0.7, p));
          return;
        }
        const e = smooth(0, 1, q); // lifts off softly and floats, no tug
        const x = e * f.dx * vw + Math.sin(q * Math.PI * 2 + f.phase) * f.sway * q;
        const y = -e * f.dy * vh - Math.sin(q * Math.PI) * f.sway * 0.4;
        el.style.transform = q ? `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(e * f.spin).toFixed(1)}deg) scale(${(1 - 0.22 * e).toFixed(3)})` : "";
        el.style.opacity = String(fade);
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
