"use client";

import { useSyncExternalStore } from "react";
import { HTML_LANG, LOCALE_KEY, type Locale } from "./boot";

export type { Locale };

// The visitor's language: English by default, 中文 when chosen. It lives on <html> (`lang` and `data-locale`),
// is remembered in localStorage and restored before first paint (boot.ts). Switching only re-renders text: no
// page reload, no route change, so the garden's animations and the music carry on.

const EVENT = "garden-locale";

const read = (): Locale => (document.documentElement.dataset.locale === "zh" ? "zh" : "en");

export function setLocale(locale: Locale) {
  const html = document.documentElement;
  html.lang = HTML_LANG[locale];
  if (locale === "zh") html.dataset.locale = "zh";
  else delete html.dataset.locale;
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    /* private mode: the choice just won't be remembered */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

/** The current language. The server always renders English; the client switches right after hydration. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, read, () => "en");
}
