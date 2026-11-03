# Landing garden: composition and painted-art spec

The Landing page is one continuous garden. The visitor never leaves it. Scrolling moves a camera slowly forward
along a winding path, and four short statements appear along the way. The artwork on screen today is a
**code-drawn placeholder**, not the final watercolor. Each layer can be swapped for a painting without touching code.

## Composition

One scene, painted on a 1600 × 1000 artboard (16:10). Everything is anchored to the bottom edge, so wider screens
crop the sky and narrower screens crop the sides. Keep the important things inside the **central 40%** of the
width: the path, the horizon glow, and the clearest flowers. On a phone that band is all that shows.

```
 0% ┌──────────────────────────────────────────────┐
    │  sky: pink at the top, peach toward the horizon│  Title, Moments 2–4 sit here.
    │      soft clouds                               │  Keep this area calm.
    │  [Moment 2 · left]          [Moment 3 · right] │
55% │~~~~~~~~~~ distant lavender / sage ranges ~~~~~~│
63% │~~~~~ rolling green hills, hedgerows, trees ~~~~│
    │                    ╲ path ╱                    │
72% │~~~~~~~~ wildflower meadow, path widens ~~~~~~~~│
    │ foreground left     ╲     ╱     foreground right│
100%└──────────────────────────────────────────────┘
```

## Layers (back to front)

| Slot (`src/data/landingArt.ts`) | Painted file | Contents | Movement over the whole scroll |
| --- | --- | --- | --- |
| `sky` | 3200×2000, opaque | Pink and peach wash, faint watercolor blooms | Grows 3%; warms toward gold |
| `clouds` | 3200×2000, transparent | Soft pink and apricot clouds | Drifts sideways, rises 6% |
| `farHills` | 3200×2000, transparent | Lavender and grey-sage ranges, ridge 55–61% | Grows 9% |
| `midground` | 3200×2000, transparent | Rolling green hills, hedges, tree clumps, far end of the path, ridge 63–67% | Grows 26% |
| `meadow` | 3200×2000, transparent | Near meadow with wildflowers, near end of the path, ridge 71–74% | Grows 58% (passes below the frame) |
| `flowerBed` | 3200×800, transparent | Tall grass and big flowers along the bottom edge, path gap in the centre | Rises in for Moments 3–4 |
| `foregroundLeft` | 1200×1600, transparent | Grass, leaves and stems framing the bottom-left | Rises, then parts outward at the end |
| `foregroundRight` | 1200×1600, transparent | Same for the bottom-right; not a mirror of the left | Rises, then parts outward at the end |

All layers grow toward one vanishing point (centre, 62% down), so the scene feels like walking forward rather than
sliding. On phones every movement is reduced to 55%. With reduced motion turned on, nothing moves and the text only
fades.

**Paint all layers as one painting**, then separate it. The brushwork, palette and light must match across layers.
Paint a little extra beneath each ridge, because the layer in front moves and can uncover it. Export as WebP or PNG
with transparency, at 2× the artboard size shown above.

## Narrative moments (scroll progress 0 → 1)

| Progress | Moment | Text placement | What the garden does |
| --- | --- | --- | --- |
| 0 – 0.12 | 1 · Arrival | Centre, in the sky | Still, the full scene |
| 0.18 – 0.42 | 2 · A little seed | Left edge, in the sky | Camera moves along the path |
| 0.46 – 0.70 | 3 · Philosophy | Right edge, in the sky | Flower bed rises; foreground fuller |
| 0.76 – 1 | 4 · Invitation + Explore My Work | Centre | Foreground parts; warm light at the path's end |

The copy lives in `src/data/site.ts` → `landingScenes`.
