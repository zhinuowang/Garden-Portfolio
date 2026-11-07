"use client";

import { setNight, useNight } from "./night";

/** A small lantern in the header, shown only at night, to return to day from any page. */
export default function NightSwitch() {
  const night = useNight();
  if (!night) return null;
  return (
    <button
      type="button"
      onClick={() => setNight(false)}
      className="night-switch inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink transition hover:bg-paper"
      aria-label="Put out the lamp and return to day"
    >
      <svg viewBox="0 0 16 22" className="h-4 w-3" aria-hidden="true">
        <path d="M8 1 L13 6 H3 Z" fill="currentColor" />
        <rect x="4" y="6" width="8" height="9" rx="1.2" fill="#ffd98a" stroke="currentColor" strokeWidth="1.4" />
        <rect x="7.2" y="15" width="1.6" height="6" fill="currentColor" />
      </svg>
      Day
    </button>
  );
}
