"use client";

import { useEffect, useRef } from "react";
import title from "@/data/title-letters.json";

// "A Garden of Ideas", painted letter by letter in oil (scripts/paint-landing.mjs
// --title): each letter is its own impasto layer, so the title can arrive one
// letter at a time, fade upward as the visitor scrolls into Scene 2 (and come
// back on the way up), and let each letter lift and tilt a little under the
// pointer. The words themselves are in the h1 for screen readers; the painted
// letters are decorative. With reduced motion the title is simply there.

type Layout = { width: number; height: number; letters: { idx: number; x: number; y: number; w: number; h: number }[] };
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

function Letters({ layout, className, style }: { layout: Layout; className: string; style: React.CSSProperties }) {
  return (
    <span aria-hidden="true" className={`relative mx-auto block ${className}`} style={{ ...style, aspectRatio: `${layout.width} / ${layout.height}` }}>
      {layout.letters.map((l, n) => (
        <span
          key={l.idx}
          className="pt-letter absolute"
          style={{ left: pct(l.x, layout.width), top: pct(l.y, layout.height), width: pct(l.w, layout.width), ["--i" as string]: n, ["--tilt" as string]: `${n % 2 ? 3 : -3}deg` } as React.CSSProperties}
        >
          <span className="pt-rise block">
            {/* eslint-disable-next-line @next/next/no-img-element -- painted letter layer */}
            <img src={`/assets/garden/title/letter-${String(l.idx).padStart(2, "0")}.webp`} alt="" draggable={false} className="pt-paint block h-auto w-full select-none" />
          </span>
        </span>
      ))}
    </span>
  );
}

export default function PaintedTitle({ id, className = "" }: { id: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  // scroll-linked fade: 0 at the top of Scene 1, 1 once it is half scrolled away
  useEffect(() => {
    const h = ref.current;
    if (!h) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const out = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.55)));
      h.style.setProperty("--out", out.toFixed(3));
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
      <Letters layout={title.wide} className="portrait-art:hidden" style={{ width: "min(84vw, 66rem)" }} />
      <Letters layout={title.tall} className="hidden portrait-art:block" style={{ width: "min(86vw, 26rem)" }} />
    </h1>
  );
}
