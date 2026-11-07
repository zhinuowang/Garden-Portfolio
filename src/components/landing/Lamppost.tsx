"use client";

import { setNight, useNight } from "@/components/night/night";

// The secret path into night: a traditional iron streetlamp standing in front of
// the cottage, to the left of the fountain (scripts/paint-landing.mjs --lamp).
// Pointing at it brightens the glass, warms a halo round the lantern and writes
// a small hint beside it ("Light up the garden ✦"); clicking it lights the lamp
// and the garden turns to a quiet moonlit night (see night.ts). Click again to
// return to daylight. The button's hit area reaches a little beyond the lamp.

export default function Lamppost() {
  const night = useNight();
  const hint = night ? "Return to daylight ✦" : "Light up the garden ✦";
  return (
    <button
      type="button"
      onClick={() => setNight(!night)}
      aria-pressed={night}
      aria-label={night ? "Return to daylight" : "Light up the garden"}
      className="lamppost group absolute -translate-x-1/2 -translate-y-full left-[19.5%] top-[64%] w-[4.8%] portrait-art:left-[11%] portrait-art:top-[75%] portrait-art:w-[7.5%]"
    >
      <span aria-hidden="true" className="lamppost__pool" />
      <span aria-hidden="true" className="lamppost__glow" />
      {/* eslint-disable-next-line @next/next/no-img-element -- painted lamppost */}
      <img src="/assets/garden/lamp/lamp-off.webp" alt="" width={220} height={820} draggable={false} className="lamppost__off relative block h-auto w-full select-none" />
      {/* eslint-disable-next-line @next/next/no-img-element -- the same lamppost, lantern lit */}
      <img src="/assets/garden/lamp/lamp-lit.webp" alt="" width={220} height={820} draggable={false} className="lamppost__lit absolute inset-0 block h-auto w-full select-none" />
      <span aria-hidden="true" className="lamppost__hint">{hint}</span>
    </button>
  );
}
