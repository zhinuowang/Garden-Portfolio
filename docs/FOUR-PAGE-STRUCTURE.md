# Four-page structure (redesign, 3 November 2026)

Checkpoint before the change: git tag `phase-2-checkpoint`.

## Information architecture

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | Landing | Three scenes of one painted garden: the title, three thoughts on the hills, and afternoon tea with the Explore My Work sign |
| `/about` | About | Botanical-journal page: intro, education, experience and skills from the resume, plus Download Resume |
| `/work` | Work | One full-width painted garden with three project landmarks and a small guide — the whole page is the scene |
| `/contact` | Contact | "Let's stay in touch." and three hand-painted contact icons (Email, LinkedIn, WeChat) as one left-aligned block; the garden mailbox on the right |
| `/work/[slug]` | Case study ×5 | Secondary detail pages, with Back to Work and Next Project |

The persistent nav is Home / About / Work (Contact is reached through the garden mailbox on the Landing); the current page is marked with `aria-current`. The brand reads
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
- **About.** A quiet corner of the painted garden: an oil-painted sky and meadow with a turning tree and a few blush
  flowers (`node scripts/paint-landing.mjs --about`), the content resting on the same faint reading surface as the case
  studies. The taped polaroid portrait (the supplied photo, unaltered), pressed-flower ornaments, case-study-style
  headings with handwritten side notes and a painted vine, a dotted timeline for experience, and skills grouped as tags.
- **Three depths (case studies, About).** Background: the painted backdrop, fixed. Content: the page,
  scrolling normally. Foreground: `FloatingFlora`, a layer fixed to the window above the content (the header stays
  above it; no pointer events) holding just two painted flower clusters that frame the window — one rising from the
  lower-left corner, one hanging into the upper-right — each two or three overlapping heads (lily, hibiscus, daisies,
  daffodil, lavender rose, peonies, poppy, petals; `node scripts/paint-landing.mjs --loose`, painted after Zhinuo's
  references and harmonised with the backdrop's light). Every page has its own combination (`GARDENS`, keyed by the
  project slug and "about"). The Contact page has no floating flowers. The clusters answer the scroll at their own pace (about a sixth of its speed
  at most), only ever drifting into open margin — the lower one sinking, the upper one down the empty right margin;
  scrolling back reverses it. Each reaches inward up to the text column where the margin is clear. On a case study the
  lower-left cluster sits just below the pinned contents list (never more than about half hidden); while the list is
  beside it (near the top of the page) it steps back into the outer margin, drawn smaller but whole. Smaller and kept short of the content on tablets;
  on phones they only peek in (≤ 20 px). Still with reduced motion; dimmed at night. Checked over full scrolls of all
  four pages at desktop, tablet and phone sizes: no text, heading, image, link or button is covered.
- **Background music.** `GardenMusic` in the site header (so it survives page changes): a small painted note, off by
  default and never autoplayed. On click the track fades in over ~1.8 s to a low volume (0.22 by day, 0.15 at night,
  eased without restarting when the lamp is lit), loops, and on the second click fades out over ~1.5 s before
  pausing. It plays from `public/audio/garden-music.mp3` — **not yet supplied**: add a licensed or original track
  there (soft piano, quiet nature ambience, seamless loop). Until then the button reads "Background music coming
  soon" and nothing plays. `aria-pressed`, an accessible label and a handwritten hint on hover or focus; the sound
  curls hold still with reduced motion.
- **Garden mailbox (Landing and Contact).** `Mailbox`: one painting in layers (`--mailbox`, drawn at 2× so it stays
  crisp when large): body, envelope, flag, door, and on Contact a small patch of daisies and pink flowers at its foot.
  On hover or focus the arched door tips open, the flag lifts and a little envelope slides out (≈ 0.4 s). On the
  Landing it stands on the right-hand slope of the first scene, balancing the lamppost, says "Write to me ✉" and links
  to Contact. On Contact it is larger (about 1.5×), a little in from the right beside the three contact methods; a click
  keeps it open and shows "Thanks for stopping by my garden!" for a few seconds.
- **Reading surface (case studies, About, Contact).** `.garden-mist`: a semi-transparent layer of light behind the
  content, feathered at every edge, no blur, border or shadow; moonlit slate at night. Project images are untouched.
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
  On wide screens the garden runs full-bleed as a 3000 × 1350 panorama (the landscape extended, not stretched), with
  the heading painted into the sky. It fills the window below the header (a little wider than the window when needed,
  trimming only the edge trees), and the page has no list or footer beneath it; phones get their own tall composition.
  Code: `src/components/work/WorkGarden.tsx`; art: `node scripts/paint-landing.mjs --work`.
- **Contact.** The last stop in the garden: a left-aligned block ("Let's stay in touch." and the three methods) with the
  garden mailbox on the right, over an oil-painted sky over a meadow with blush flowers
  (`node scripts/paint-landing.mjs --contact`) and three hand-painted icons as one set (`--icons`), each with a written
  label. Email opens a `mailto:` link; LinkedIn opens the profile in a new tab; WeChat opens a small panel with Zhinuo's own
  QR card (`public/assets/contact/wechat-qr.jpg`, served unmodified; `contact.wechatQr` in `src/data/site.ts`). On hover or focus an
  icon lifts, tilts a little and catches a soft light (300 ms; none with reduced motion).

## Copy to edit

The Landing statements live in `src/data/site.ts` → `landingScenes`. Edit them there.
- **Case studies (Dog Nutrition Tracker, Eliminate Bacteria Pro, Little Moments).** Each is a page from the garden's
  field journal: a fixed oil-painted backdrop in the palette of the Landing's first scene — a dusty-rose sky warming to peach and
  cream, long streaky clouds touched with lavender, a hazy line of lavender hills and a sage meadow — painted with
  real pigment and selective impasto, the sky kept calm behind the text;
  a touch of early autumn — a few muted gold and peach strokes in the grass, small turning trees on the far hills, and
  the odd golden flower
  (moonlit blue and cool green at night; `node scripts/paint-landing.mjs --journal`), contents in the margin, sage vines under headings and
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
- **Night in the garden.** A traditional iron streetlamp (`--lamp`: stone plinth, fluted base, scrolled brackets,
  domed lantern with amber glass) stands in front of the cottage, left of the fountain. Hovering or focusing it
  brightens the glass, warms a halo and writes a hint ("Light up the garden ✦" / "Return to daylight ✦"); its hit
  area reaches past the slender post. Clicking runs one coordinated dusk (`night.ts`): the lamp lights, the scenes
  cross-fade (2.2 s) to pre-painted moonlit versions (`node scripts/night-grade.mjs`), the moon, stars and
  fireflies appear, and once it is dusk the page's text palette and the cursor follow (the butterfly becomes a
  small, cute firefly — round head with bright eyes and curled antennae, veined wings that flutter in flight,
  and a plump honey-gold tail glowing in a soft halo); the loose grass clumps of Scene 2 fade away at night. Only opacity, transform and a few small filters animate; the night art is
  loaded with the page. Night is remembered and carries to the Work garden and the case studies (their night
  paintings and backdrop cross-fade in; project images are never filtered); About and Contact have moonlit backdrops too.
  While it is night a small "Day" lantern switch sits in the header.
- **Typography.** Fraunces is set to its softest (`"SOFT" 100`) everywhere it is used, for rounded, organic
  terminals instead of sharp wedges; DM Sans (body) and Caveat (handwritten labels) are unchanged.

