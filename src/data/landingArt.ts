// Painted artwork slots for the Landing garden (Category A, decorative only —
// never project work). Each slot is null until the real painting exists; while
// it is null the code-drawn placeholder for that layer is shown instead.
// Drop the finished file into public/assets/garden/landing/ and put its path
// here, e.g. "/assets/garden/landing/sky.webp". Full spec: docs/LANDING-ART-SPEC.md.

export type LandingArtSlot = "sky" | "clouds" | "farHills" | "midground" | "meadow" | "flowerBed" | "foregroundLeft" | "foregroundRight";

export const landingArt: Record<LandingArtSlot, string | null> = {
  sky: null, //            3200×2000, opaque
  clouds: null, //         3200×2000, transparent
  farHills: null, //       3200×2000, transparent, ridge ≈ 55–61% down
  midground: null, //      3200×2000, transparent, ridge ≈ 63–67% down
  meadow: null, //         3200×2000, transparent, ridge ≈ 71–74% down
  flowerBed: null, //      3200×800,  transparent, sits on the bottom edge
  foregroundLeft: null, // 1200×1600, transparent, anchored bottom-left
  foregroundRight: null, //1200×1600, transparent, anchored bottom-right
};
