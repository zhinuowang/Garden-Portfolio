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
  touches the water: rings spread and two koi leap across the basin. At the windmill she turns to the viewer,
  takes a small phone from her pocket, lifts it and holds it up beside her for a selfie with the windmill: a small
  flash and sparkle at the phone while the sails turn. A paper wipe then grows from that landmark into the project page.
  The guide has long, loose, wavy hair and a rose bow in every one of her eleven painted poses. When the page
  opens the garden is already there, then the dog house, fountain and windmill rise into place in turn. Between
  visits the details stay alive (water and ripples, the puppy's glances and tail, slowly turning sails); the
  structures never float.
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
- **Landing title and cursor.** "A Garden of Ideas" is hand-lettered with a brush in oil, lowercase on two staggered
  lines ("a garden / of ideas"), in muted olive and warm moss with deposits of dusty rose, blush, butter, cream
  and mauve; the i is a straight brushed stem whose dot is a small painted flower (`node scripts/paint-landing.mjs --title`, letterforms from Bradley Hand Bold, repainted with
  strokes that follow each letter and a dry-brush edge). The letters arrive one by one, left to right; each lifts,
  sways and bounces a little under the pointer; and scrolling into Scene 2 blows them gently away (all up
  and a little to the right, each on its own path, sway, spin and fade, shrinking as they go; all gone before
  Scene 2 settles), back again on the way up. The h1 keeps "A Garden of Ideas" for
  screen readers. On devices with a mouse a small painted butterfly (`--butterfly`) is the cursor on the Landing
  page only, with its head at the click point; over links the normal pointer returns. Touch devices and reduced motion keep the normal cursor.
- **Night in the garden.** A painted lamppost stands at the end of the cottage's fence in Scene 1 (`--lamp`).
  Clicking it lights the lantern and slowly turns the garden to night: a moonlit blue wash multiplied into the
  painting, a soft moon, stars and a few fireflies, a warm pool of lamplight, and the title brightened to read on
  the night sky. Night is remembered (localStorage, restored before first paint) and carries to the Work garden
  (moonlit wash, cream labels) and the case studies (dimmed painted backdrop, cream text); About and Contact
  keep their day look. The palette tokens are registered with `@property` so text and backgrounds fade rather
  than snap. While it is night a small "Day" lantern switch sits in the header; on the Landing page the cursor
  becomes a softly glowing firefly at the same click point.
- **Typography.** Fraunces is set to its softest (`"SOFT" 100`) everywhere it is used, for rounded, organic
  terminals instead of sharp wedges; DM Sans (body) and Caveat (handwritten labels) are unchanged.

