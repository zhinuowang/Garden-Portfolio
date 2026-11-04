# Landing: three scenes of one tall painting

Checkpoints of earlier Landing versions: `landing-v1-checkpoint` … `landing-v4-checkpoint` (the last is the first
three-scene version, before the living garden, the tea scene and the impasto).

## Structure

The Landing is **one tall garden painting**, sliced into three scenes and stacked edge to edge in normal page flow.
Scrolling simply moves down the painting. There is no sticky stage, no zoom, no parallax, no snapping, and no
crossfade. Because the files are slices of one picture, the joins are seamless.

| Scene | Character | Text (real HTML, `src/data/site.ts` → `landingScenes`) | What the painting holds |
| --- | --- | --- | --- |
| 1 · A living garden | Peaceful, lived-in, early autumn | **A Garden of Ideas** only, centred in the first view | Pink sunset sky (quiet behind the title), lavender hills, a cream cottage with a terracotta roof and warm windows, golden autumn trees, three small dogs playing with a ball, the path leaving the cottage door, shrubs, wildflowers, a few fallen leaves |
| 2 · Thoughts on the hills | Reflective | The three thoughts as handwritten notes, each laid along a different slope (right, left, right) and tilted to follow it | Overlapping rounded hills, the winding path, the pink flowering shrub, the daisy and cosmos clusters (unchanged from the previous version) |
| 3 · Afternoon tea | Cosy destination | "Come see what I've been growing." at the top right; the hanging wooden sign **Explore My Work** (→ `/work`) | A shade tree turning gold; a round table with a pink gingham cloth, teapot, cups, a cake stand, fruit and a small vase; a wrought-iron chair; flowers around the table; the path ending at a little garden gate in a hedge, with warm light beyond; the sign's post and arm above the gate |

Light is consistent throughout: a low sun beyond the hills, light from the upper left, warm rims, cool shadowed feet,
and soft cast shadows under every object.

## Paint body (impasto)

Every mark also builds a hidden **height map**:
- **Bristles** leave ridges.
- **Strokes** have slightly raised edges.
- **Palette-knife slabs** leave a raised lip where the knife lifted.
- **Dabs** are domed.

At the end the relief is lit from the upper left, so thick paint catches small highlights and casts small shadows.

How thick the paint is depends on where it sits:

| Where | Paint |
| --- | --- |
| Sky, distant ranges | Thin; the canvas weave shows through |
| Cloud edges, middle hills | A little body |
| Near hills | Thicker toward the viewer, heaviest just under each lit crest, with occasional knife marks |
| Path | Gravel heaped at the edges |
| Focal objects: cottage, trees, shrubs, dogs, tablecloth folds, cakes, fruit, flowers, the sign | Thickest |
| Behind the title and notes | Deliberately thinned |

## Files

All files are in `public/assets/garden/landing/`.

| File | Size | Notes |
| --- | --- | --- |
| `scene-N-desktop-{2400,1600}.webp` | 2400 × 1800 per scene | Landscape composition (viewport wider than 3:4) |
| `scene-N-mobile-{1080,720}.webp` | 1080 × 2340 per scene | Portrait recomposition (phones, portrait tablets) |
| `sign.webp` | 760 × 470, transparent | The hanging board with ropes; the lettering is HTML on top |
| `sign-flower.webp` | 200 × 200, transparent | The flower that nods when the sign is hovered or focused |

**Where the text goes.** `src/data/landing-anchors.json` holds, for each composition:
- where each scene-2 note sits on its slope, and its tilt;
- where the sign hangs.

The painting script writes this file, so the text always matches the painted hills.

**Hand-painted replacements.** If you replace the art by hand:
- Keep the same file names and sizes.
- Keep the calm areas: the title at the centre of the first view; the note positions in the anchors file; the
  invitation at the top right of scene 3.
- Edit the anchors file if the slopes move.

## The sign

`Explore My Work` is a real link: an `<a href="/work">` wrapping the painted board, with real text on it.
- **On hover or keyboard focus:** the board sways on its ropes, brightens slightly, and its flower nods.
- **Keyboard focus** also shows a visible outline.
- **With reduced motion:** the board doesn't sway, but the brightening and the flower still respond.

## Interim artwork

The current files are **interim**, rendered by `scripts/paint-landing.mjs`:

```bash
node scripts/paint-landing.mjs
```

They are original decorative artwork, not project work. They are much richer than the earlier vector garden, but they
are still procedural. Hand-painted artwork made to this spec will look better still.
