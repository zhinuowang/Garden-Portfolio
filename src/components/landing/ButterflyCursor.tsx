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
        <svg viewBox="0 0 20 30" className="firefly__bug">
          <ellipse className="firefly__wing firefly__wing--l" cx="6" cy="10" rx="5" ry="7.5" />
          <ellipse className="firefly__wing firefly__wing--r" cx="14" cy="10" rx="5" ry="7.5" />
          <ellipse cx="10" cy="11" rx="3" ry="6" fill="#3a3320" />
          <circle cx="10" cy="3.6" r="2.6" fill="#2a2416" />
          <ellipse className="firefly__tail" cx="10" cy="21" rx="4" ry="6" />
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
