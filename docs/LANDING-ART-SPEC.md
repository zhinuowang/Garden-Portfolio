# Landing: three scenes of one tall painting

Checkpoints of earlier Landing versions: `landing-v1-checkpoint` … `landing-v6-checkpoint` (v6 is the version before
the chapter pacing, the living layers and the edge-following notes).

## Structure

The Landing is **one tall garden painting**, sliced into three scenes and stacked edge to edge in normal page flow.
Scrolling simply moves down the painting. There is no sticky stage, no zoom, no parallax, no snapping, and no
crossfade. Because the files are slices of one picture, the joins are seamless.

| Scene | Character | Text (real HTML, `src/data/site.ts` → `landingScenes`) | What the painting holds |
| --- | --- | --- | --- |
| 1 · A living garden | Peaceful, lived-in, early autumn | **A Garden of Ideas** only, centred in the first view | A smaller pink sky (the horizon is at about 45% of the scene) and lavender hills behind the title. Below: a cream cottage with a white picket fence, four autumn trees, three small dogs with a ball, shrubs, the path edged with flowers, meadow flowers, fallen leaves, and grass and flowers in both bottom corners |
| 2 · Thoughts on the hills | Reflective | The three thoughts as cream handwritten SVG text resting on real hill edges: each baseline is a painted hill's crest line, so the words sit in the shaded hollow just above it, with a soft dark halo. The words appear one after another as the scene arrives and are complete when it settles | Overlapping rounded hills, the winding path, the pink flowering shrub, the daisy and cosmos clusters (unchanged from the previous version) |
| 3 · Afternoon tea | Cosy destination | "Come see what I've been growing." at the top right; the hanging wooden sign **Explore My Work** (→ `/work`) | A shade tree turning gold; a round table with a pink gingham cloth, teapot, cups, a cake stand, fruit and a small vase; a cream-painted wooden rocking chair with a gingham cushion; flowers around the table; the path ending at a little garden gate in a hedge, with warm light beyond; the sign's post and arm above the gate |

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
| `sprites/{desktop,mobile}-*.webp` | Transparent | The living layers (dogs, tails, ball, grass tufts, rocking chair) |

**Where the text goes.** `src/data/landing-anchors.json` holds, for each composition:
- the curve each line of each scene-2 note follows (SVG paths in scene pixels), measured from the painted hills
  with the tilt limited and the bend softened so the letters never warp;
- where the sign hangs.

The painting script writes this file, so the text always matches the painted hills.

**Hand-painted replacements.** If you replace the art by hand:
- Keep the same file names and sizes.
- Keep the calm areas: the title at the centre of the first view; the note positions in the anchors file; the
  invitation at the top right of scene 3.
- Edit the anchors file if the slopes move.

## Pacing: three chapters

Scrolling is native. Only after the visitor stops between two scenes does the page glide to one of them
(`SceneSettle`):
- A nudge under about 8% of the way settles back, which gives a gentle resistance.
- More than that carries on to the next scene, so one wheel notch moves one scene and never two.
- Past the last scene's start the page is free, so the footer can be reached.
- It's off with reduced motion.

CSS scroll snapping was tried first:
- Proximity left the page resting between scenes.
- Mandatory got stuck or skipped scenes, because each painting is slightly taller than the screen.

## Living layers

These are painted onto their own transparent layers in `public/assets/garden/landing/sprites/`. They are **not**
painted into the scene images, so they can move without leaving a copy behind. Their positions and pivots are in
`landing-anchors.json` → `sprites`.

| Layer | Behaviour |
| --- | --- |
| Three dogs (body + tail each) and the ball | Hovering over the group (or tapping it) plays one 2.6 s sequence: the tan dog trots toward the white one, the white dog bows and hops, the dark dog hops twice, the tails wag and the ball pops up. It won't restart until the pointer has left |
| Grass tufts (10 in scene 1, 6 in scene 2) | Bend toward the cursor's direction of travel, more strongly when closer and faster, then spring back to rest. Each tuft has its own stiffness and is anchored at its base |
| Rocking chair (scene 3, desktop) | Hover or tap: it rocks about the centre of its runners' curve (−4.5°, +3.2°, −2°, +1.1°, −0.5°) and settles in 3 s |

With reduced motion, none of these move. Touch: tapping starts the dogs or the chair and stirs nearby grass.

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
