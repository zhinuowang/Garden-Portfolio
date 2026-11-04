# Asset manifest

Every image the site shows, mapped to its original supplied file. Category B (project content) must only
contain files Zhinuo supplied. Source paths are relative to `~/Desktop/Portofolio/`.

## Category B: real project and personal images

| Site file | Original source | Processing | Used on |
| --- | --- | --- | --- |
| `public/assets/projects/nomi-pudding/cover.jpg` | `Page 1.png` (1920×1080) | Resized to 1600 wide, JPEG; ratio kept | Preview, Work, case study |
| `public/assets/projects/dog-nutrition/cover.jpg` | `软件封面.JPG` (3800×2800) | Resized to 1600 wide, JPEG; ratio kept | Selected Work, preview, Work, case study |
| `public/assets/projects/eliminate-bacteria-pro/cover.jpg` | `COVER PAGE.png` (970×600, English version) | PNG→JPEG, original size | Preview, Work, case study |
| `public/assets/projects/dyson-brochure/cover.jpg` | `Dyson cover.png` (1920×1080) | Resized to 1600 wide, JPEG; ratio kept. The play button is part of the original export. | Preview, Work, case study |
| `public/assets/about/portrait.jpg` | `Photo.jpg` (960×1282) | PNG→JPEG re-encode, original size | About |
| `public/assets/projects/little-moments/` | *none yet* | n/a | Placeholder shown |
| `public/resume/Zhinuo-Wang-Resume.pdf` | `~/Desktop/Resume.pdf` (byte-identical copy) | None | About → Download Resume |

Text sources: `~/Desktop/Resume.pdf` (About: experience, skills, education wording; course names for the academic projects) and `个人作品集.pdf`. Page 1 is the design statement, page 2 About Me, page 3 Nomi, page 4 the dog
app, page 5 Eliminate Bacteria Pro, page 6 Dyson.

## Category A: decorative garden artwork

Everything is code-drawn except the Landing painting, which is interim raster art rendered by a script.

| Component | What it draws |
| --- | --- |
| `public/assets/garden/landing/*.webp` | The Landing painting and the wooden sign: interim raster artwork rendered by `scripts/paint-landing.mjs` (spec: `docs/LANDING-ART-SPEC.md`) |
| `src/components/garden/Painted.tsx` | Painted hills, brush strokes, wildflowers, stems, clouds |
| `src/components/botanical/Pressed.tsx` | Pressed flowers and tape for the About page and previews |
| `src/components/contact/MailboxScene.tsx` | Contact landscape, mailbox and envelope |
| `src/components/garden/GardenLandscape.tsx` | The two-region panorama |
| `src/components/garden/GardenObjects.tsx` | Greenhouse, cottage, puppy corner, fountain, windmill, visited daisy |
| `src/components/garden/PaintDefs.tsx` | Shared paint and grain SVG filters |

Painted replacements go in `public/assets/garden/{backgrounds,landscape,flowers,objects,textures}/`.

## Not published

The three landscape reference images and the screen recording are inspiration only. They are not copied
into this repository.
