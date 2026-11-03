# Landing garden: one tall painting

Checkpoints: `landing-v1-checkpoint` (four-page Landing), `landing-v2-checkpoint` (zoom-based Landing before this one).

The Landing is **one continuous painting, 1600 × 4000 units, that the visitor travels down**. Distant pink sky and
hills are at the top. Further down, the hills come closer, the brushwork gets bigger, and the flowers grow larger.
The path winds from the horizon to the visitor's feet and ends under a rose arch. Moving down therefore reads as
walking forward into the garden, the same idea as the Zilin reference, which pans down one tall painting.

The artwork on screen today is a **code-drawn placeholder**, not the final watercolor. Each layer can be swapped for
a painting in `src/data/landingArt.ts` without touching the code.

## How it moves

- A sticky full-viewport stage holds the painting, and normal page scrolling drives it. There is no snapping and no
  scroll-jacking. The painting moves 0.75 px for each pixel scrolled.
- The painting is scaled to cover the viewport. One unit is `max(100vw / 1600, 100svh / 1000)`, so every screen
  shows at most 1000 units of height. Phones crop the sides around the central path.
- Layers drift a few percent against each other. Each layer lines up exactly at its anchor point, and every land layer
  is painted all the way down to the bottom, so no gaps can open. Drift is halved on phones and switched off with
  reduced motion; with reduced motion the painting simply scrolls as one still picture.

## Layers (back to front)

All files cover the whole artboard: export them at **3200 × 8000 px**, transparent except the sky.

| Slot | Contents | Drift | Lined up at |
| --- | --- | --- | --- |
| `sky` | Pink to peach sky and clouds (0–700), any ground colour below | −8% | top |
| `farHills` | Lavender and grey-sage ranges, ridges about 530–620 | −4% | top |
| `midground` | Seven rolling bands from 668 to 2200, each lit on its crest and shaded at its foot; trees; the tilled seedbed (around x 420, y 1400); the path from 650 to 2900 | 0 | everywhere |
| `nearMeadow` | Four closer bands from 2360; the path widening; the daisy cluster (x 1040–1460, y 2390–2520) | +3% | 55% |
| `foreground` | Tall grass and large flowers at both sides; the rose arch over the path (3420–4000) with warm light | +6% | the end |
| `sideSprigs` | Leaf sprays along the left and right edges | +10% | the middle |

Paint the whole thing as **one painting**, then separate it into layers, so the brushwork and light match everywhere.
Keep the path inside the central 40% of the width, because that is all a phone shows. Paint some extra ground above
each layer's top edge. Leave calm areas where the notes sit: left at y ≈ 1170, right at y ≈ 2130, left at y ≈ 2740.

## Timeline (scroll progress)

| Progress | View (painting units, desktop) | What the visitor sees |
| --- | --- | --- |
| 0% | 0–1000 | Sky, title, "Scroll to Wander", distant hills, the path starting at the horizon |
| 25% | ≈ 750–1750 | The sky has gone; rolling hills, trees; "Every idea starts as a little seed." on the left above the seedbed |
| 50% | ≈ 1500–2500 | Nearer hills, more flowers; "I find inspiration in the little things." on the right above the daisies |
| 75% | ≈ 2250–3250 | Close meadow, wide path; "Design is how I turn observations into experiences." on the left |
| 100% | 3000–4000 | The rose arch with warm light; "Come see what I've been growing." and Explore My Work |

Notes are written in word by word as they reach the lower three quarters of the screen. The copy is in
`src/data/site.ts` → `landingScenes`.

## Still needed

- The painted layers above, which replace the placeholder.
- Optional: lettering in your own handwriting (images or a font), in place of Caveat.
