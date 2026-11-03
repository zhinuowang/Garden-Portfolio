// Painted artwork slots for the Landing garden (Category A, decorative only —
// never project work). The Landing is one tall painting, 1600 × 4000 units, that
// the visitor travels down. Each slot is null until the real painting exists;
// while it is null the code-drawn placeholder for that layer is shown instead.
// Every file covers the WHOLE tall artboard (export at 3200 × 8000 px, transparent
// except the sky) so layers line up. Put files in public/assets/garden/landing/
// and their paths here, e.g. "/assets/garden/landing/sky.webp".
// Full spec: docs/LANDING-ART-SPEC.md.

export type LandingArtSlot = "sky" | "farHills" | "midground" | "nearMeadow" | "foreground" | "sideSprigs";

export const landingArt: Record<LandingArtSlot, string | null> = {
  sky: null, //        opaque; sky 0–1000, then any ground colour below
  farHills: null, //   distant ranges, ridges ≈ 560–640
  midground: null, //  rolling hills, trees, the path and seedbed, 660 → 4000
  nearMeadow: null, // closer meadow and the daisy cluster, 2350 → 4000
  foreground: null, // grass, big flowers and the garden arch, 3150 → 4000
  sideSprigs: null, // leaves along the left and right edges, whole height
};
