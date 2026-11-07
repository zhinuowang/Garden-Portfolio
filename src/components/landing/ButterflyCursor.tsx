"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// The Landing page's cursor: a small painted butterfly (scripts/paint-landing.mjs
// --butterfly) whose head sits exactly on the pointer, so clicks land where
// they look. It follows the pointer directly (no easing lag), tilts a little
// toward the way it is moving, flutters while moving and rests with its wings
// open when the pointer stops. Over links and other controls the normal
// pointer comes back and the butterfly perches beside it. Only on devices with
// a fine, hovering pointer; never with reduced motion; and the normal cursor
// stays until the artwork has loaded. At night (the lamppost) it becomes a
// small, softly glowing firefly at the same click point.

const SIZE = 44; // css px wide
const HOT = [0.5, 0.178]; // the head, as a fraction of the artwork
const INTERACTIVE = "a, button, [role='button'], input, select, textarea, label, summary, [data-windmill-hit], [data-rocker-hit], [data-fountain], .pt-letter";

export default function ButterflyCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const check = () => setEnabled(fine.matches && !calm.matches);
    check();
    fine.addEventListener("change", check);
    calm.addEventListener("change", check);
    return () => { fine.removeEventListener("change", check); calm.removeEventListener("change", check); };
  }, []);

  useEffect(() => {
    if (!enabled || !ready) return;
    const el = ref.current!;
    document.documentElement.classList.add("butterfly-cursor");
    let x = -100, y = -100, lx = x, tilt = 0, raf = 0, still = 0;
    const draw = () => {
      raf = 0;
      const vx = x - lx;
      lx = x;
      tilt += (Math.max(-18, Math.min(18, vx * 1.2)) - tilt) * 0.25;
      el.style.transform = `translate3d(${x - SIZE * HOT[0]}px, ${y - SIZE * HOT[1] * (180 / 200)}px, 0) rotate(${tilt.toFixed(2)}deg)`;
      if (Math.abs(tilt) > 0.3) raf = requestAnimationFrame(draw); // ease the tilt back to level
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      x = e.clientX; y = e.clientY;
      el.dataset.state = "moving";
      el.dataset.over = (e.target as Element | null)?.closest?.(INTERACTIVE) ? "control" : "";
      el.style.opacity = "1";
      window.clearTimeout(still);
      still = window.setTimeout(() => { el.dataset.state = "resting"; if (!raf) raf = requestAnimationFrame(draw); }, 140);
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const leave = () => { el.style.opacity = "0"; };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      document.documentElement.classList.remove("butterfly-cursor");
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
      window.clearTimeout(still);
    };
  }, [enabled, ready]);

  if (!enabled) return null;
  // rendered straight into <body>, so no clipped or transformed ancestor can hide it
  return createPortal(
    <div ref={ref} aria-hidden="true" className="butterfly" data-state="resting" style={{ width: SIZE, opacity: 0 }}>
      {/* at night the butterfly becomes a firefly: a small warm glow at the very same click point */}
      <span className="butterfly__firefly" style={{ left: `${HOT[0] * 100}%`, top: `${HOT[1] * 100}%` }}>
        <span className="firefly__halo" />
        <svg viewBox="0 0 40 52" className="firefly__bug">
          <defs>
            <radialGradient id="ff-glow" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#fffdf0" />
              <stop offset="45%" stopColor="#fff09a" />
              <stop offset="100%" stopColor="#f3c84a" />
            </radialGradient>
          </defs>
          {/* wings: translucent, softly veined, fluttering while it flies */}
          <g className="firefly__wing firefly__wing--l">
            <path d="M18 17 C 6 10, 1 18, 4 26 C 8 31, 15 26, 18 21 Z" fill="rgb(232 238 255 / 0.62)" stroke="rgb(255 255 255 / 0.75)" strokeWidth="0.8" />
            <path d="M16 19 C 11 18, 7 21, 6 24" fill="none" stroke="rgb(255 255 255 / 0.55)" strokeWidth="0.6" />
          </g>
          <g className="firefly__wing firefly__wing--r">
            <path d="M22 17 C 34 10, 39 18, 36 26 C 32 31, 25 26, 22 21 Z" fill="rgb(232 238 255 / 0.62)" stroke="rgb(255 255 255 / 0.75)" strokeWidth="0.8" />
            <path d="M24 19 C 29 18, 33 21, 34 24" fill="none" stroke="rgb(255 255 255 / 0.55)" strokeWidth="0.6" />
          </g>
          {/* antennae with little curls */}
          <path d="M18 7 C 16 3, 13 2, 11 3.5" fill="none" stroke="#3a2c22" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M22 7 C 24 3, 27 2, 29 3.5" fill="none" stroke="#3a2c22" strokeWidth="1.3" strokeLinecap="round" />
          {/* the glowing tail, plump and round */}
          <ellipse className="firefly__tail" cx="20" cy="36" rx="8" ry="10" fill="url(#ff-glow)" />
          <ellipse cx="20" cy="33" rx="3.2" ry="3.6" fill="#fffef6" opacity="0.9" />
          {/* body and head */}
          <ellipse cx="20" cy="21" rx="5.5" ry="6" fill="#4a3829" />
          <circle cx="20" cy="10" r="5.2" fill="#3a2c22" />
          <circle cx="18" cy="9.4" r="1.1" fill="#fff8e6" />
          <circle cx="22" cy="9.4" r="1.1" fill="#fff8e6" />
          <path d="M18.6 12.2 Q 20 13.2 21.4 12.2" fill="none" stroke="#f4b5a8" strokeWidth="0.8" strokeLinecap="round" />
        </svg>
      </span>
      <span className="butterfly__perch block">
        {(["left", "right", "body"] as const).map((part) => (
          // eslint-disable-next-line @next/next/no-img-element -- painted cursor layer
          <img
            key={part}
            src={`/assets/garden/butterfly/butterfly-${part}.webp`}
            alt=""
            draggable={false}
            className={`butterfly__${part}`}
            onLoad={part === "body" ? () => setReady(true) : undefined}
            onError={() => setEnabled(false)}
          />
        ))}
      </span>
    </div>,
    document.body,
  );
}
