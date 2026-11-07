"use client";

import { useSyncExternalStore } from "react";

// Night in the garden: a single flag on <html> (data-night="1"), remembered in
// localStorage so the Work garden and the case studies stay in the same mood.
// Only pages that opt in with the `nightable` class change their colours
// (see globals.css); the inline script in layout.tsx restores it before paint.

import { NIGHT_KEY } from "./night-boot";

export { NIGHT_KEY };
const EVENT = "garden-night";

export const isNight = () => typeof document !== "undefined" && document.documentElement.dataset.night === "1";

export function setNight(on: boolean) {
  const html = document.documentElement;
  if (on) html.dataset.night = "1";
  else delete html.dataset.night;
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

export function useNight() {
  return useSyncExternalStore(subscribe, isNight, () => false);
}
