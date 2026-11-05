# Four-page structure (redesign, 3 November 2026)

Checkpoint before the change: git tag `phase-2-checkpoint`.

## Information architecture

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | Landing | Three scenes of one painted garden: the title, three thoughts on the hills, and afternoon tea with the Explore My Work sign |
| `/about` | About | Botanical-journal page: intro, education, experience and skills from the resume, plus Download Resume |
| `/work` | Work | One compact painted garden with three project landmarks and a small guide, plus a plain list below it |
| `/contact` | Contact | Garden mailbox scene with a visible email link; the envelope reveals a note |
| `/work/[slug]` | Case study ×5 | Secondary detail pages, with Back to Work and Next Project |

The persistent nav is Home / About / Work / Contact; the current page is marked with `aria-current`. The brand reads
"A Garden of Ideas" over "Zhinuo Wang".

## What was preserved

- `src/data/projects.ts`: all project data, now with the course context and roles confirmed by the resume
- `public/assets/projects/*` and `public/assets/about/portrait.jpg`: unchanged verified images
- `/work/[slug]` case studies: unchanged, except "Back to Garden" is now "Back to Work"
- `GardenExplorer`, `GardenLandscape` and `GardenObjects`: moved from the homepage to `/work` and refined
- `ProjectPreview`, `ProjectMedia`, `CategoryBadge`, `MarkVisited` and session memory
- `PaintDefs` filters and the colour and type tokens

Removed (all recoverable from the tag): the homepage sections `GardenGate`, `GardenOverview`, `HomeSections` and `ProjectCard`.

## Composition per page

- **Landing.** Three scenes of one tall painting, stacked edge to edge in normal scroll: the title only, then the
  thoughts along the hills, then afternoon tea with a hanging wooden Explore My Work sign. Earlier versions are tagged
  `landing-v1-checkpoint` to `landing-v4-checkpoint`. The composition and art spec are in `docs/LANDING-ART-SPEC.md`.
- **About.** A cream paper page with radial light, a taped polaroid portrait, pressed-flower ornaments, dashed
  journal headings with handwritten side notes, a dotted timeline for experience, and skills grouped as tags.
- **Work.** One compact painted garden that fits the screen (16:9 on desktop, 9:16 on phones), showing only three
  projects: Eliminate Bacteria Pro at the fountain and Dog Nutrition Tracker at the dog house (both labelled
  Academic), and Little Moments at the windmill (Personal). A single heading above the scene reads "Choose a place to explore my work." Landmarks glow in turn, and lift with a bobbing cue on hover or focus. On click, a small painted girl
  walks over and shares a short moment with it. At the dog house she kneels face to face with the puppy, holds
  out a little bone treat and pats it while it hops toward her, wags and sends up hearts. At the fountain she
  touches the water: rings spread and two koi leap across the basin. At the windmill she turns to the viewer with
  a V sign; a viewfinder frames her with the windmill, a flash, and the shot settles into a polaroid captioned
  "a little moment" while the sails spin. A paper wipe then grows from that landmark into the project page.
  The guide has long, loose, wavy hair and a rose bow (eight painted poses).
  Landmarks are real links: Enter works, and with reduced motion they open at once. Next Project cycles through the
  three. Nomi & Pudding and the Dyson brochure keep their case-study pages but are no longer linked from Work.
  Code: `src/components/work/WorkGarden.tsx`; art: `node scripts/paint-landing.mjs --work`.
- **Contact.** A pink sky over painted hills and wildflowers. The email link is always visible. Opening the envelope
  raises the flag on a vine-wrapped garden mailbox and slides out a note.

## Copy to edit

The Landing statements live in `src/data/site.ts` → `landingScenes`. Edit them there.
- **Case studies (Dog Nutrition Tracker, Eliminate Bacteria Pro).** Each is a page from the garden's field
  journal: a fixed oil-on-canvas backdrop (cream ground, canvas weave, sage and blush washes and painted stems at
  the edges; `node scripts/paint-landing.mjs --journal`), contents in the margin, sage vines under headings and
  leaf bullets. Project images sit straight on the page with no card, border or tape; only those with an opaque
  background get a faint, diffused neutral shadow. The images themselves are untouched.
