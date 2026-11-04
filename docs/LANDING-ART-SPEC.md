# Landing: three scenes of one tall painting

Checkpoints of earlier Landing versions: `landing-v1-checkpoint`, `landing-v2-checkpoint`, `landing-v3-checkpoint`
(the last one is the code-drawn "tall painting" version this replaces).

## Structure

The Landing is **one tall garden painting**, sliced into three scenes and stacked edge to edge in normal page flow.
Scrolling simply moves down the painting. There is no sticky stage, no zoom, no parallax, no snapping, and no
crossfade. Because the three files are slices of one picture, the joins are seamless by construction.

| Scene | Purpose | Text (real HTML, `src/data/site.ts` → `landingScenes`) | Focal point in the painting |
| --- | --- | --- | --- |
| 1 · The beginning | First impression | **A Garden of Ideas** only, upper centre | Pink and peach sunset sky, the sun low behind lavender hills, a lone tree; the path begins on the first hill |
| 2 · My thoughts | Three short thoughts | The three lines as a stanza, upper left | Overlapping rounded hills, a pink flowering shrub on the right, daisy and cosmos clusters, the path winding through |
| 3 · Enter my work | Invitation and CTA | "Come see what I've been growing." at the top; **Explore My Work** (→ `/work`) stands in the light under the arch | A rose arch over the path with warm light beyond it, flower beds, lavender, bushes, tall foreground grass |

Light is consistent throughout: a low sunset sun beyond the hills in scene 1. Crests are rim-lit warm, the faces of
the hills turn cooler and darker toward their feet, and each nearer hill's lit crest overlaps the shaded foot of the
one behind it. Distant forms are softer, hazier and use smaller marks; near forms have bigger brushwork, darker
shadows and crisper flowers.

## Files

Put them in `public/assets/garden/landing/`. Use the same names to replace the art; no code changes are needed.

| Composition | Used when | Slice size (W × H) | Files per scene |
| --- | --- | --- | --- |
| Landscape | Viewport wider than 3:4 | 2400 × 1800 (4:3) | `scene-N-desktop-2400.webp`, `scene-N-desktop-1600.webp` |
| Portrait | Viewport 3:4 or narrower (phones, portrait tablets) | 1080 × 2340 (6:13) | `scene-N-mobile-1080.webp`, `scene-N-mobile-720.webp` |

- Paint each composition as **one canvas**: landscape 2400 × 5400, portrait 1080 × 7020, at 2× that size if possible.
  Then cut it into three equal slices. Never paint the scenes separately.
- The portrait version is a recomposition, not a crop. Focal points move toward the centre, the path is narrower,
  and the text areas span the width.
- No transparent layers are required. Optional later: a transparent foreground-grass overlay for scene 3, to add
  subtle depth.

## Calm areas the painting must leave for the text

Fractions are of a scene's width and height.

| Text | Landscape | Portrait |
| --- | --- | --- |
| Title (scene 1) | x 0.15–0.85, y 0.05–0.25 | x 0.05–0.95, y 0.07–0.25 |
| Thoughts (scene 2) | x 0.04–0.50, y 0.05–0.35 | x 0.05–0.95, y 0.08–0.38 |
| Invitation (scene 3) | x 0.18–0.82, y 0.03–0.16 | x 0.05–0.95, y 0.08–0.2 |
| CTA (scene 3) | centred, y ≈ 0.54, inside the arch's light | centred, y ≈ 0.52 |

## Interim artwork

The current files are **interim**. `scripts/paint-landing.mjs` renders them: it lays down watercolor washes, then
opaque oil-style bristle strokes that follow each hill's contour, a wet-into-wet blending pass, deliberately placed
flower clusters, warm light, and a canvas texture. Re-render with:

```bash
node scripts/paint-landing.mjs
```

They are original decorative artwork, not project work. They are much richer than the earlier vector garden, but
they are still procedural. Hand-painted (or carefully art-directed) artwork made to this spec will look better still.
