"use client";

import { useSyncExternalStore } from "react";
import { NIGHT_KEY } from "./night-boot";

export { NIGHT_KEY };

// Night in the garden is three flags on <html>, set on one short timeline so the
// change reads as a single continuous dusk rather than everything at once:
//   data-lamp       the lantern lights (and goes out last on the way back)
//   data-night      the painted scenes cross-fade to their moonlit versions
//   data-night-ink  the page's text palette turns to moonlit cream, and the
//                   Landing cursor becomes a firefly (mid-way, once it is dusk)
// Only opacity, transform and colour change during the fade: the night artwork
// is pre-painted (scripts/night-grade.mjs) and already loaded by then. Pages that
// opt in with the `nightable` class follow the mood; it is remembered in
// localStorage and restored before first paint (night-boot.ts).

const EVENT = "garden-night";
const timers: number[] = [];
/** The mood the visitor last chose; null until they choose (then the flags on <html> are the truth). */
let chosen: boolean | null = null;

export const isNight = () => typeof document !== "undefined" && document.documentElement.dataset.night === "1";

export function setNight(on: boolean) {
  chosen = on;
  const html = document.documentElement;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  timers.splice(0).forEach((t) => clearTimeout(t));
  const at = (ms: number, fn: () => void) => (calm ? fn() : timers.push(window.setTimeout(fn, ms)));
  const flag = (name: "lamp" | "night" | "nightInk", v: boolean) => (v ? (html.dataset[name] = "1") : delete html.dataset[name]);
  if (on) {
    flag("lamp", true); // the lamp first…
    at(150, () => flag("night", true)); // …then the garden slowly turns to dusk…
    at(1000, () => flag("nightInk", true)); // …and the page's ink follows once it is dusk
  } else {
    flag("night", false);
    at(900, () => flag("nightInk", false));
    at(1500, () => flag("lamp", false)); // the lantern goes out as the day returns
  }
  try {
    localStorage.setItem(NIGHT_KEY, on ? "1" : "0");
  } catch {
    /* private mode: the mood just won't be remembered */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Whether night is the chosen mood (true from the click, before the fade completes; false likewise). */
export function useNight() {
  return useSyncExternalStore(subscribe, () => chosen ?? isNight(), () => false);
}
