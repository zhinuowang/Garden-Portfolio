// The Landing painting (Category A, decorative only — never project work).
// One tall garden painted as a single piece and sliced into three scenes, so
// the joins are seamless. Two compositions: landscape (desktop) and portrait
// (phones and portrait tablets), each three slices of the same painting.
//
// INTERIM ARTWORK: the current files are rendered by scripts/paint-landing.mjs
// (`node scripts/paint-landing.mjs`). To use hand-painted artwork, export files
// with the same names and sizes into public/assets/garden/landing/ — no code
// changes needed. Spec: docs/LANDING-ART-SPEC.md.

const dir = "/assets/garden/landing";

export const landingArt = {
  interim: true,
  desktop: { width: 2400, height: 1800, sizes: [1600, 2400] },
  portrait: { width: 1080, height: 2340, sizes: [720, 1080] },
  /** Viewports at or narrower than this aspect ratio get the portrait composition. */
  portraitQuery: "(max-aspect-ratio: 3/4)",
  src: (scene: 1 | 2 | 3, format: "desktop" | "mobile", width: number) => `${dir}/scene-${scene}-${format}-${width}.webp`,
};
