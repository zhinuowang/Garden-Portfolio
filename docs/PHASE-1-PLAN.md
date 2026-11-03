# A Garden of Ideas — Phase 1 plan

Written 3 November 2026 after reviewing:
- `Desktop/Portofolio/个人作品集.pdf` (6 pages: About Me + four projects)
- the three landscape references shared in chat (oil-painted ridge path, pink watercolor valley, top-down
  grass with daisies)
- the screen recording `录屏2026-11-03 下午12.31.35.mov` (a Xiaohongshu video showing two personal sites: a
  tea-party table where "Click a Cup" opens projects and a teapot returns home, and a hand-drawn desk scene)

## 1. Art direction

One painted world that reads like a single landscape painting:

| From | What we keep |
| --- | --- |
| Reference 1 (oil) | Pink and peach sunset sky, a pale path winding over a green ridge, a dense foreground of wildflowers with visible daubs, deep teal shadow on the slope |
| Reference 2 (watercolor) | Hazy lavender and sage distance, soft hedgerows, washes that bleed into each other, muted harmony |
| Reference 3 (top-down) | Simple rounded land masses, sparse little white daisies, lots of calm negative space |

Palette tokens in `src/app/globals.css`: cream `#F6F1E5`, sage `#A4B68C`, forest `#40583C`, blush `#E9AFAB`,
peach `#F2B8A0`, honey `#E3BF73`, plus a warmer sky pink, a lavender haze and an olive meadow taken
from the references. Fraunces for headings (soft optical axis), DM Sans for body.

From the recording we take the **philosophy, not the look**: the scene is the navigation, objects are the
entry points, and a "back" landmark returns you home. No tea-party, patchwork or stripes.

## 2. Homepage layout

1. **Garden Gate**: full-screen sunset sky over rolling hills with a ridge path. The name, title, subtitle,
   descriptor and both CTAs sit in clear sky. Nothing animates before you can read or click.
2. **Garden Overview + Exploration**: one 16:9 painted panorama. A cream path winds up the middle.
   - **Left: The Creative Corner (Personal Projects).** Warmer olive meadow, a blush wash, peach, rose and
     cream flowers.
   - **Right: The Growing Grounds (Academic Projects).** Cooler sage, a broad open hill rising to the
     windmill, white, honey and lavender flowers.
   - The boundary is the path plus the change in colour and vegetation, not a hard line. Region titles are
     painted into each side of the sky.
3. **Selected Work**: Little Moments and Dog Nutrition Tracker as ordinary accessible cards.
4. **About the Gardener**: the verified bio, education and tools.
5. **Leave a Little Note**: the verified email.

## 3. Where the five objects stand

| Project | Landmark | Position in the scene |
| --- | --- | --- |
| Nomi & Pudding | The Little Cottage | Far left, on the back meadow |
| Little Moments | The Greenhouse | Left foreground, near the path |
| Dog Nutrition Tracker | The Puppy Corner | Right foreground, just off the path |
| Eliminate Bacteria Pro | The Bubble Fountain | Right middle ground |
| Dyson Interactive Brochure | The Windmill | Top of the right-hand hill |

## 4. Interaction

- **Region**: hovering a side of the garden, or one of its landmarks, lifts that side's title. Selecting the
  title or a chip ("Whole garden / Creative Corner / Growing Grounds") moves the view smoothly into that
  side. A fixed "you are here" label offers a way back.
- **Landmark**: on hover or keyboard focus it lifts and glows: the greenhouse warms, the cottage windows
  light up, the windmill spins faster, the fountain bubbles brighten. Selecting it opens a modal preview
  with the real cover, title, Personal/Academic badge, a short description and **View Case Study**.
  It closes with Esc, the close button, a click outside, or "Keep exploring".
- **Memory**: the last region you explored and the projects you visited are kept in sessionStorage. Back to
  Garden restores the region, and a small daisy blooms by each visited landmark.
- **Fast path**: the header's Work link goes to `/work` (all five, grouped by region), then a case study, then
  Contact. No garden interaction is required.
- **Mobile (<768px)**: the panorama is replaced by two stacked illustrated region panels, each with large tap
  targets for its landmarks. Nothing depends on hover.
- **Reduced motion**: sway, drift, rotation, bubbles, bloom and camera moves are all switched off.

## 5. Drawn in code vs. needs painted files

Currently **code-drawn (SVG plus turbulence/displacement "paint" filters and paper grain)**: sky, clouds,
hills, hedgerows, path, flower scatter, grass, and all five landmarks. They hold the composition, but
they are **temporary stand-ins, not finished watercolour art.**

To reach the reference quality, these should be **hand-painted files** (transparent PNG/WebP at 2× size,
painted in one consistent style):

1. Garden Gate background: sky, hills and path (2880×1800, with a separate foreground flower layer)
2. Panorama background: sky, both regions and the path, with no landmarks (3200×1800)
3. Five landmarks on transparent backgrounds: greenhouse, cottage, doghouse corner, fountain, and windmill
   (with the sails as a separate layer so they can rotate)
4. Two or three flower and grass clusters for the foreground and for mobile
5. A paper texture tile (1024², seamless)

The code is laid out so each one can replace its SVG counterpart without layout changes.

## 6. Decorative art vs. project content

- **Category A, decorative**: `src/components/garden/*` and `public/assets/garden/*`. Environment and
  navigation only. These are never shown as project work.
- **Category B, real projects**: `public/assets/projects/<project>/*`. Only files you supplied, exported at
  their original aspect ratio and recorded in `docs/ASSET-MANIFEST.md`. A missing image renders as
  "Original project asset to be provided."

## 7. Missing-material checklist

Blocking nothing in Phase 2, but needed before launch:

- [ ] **Little Moments**: description, your role, dates, tools, cover and screenshots (none supplied yet)
- [ ] Nomi & Pudding: your role, the tools and AI models used, and approval of the English wording
- [ ] Dog Nutrition Tracker: course name, team size, and confirmation of the role sentence
- [ ] Eliminate Bacteria Pro: course name, individual or team, and how the 3D toothbrush render was made
- [ ] Dyson Brochure: course name, individual or team, and how to credit Dyson's product photography
- [ ] Review all English translations of your Chinese portfolio text (bio and project copy)
- [ ] Contact: email is shown. Should phone, WeChat or LinkedIn also appear? (phone and WeChat are left off
      by default for privacy)
- [ ] Painted decorative files from section 5, or approval to keep refining the code-drawn versions
- [ ] Your BA second major as you'd like it written (the PDF says 传播、信息和技术)
