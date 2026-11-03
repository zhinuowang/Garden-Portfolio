# Four-page structure (redesign, 3 November 2026)

Checkpoint before the change: git tag `phase-2-checkpoint`.

## Information architecture

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | Landing | A scroll-driven walk into the garden, with four short statements and Explore My Work |
| `/about` | About | Botanical-journal page: intro, education, experience and skills from the resume, plus Download Resume |
| `/work` | Work | The interactive two-region garden with five project objects, and a plain list below it |
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

- **Landing.** Redesigned 3 November 2026 (checkpoint tag `landing-v1-checkpoint`): one full-screen garden that the
  camera walks into. The composition, layer list, timings and painted-art spec are in `docs/LANDING-ART-SPEC.md`.
- **About.** A cream paper page with radial light, a taped polaroid portrait, pressed-flower ornaments, dashed
  journal headings with handwritten side notes, a dotted timeline for experience, and skills grouped as tags.
- **Work.** The two-region panorama, now painted with oil-style brush strokes: a warmer olive and peach palette on
  the left, cooler sage on the right. Each of the five objects has a handwritten Caveat label; on hover or focus the
  label tilts and an underline draws in. Previews open as a taped paper note. On mobile the garden becomes two
  stacked region panels with large buttons. Back to Work restores the region and focuses the last project.
- **Contact.** A pink sky over painted hills and wildflowers. The email link is always visible. Opening the envelope
  raises the flag on a vine-wrapped garden mailbox and slides out a note.

## Copy to edit

The Landing statements live in `src/data/site.ts` → `landingScenes`. Edit them there.
