"use client";

import { useEffect, useRef } from "react";

// The parts of the painting that come alive. Each is a separately painted layer
// (scripts/paint-landing.mjs) that is NOT in the scene image underneath, so it
// can move without leaving a copy behind:
// - grass tufts bend in the "breeze" of a passing cursor (springs, one rAF loop);
// - the three dogs play together once when the cursor enters their group;
// - the rocking chair rocks and settles when the cursor reaches it.
// Touch: a tap starts the dogs or the chair and stirs nearby grass.
// Reduced motion: everything stays still.

export type Sprite = {
  name: string;
  scene: number;
  kind: "dog" | "tail" | "ball" | "tuft" | "chair";
  x: number;
  y: number;
  w: number;
  h: number;
  pivot: number[];
  dog?: number;
};

const src = (fmt: string, name: string) => `/assets/garden/landing/sprites/${fmt}-${name}.webp`;
const box = (s: { x: number; y: number; w: number }, outer?: { x: number; y: number; w: number; h: number }) =>
  outer
    ? { left: `${((s.x - outer.x) / outer.w) * 100}%`, top: `${((s.y - outer.y) / outer.h) * 100}%`, width: `${(s.w / outer.w) * 100}%` }
    : { left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.w * 100}%` };
const origin = (s: Sprite) => `${s.pivot[0] * 100}% ${s.pivot[1] * 100}%`;

/** Play a one-shot animation on `el` (data attribute), not restarting until it ends and the pointer has left. */
function oneShot(el: HTMLElement, attr: string, ms: number) {
  let armed = true;
  const start = () => {
    if (!armed || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    armed = false;
    el.setAttribute(attr, "1");
    window.setTimeout(() => el.removeAttribute(attr), ms);
  };
  const enter = (e: PointerEvent) => { if (e.pointerType === "mouse") start(); };
  const down = (e: PointerEvent) => { if (e.pointerType !== "mouse") { armed = true; start(); } };
  const leave = () => { armed = true; };
  el.addEventListener("pointerenter", enter);
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointerleave", leave);
  return () => {
    el.removeEventListener("pointerenter", enter);
    el.removeEventListener("pointerdown", down);
    el.removeEventListener("pointerleave", leave);
  };
}

export default function LivingLayer({ desktop, mobile }: { desktop: Sprite[]; mobile: Sprite[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const cleanups: (() => void)[] = [];
    root.querySelectorAll<HTMLElement>("[data-dogs]").forEach((el) => cleanups.push(oneShot(el, "data-play", 2800)));
    root.querySelectorAll<HTMLElement>("[data-rocker]").forEach((el) => cleanups.push(oneShot(el, "data-rock", 3000)));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => cleanups.forEach((c) => c());

    // ---- the breeze: grass anchored at its base, each tuft its own spring
    const tufts = Array.from(root.querySelectorAll<HTMLElement>("[data-tuft]")).map((el, i) => {
      const k = 55 + ((i * 37) % 45);
      return { el, a: 0, v: 0, k, c: 2 * Math.sqrt(k) * 0.28 };
    });
    let px = -1e5, py = -1e5, vx = 0, lastT = 0, raf = 0, prev = 0;
    const step = (t: number) => {
      const dt = Math.min(0.05, (t - prev) / 1000);
      prev = t;
      let moving = Math.abs(vx) > 5;
      for (const s of tufts) {
        const r = s.el.getBoundingClientRect();
        if (r.width === 0) continue; // the other composition, hidden at this size
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height * 0.55));
        const reach = Math.max(110, r.height * 1.3);
        const f = Math.exp(-((d / reach) ** 2));
        const target = Math.max(-13, Math.min(13, (vx / 1000) * 13 * f));
        s.v += (s.k * (target - s.a) - s.c * s.v) * dt;
        s.a += s.v * dt;
        s.el.style.transform = `rotate(${s.a.toFixed(2)}deg)`;
        if (Math.abs(s.a) > 0.05 || Math.abs(s.v) > 0.05) moving = true;
      }
      vx *= Math.pow(0.03, dt); // the breeze dies away within a second
      raf = moving ? requestAnimationFrame(step) : 0;
    };
    const kick = () => {
      if (!raf) {
        prev = performance.now();
        raf = requestAnimationFrame(step);
      }
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const t = performance.now();
      const dt = Math.max(8, t - lastT);
      vx = lastT && t - lastT < 120 ? vx * 0.6 + ((e.clientX - px) / dt) * 1000 * 0.4 : 0;
      px = e.clientX;
      py = e.clientY;
      lastT = t;
      kick();
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      px = e.clientX;
      py = e.clientY;
      vx = (Math.random() < 0.5 ? -1 : 1) * 1400;
      kick();
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      cleanups.forEach((c) => c());
    };
  }, []);

  const render = (list: Sprite[], fmt: string, className: string) => {
    const tufts = list.filter((s) => s.kind === "tuft");
    const chair = list.find((s) => s.kind === "chair");
    const play = list.filter((s) => s.kind === "dog" || s.kind === "tail" || s.kind === "ball");
    let group: { x: number; y: number; w: number; h: number } | null = null;
    if (play.length) {
      const x0 = Math.min(...play.map((s) => s.x)), y0 = Math.min(...play.map((s) => s.y));
      const x1 = Math.max(...play.map((s) => s.x + s.w)), y1 = Math.max(...play.map((s) => s.y + s.h));
      group = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    const dogIds = [...new Set(play.filter((s) => s.kind === "dog").map((s) => s.dog!))];
    const ball = play.find((s) => s.kind === "ball");
    return (
      <div className={className}>
        {tufts.map((s) => (
          // eslint-disable-next-line @next/next/no-img-element -- painted layer, sized by the scene
          <img key={s.name} data-tuft src={src(fmt, s.name)} alt="" draggable={false} className="living-tuft absolute h-auto select-none" style={{ ...box(s), transformOrigin: origin(s) }} />
        ))}
        {group && (
          <div data-dogs className="living-dogs pointer-events-auto absolute" style={{ left: `${group.x * 100}%`, top: `${group.y * 100}%`, width: `${group.w * 100}%`, aspectRatio: `${group.w} / ${group.h * (fmt === "desktop" ? 0.75 : 2340 / 1080)}` }}>
            {dogIds.map((id) => {
              const body = play.find((s) => s.kind === "dog" && s.dog === id)!;
              const tail = play.find((s) => s.kind === "tail" && s.dog === id);
              return (
                <div key={id} className={`living-dog living-dog-${id} absolute`} style={{ ...box(body, group!), transformOrigin: origin(body) }}>
                  {tail && (
                    // eslint-disable-next-line @next/next/no-img-element -- painted layer
                    <img src={src(fmt, tail.name)} alt="" draggable={false} className="living-tail absolute inset-0 h-auto w-full select-none" style={{ transformOrigin: origin(tail) }} />
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element -- painted layer */}
                  <img src={src(fmt, body.name)} alt="" draggable={false} className="relative block h-auto w-full select-none" />
                </div>
              );
            })}
            {ball && (
              // eslint-disable-next-line @next/next/no-img-element -- painted layer
              <img src={src(fmt, ball.name)} alt="" draggable={false} className="living-ball absolute h-auto select-none" style={{ ...box(ball, group), transformOrigin: "50% 50%" }} />
            )}
          </div>
        )}
        {chair && (
          <div data-rocker className="living-rocker pointer-events-auto absolute" style={{ ...box(chair), transformOrigin: origin(chair) }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- painted layer */}
            <img src={src(fmt, chair.name)} alt="" draggable={false} className="block h-auto w-full select-none" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0">
      {render(desktop, "desktop", "portrait-art:hidden")}
      {render(mobile, "mobile", "hidden portrait-art:block")}
    </div>
  );
}
