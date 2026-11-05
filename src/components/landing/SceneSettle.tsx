"use client";

import { useEffect } from "react";

/**
 * Chapter pacing for the Landing. Scrolling stays completely native (no wheel
 * interception, nothing locked); only once the visitor STOPS between two scene
 * starts does the page glide to one of them:
 * - a small nudge (< 8% of the way, less than one wheel notch) settles back:
 *   a gentle resistance;
 * - anything more carries on to the next scene in the direction of travel.
 * Past the last scene's start the page is free, so the footer is reachable.
 * Native CSS snapping was tried first: proximity left the page resting between
 * scenes, and mandatory trapped or skipped scenes because each painting is a
 * little taller than the screen. Off for reduced motion.
 */
export default function SceneSettle() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scenes = () => Array.from(document.querySelectorAll<HTMLElement>(".landing-scenes > section")).map((s) => Math.round(s.getBoundingClientRect().top + window.scrollY));
    const hasScrollEnd = "onscrollend" in window;
    let startY = window.scrollY, lastY = window.scrollY, idle = true, target: number | null = null, timer = 0;

    const settle = () => {
      idle = true;
      const y = window.scrollY;
      if (target !== null && Math.abs(y - target) < 4) { target = null; startY = y; return; } // our own glide arrived
      target = null;
      const starts = scenes();
      const dir = Math.sign(y - startY);
      startY = y;
      if (!dir || y >= starts[starts.length - 1] - 2) return; // no movement, or free past the last scene's start
      let k = 0;
      while (k < starts.length - 2 && y >= starts[k + 1]) k++;
      const a = starts[k], b = starts[k + 1];
      if (y <= a + 2 || y >= b - 2) return; // already resting at a scene
      const frac = (y - a) / (b - a);
      const to = dir > 0 ? (frac > 0.08 ? b : a) : frac < 0.92 ? a : b;
      target = to;
      window.scrollTo({ top: to, behavior: "smooth" });
    };

    const onScroll = () => {
      if (idle) { startY = lastY; idle = false; }
      lastY = window.scrollY;
      if (!hasScrollEnd) {
        clearTimeout(timer);
        timer = window.setTimeout(settle, 140);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", settle);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", settle);
      clearTimeout(timer);
    };
  }, []);
  return null;
}
