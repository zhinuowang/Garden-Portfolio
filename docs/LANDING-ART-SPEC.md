# Landing: three scenes of one tall painting

Checkpoints of earlier Landing versions: `landing-v1-checkpoint` … `landing-v9-checkpoint` (v9 is the version before
the Scene 1 clean-up, the closer fountain, the tidied tabletop and the unobstructed chair).

## Structure

The Landing is **one tall garden painting**, sliced into three scenes and stacked edge to edge in normal page flow.
Scrolling simply moves down the painting. There is no sticky stage, no zoom, no parallax, no snapping, and no
crossfade. Because the files are slices of one picture, the joins are seamless.

| Scene | Character | Text (real HTML, `src/data/site.ts` → `landingScenes`) | What the painting holds |
| --- | --- | --- | --- |
| 1 · A living garden | Peaceful, lived-in, early autumn | **A Garden of Ideas** only, centred in the first view | Composed for the first view on real screens, which shows only the top ~72% of the scene (1280×690, 1440×790 with browser toolbars): sky behind the title to ~0.42, then the cottage, trees, path and all three dogs above ~0.68, and meadow and flowers below. Below: a cream cottage with a white picket fence, four autumn trees, three small dogs with a ball, shrubs, the path edged with flowers, meadow flowers, fallen leaves, and grass and flowers in both bottom corners |
| 2 · Thoughts on the hills | Reflective | The three thoughts as cream handwritten SVG text resting on real hill edges: each baseline is a painted hill's crest line, so the words sit in the shaded hollow just above it, with a soft dark halo. Hidden until the visitor scrolls into the scene; then each thought is written in word by word, in turn (at least 0.8 s apart), and they hide again if the visitor scrolls back above the scene | Overlapping rounded hills, the winding path, the pink flowering shrub, the daisy and cosmos clusters (unchanged from the previous version) |
| 3 · Afternoon tea | Cosy destination | "Come see what I've been growing." at the top right; the hanging wooden sign **Explore My Work** (→ `/work`) | A shade tree turning gold; a round table with a pink gingham cloth: the cake stand at the back left, the teapot in the middle, the vase of flowers at the back right, and the cups and fruit in front, each painted back to front; a cream-painted wooden rocking chair with a gingham cushion; flowers around the table; the path ending at a little garden gate in a hedge, with warm light beyond; the sign's post and arm above the gate |

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
- A scene taller than the screen can be looked at freely from its top to its bottom.
- Past that, a nudge under about 8% of the way settles back, which gives a gentle resistance.
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
| Windmill sails (scene 1) | The Work page's windmill, repainted with the landing brushes, small in the distance to the right of the title. Hovering it makes the sails gather speed to about one turn every 5 s; afterwards they coast to a stop |
| Fountain water (scene 1) | The Work page's two-tier fountain, repainted, in the left middle ground beside the path (closer and larger than before). Hovering it makes water flow: two brush takes of the falling streams cross-fade and a few drops fall from the bowl. When the pointer leaves, the water fades away over about 1.4 s |
| Grass clumps and leafy sprigs (scene 2 only; scene 1 has none) | Each is anchored at its root. A passing cursor bends nearby plants the way it travels and pushes them slightly away, by about 9° at a slow 400 px/s and up to 16° fast, fading with distance (a reach of about 170 px). They spring back to rest. Sprigs are softer than grass, so their leaves follow a beat later |
| Rocking chair (scene 3, desktop) | Stands on the open grass above and behind the tea table, clear of it (the table is its own layer). Seen from the side. Hover or tap: it tilts forward and back about the point where its runners touch the ground (−4°, +3°, −1.9°, +1.1°, −0.45°) and settles in 3 s, without sliding |

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
