"use client";

import { useEffect, useRef } from "react";

// The parts of the painting that come alive. Each is a separately painted layer
// (scripts/paint-landing.mjs) that is NOT in the scene image underneath, so it
// can move without leaving a copy behind:
// - grass tufts bend in the "breeze" of a passing cursor (scene 2 only; in
//   scene 1 they stay still);
// - the three dogs play together once when the cursor enters their group;
// - the windmill's sails turn while hovered, then slow to a stop;
// - the fountain's water flows while hovered, then fades away;
// - the rocking chair (on the grass behind the tea table) rocks and settles
//   when the cursor reaches it.
// Touch: a tap starts any of them and stirs nearby grass.
// Reduced motion: everything stays still.

export type Sprite = {
  name: string;
  scene: number;
  kind: "dog" | "tail" | "ball" | "tuft" | "chair" | "front" | "sails" | "water-a" | "water-b";
  x: number;
  y: number;
  w: number;
  h: number;
  pivot: number[];
  dog?: number;
  /** For the sails: the whole windmill, as [x, y, w, h] fractions of the scene. */
  hit?: number[];
};

const src = (fmt: string, name: string) => `/assets/garden/landing/sprites/${fmt}-${name}.webp`;
const box = (s: { x: number; y: number; w: number }, outer?: { x: number; y: number; w: number; h: number }) =>
  outer
    ? { left: `${((s.x - outer.x) / outer.w) * 100}%`, top: `${((s.y - outer.y) / outer.h) * 100}%`, width: `${(s.w / outer.w) * 100}%` }
    : { left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.w * 100}%` };
const origin = (s: Sprite) => `${s.pivot[0] * 100}% ${s.pivot[1] * 100}%`;

/** Play a one-shot animation on `target` (data attribute) when `el` is entered, not restarting until it ends and the pointer has left. */
function oneShot(el: HTMLElement, attr: string, ms: number, target: HTMLElement = el) {
  let armed = true;
  const start = () => {
    if (!armed || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    armed = false;
    target.setAttribute(attr, "1");
    window.setTimeout(() => target.removeAttribute(attr), ms);
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

/** While hovered (or for a few seconds after a tap) set `attr` on `target`; removing it lets CSS ease the effect away. */
function whileHovered(el: HTMLElement, onChange: (on: boolean) => void) {
  let timer = 0;
  const enter = (e: PointerEvent) => { if (e.pointerType === "mouse") onChange(true); };
  const leave = (e: PointerEvent) => { if (e.pointerType === "mouse") onChange(false); };
  const down = (e: PointerEvent) => {
    if (e.pointerType === "mouse") return;
    onChange(true);
    clearTimeout(timer);
    timer = window.setTimeout(() => onChange(false), 4000);
  };
  el.addEventListener("pointerenter", enter);
  el.addEventListener("pointerleave", leave);
  el.addEventListener("pointerdown", down);
  return () => {
    clearTimeout(timer);
    el.removeEventListener("pointerenter", enter);
    el.removeEventListener("pointerleave", leave);
    el.removeEventListener("pointerdown", down);
  };
}

export default function LivingLayer({ desktop, mobile, breeze = true }: { desktop: Sprite[]; mobile: Sprite[]; breeze?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const cleanups: (() => void)[] = [];
    root.querySelectorAll<HTMLElement>("[data-dogs]").forEach((el) => cleanups.push(oneShot(el, "data-play", 2800)));
    root.querySelectorAll<HTMLElement>("[data-rocker]").forEach((el) => {
      const hit = el.querySelector<HTMLElement>("[data-rocker-hit]");
      if (hit) cleanups.push(oneShot(hit, "data-rock", 3000, el));
    });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => cleanups.forEach((c) => c());

    // ---- the fountain: water flows while hovered; CSS fades it in and gently away
    root.querySelectorAll<HTMLElement>("[data-fountain]").forEach((el) => {
      cleanups.push(whileHovered(el, (on) => (on ? el.setAttribute("data-flow", "") : el.removeAttribute("data-flow"))));
    });

    // ---- the windmill: the sails gather speed while hovered and coast to a stop after
    root.querySelectorAll<HTMLElement>("[data-windmill]").forEach((el) => {
      const sails = el.querySelector<HTMLElement>("[data-sails]");
      const hit = el.querySelector<HTMLElement>("[data-windmill-hit]");
      if (!sails || !hit) return;
      let angle = 0, speed = 0, target = 0, frame = 0, prev = 0;
      const turn = (t: number) => {
        const dt = Math.min(0.05, Math.max(0, (t - prev) / 1000));
        prev = t;
        speed += (target - speed) * (1 - Math.exp(-dt / (target ? 0.9 : 1.6))); // ease up, coast down
        angle = (angle + speed * dt) % 360;
        sails.style.transform = `rotate(${angle.toFixed(2)}deg)`;
        frame = target || speed > 0.5 ? requestAnimationFrame(turn) : 0;
      };
      cleanups.push(whileHovered(hit, (on) => {
        target = on ? 75 : 0; // degrees per second: one gentle turn every ~5 s
        if (!frame) { prev = performance.now(); frame = requestAnimationFrame(turn); }
      }));
      cleanups.push(() => cancelAnimationFrame(frame));
    });

    if (!breeze) return () => cleanups.forEach((c) => c());

    // ---- the breeze: each plant is a spring anchored at its root. A moving cursor
    // nearby bends it the way the cursor travels and pushes it a little away from
    // the cursor; the push fades with distance and the plant springs back to rest.
    // Sprigs are softer than grass, so their leaves follow a beat later.
    const tufts = Array.from(root.querySelectorAll<HTMLElement>("[data-tuft]")).map((el, i) => {
      const k = (el.dataset.tuft === "sprig" ? 34 : 52) + ((i * 37) % 30);
      return { el, a: 0, v: 0, k, c: 2 * Math.sqrt(k) * 0.24 };
    });
    let px = -1e5, py = -1e5, vx = 0, speed = 0, lastT = 0, raf = 0, prev = 0;
    const step = (t: number) => {
      const dt = Math.max(0, Math.min(0.05, (t - prev) / 1000));
      prev = t;
      let moving = speed > 5;
      for (const s of tufts) {
        const r = s.el.getBoundingClientRect();
        if (r.width === 0) continue; // the other composition, hidden at this size
        const cx = r.left + r.width / 2, cy = r.top + r.height * 0.5;
        const d = Math.hypot(px - cx, py - cy);
        const reach = Math.max(170, r.height * 1.6);
        const f = Math.exp(-((d / reach) ** 2));
        const along = (vx / 1000) * 10; // bend with the direction of travel
        const away = Math.sign(cx - px) * Math.min(1, speed / 500) * 7; // and lean away from the cursor
        const target = Math.max(-16, Math.min(16, (along + away) * f));
        s.v += (s.k * (target - s.a) - s.c * s.v) * dt;
        s.a += s.v * dt;
        s.el.style.transform = `translateX(${(s.a * 0.35).toFixed(2)}px) rotate(${s.a.toFixed(2)}deg)`;
        if (Math.abs(s.a) > 0.05 || Math.abs(s.v) > 0.05) moving = true;
      }
      const decay = Math.pow(0.04, dt); // the breeze dies away within a second
      vx *= decay;
      speed *= decay;
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
      const fresh = lastT && t - lastT < 120;
      vx = fresh ? vx * 0.6 + ((e.clientX - px) / dt) * 1000 * 0.4 : 0;
      speed = fresh ? speed * 0.6 + (Math.hypot(e.clientX - px, e.clientY - py) / dt) * 1000 * 0.4 : 0;
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
      speed = 1400;
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
  }, [breeze]);

  const render = (list: Sprite[], fmt: string, className: string) => {
    const tufts = list.filter((s) => s.kind === "tuft");
    const chair = list.find((s) => s.kind === "chair");
    const front = list.filter((s) => s.kind === "front");
    const sails = list.find((s) => s.kind === "sails");
    const water = list.filter((s) => s.kind === "water-a" || s.kind === "water-b");
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
          <img key={s.name} data-tuft={s.name.startsWith("sprig") ? "sprig" : "grass"} src={src(fmt, s.name)} alt="" draggable={false} className="living-tuft absolute h-auto select-none" style={{ ...box(s), transformOrigin: origin(s) }} />
        ))}
        {sails && sails.hit && (
          <div data-windmill>
            {/* eslint-disable-next-line @next/next/no-img-element -- painted layer */}
            <img data-sails src={src(fmt, sails.name)} alt="" draggable={false} className="absolute h-auto select-none" style={{ ...box(sails), transformOrigin: "50% 50%" }} />
            <span data-windmill-hit className="pointer-events-auto absolute" style={{ left: `${sails.hit[0] * 100}%`, top: `${sails.hit[1] * 100}%`, width: `${sails.hit[2] * 100}%`, height: `${sails.hit[3] * 100}%` }} />
          </div>
        )}
        {water.length > 0 && (
          <div data-fountain className="living-fountain pointer-events-auto absolute" style={box(water[0])}>
            {water.map((s) => (
              // eslint-disable-next-line @next/next/no-img-element -- painted layer
              <img key={s.name} src={src(fmt, s.name)} alt="" draggable={false} className={`living-${s.kind} absolute inset-0 h-auto w-full select-none`} />
            ))}
            {/* a few drops falling from the upper bowl's rim (positions follow the fountain drawing, 220 × 200) */}
            {[[29, 47, 0], [31, 52, 0.45], [70, 47, 0.2], [72, 52, 0.7], [45, 26, 0.35], [55, 26, 0.8]].map(([l, t, d], i) => (
              <span key={i} className="living-drop absolute" style={{ left: `${l}%`, top: `${t}%`, animationDelay: `${d}s` }} />
            ))}
            <span className="block w-full" style={{ aspectRatio: "220 / 200" }} />
          </div>
        )}
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
          <div data-rocker className="living-rocker absolute" style={{ ...box(chair), transformOrigin: origin(chair) }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- painted layer */}
            <img src={src(fmt, chair.name)} alt="" draggable={false} className="block h-auto w-full select-none" />
            <span data-rocker-hit className="pointer-events-auto absolute inset-x-[12%] top-0 bottom-[4%]" />
          </div>
        )}
        {front.map((s) => (
          // eslint-disable-next-line @next/next/no-img-element -- painted layer, in front of the chair
          <img key={s.name} src={src(fmt, s.name)} alt="" draggable={false} className="absolute h-auto select-none" style={box(s)} />
        ))}
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
