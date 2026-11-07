"use client";

import { setNight, useNight } from "@/components/night/night";

// The secret path into night: a painted lamppost by the cottage's garden fence
// (scripts/paint-landing.mjs --lamp). Click it and the lantern lights, the
// garden slowly turns to a quiet moonlit night, and the mood is remembered on
// the Work garden and the case studies. Click again to put it out.

export default function Lamppost() {
  const night = useNight();
  return (
    <button
      type="button"
      onClick={() => setNight(!night)}
      aria-pressed={night}
      aria-label={night ? "Put out the lamp and return to day" : "Light the lamp"}
      className="lamppost absolute -translate-x-1/2 -translate-y-full left-[30.5%] top-[51%] w-[3.4%] portrait-art:left-[57.5%] portrait-art:top-[72%] portrait-art:w-[7%]"
    >
      <span aria-hidden="true" className="lamppost__pool" />
      <span aria-hidden="true" className="lamppost__glow" />
      {/* eslint-disable-next-line @next/next/no-img-element -- painted lamppost */}
      <img src="/assets/garden/lamp/lamp-off.webp" alt="" width={180} height={560} draggable={false} className="relative block h-auto w-full select-none" />
      {/* eslint-disable-next-line @next/next/no-img-element -- the same lamppost, lantern lit */}
      <img src="/assets/garden/lamp/lamp-lit.webp" alt="" width={180} height={560} draggable={false} className="lamppost__lit absolute inset-0 block h-auto w-full select-none" />
    </button>
  );
}
