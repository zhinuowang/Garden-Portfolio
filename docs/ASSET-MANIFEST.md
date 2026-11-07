# Asset manifest

Every image the site shows, mapped to its original supplied file. Category B (project content) must only
contain files Zhinuo supplied. Source paths are relative to `~/Desktop/Portofolio/`.

## Category B: real project and personal images

| Site file | Original source | Processing | Used on |
| --- | --- | --- | --- |
| `public/assets/projects/nomi-pudding/cover.jpg` | `Page 1.png` (1920×1080) | Resized to 1600 wide, JPEG; ratio kept | Preview, Work, case study |
| `public/assets/projects/dog-nutrition/cover.jpg` | `软件封面.JPG` (3800×2800) | Resized to 1600 wide, JPEG; ratio kept | Selected Work, preview, Work, case study |
| `public/assets/projects/eliminate-bacteria-pro/cover.jpg` | `COVER PAGE.png` (970×600, English version) | PNG→JPEG, original size | Preview, Work, case study |
| `public/assets/projects/eliminate-bacteria-pro/*.png`, `public/assets/projects/dog-nutrition/*.png` | Original files from `Desktop/Portofolio`, matched to the case-study PDFs | Copied unchanged. Full map: `docs/CASE-STUDY-SOURCE-MAP.md` | Case studies |
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
| `public/assets/garden/work/*.webp`, `public/assets/garden/work/sprites/*.webp` | The Work garden, its landmark layers and the guide's poses: decorative artwork rendered by `scripts/paint-landing.mjs --work` (desktop panorama `garden-desktop-2000/3000`, phones `garden-mobile-720/1080`; positions in `src/data/work-anchors.json`). Not project assets. |
| `public/assets/garden/journal/*` | The case-study page backdrop (wide and tall): decorative artwork rendered by `scripts/paint-landing.mjs --journal`. Not project assets. |
| `public/assets/garden/about/*`, `public/assets/garden/contact/contact-*.webp` | The About and Contact backdrops (wide and tall), from `--about` and `--contact`: decorative artwork. |
| `public/assets/garden/contact/icon-{email,linkedin,wechat}.webp` | The three hand-painted contact icons, from `--icons`: decorative artwork (the LinkedIn "in" and WeChat bubbles are drawn as symbols only). |
| `public/assets/garden/flora/*.webp` | The floating foreground blossoms and petals for the inner pages (lily, hibiscus, daffodil, lavender rose, daisies, peonies, poppy, petals; stemless), from `--loose`, painted after Zhinuo's references (not copied from them): decorative artwork. |
| `public/assets/garden/mailbox/mailbox-{body,door,flag,envelope,garden}.webp` | The garden mailbox in layers (Landing and Contact), from `--mailbox`: decorative artwork. |
| `public/audio/garden-music.mp3` | **Placeholder, not yet supplied.** The background music track (see `src/components/GardenMusic.tsx`): must be licensed or original. No commercial music is used. |
| `public/assets/contact/wechat-qr.jpg` | Zhinuo's WeChat QR card, supplied in chat on 2026-11-07; copied unchanged (888×1131 JPEG). Personal asset, not decorative art. |
| `public/assets/garden/title/letter-*.webp` | The painted Landing title, one layer per letter (positions in `src/data/title-letters.json`): decorative artwork from `scripts/paint-landing.mjs --title`. |
| `public/assets/garden/butterfly/*.webp` | The Landing butterfly cursor (left wing, right wing, body): decorative artwork from `--butterfly`. |
| `public/assets/garden/lamp/lamp-{off,lit}.webp` | The Scene 1 lamppost, dark and lit: decorative artwork from `--lamp`. |
| `public/assets/garden/**/*-night.webp` | Moonlit versions of the Landing scenes, the Work garden and the case-study, About and Contact backdrops, colour-graded by `scripts/night-grade.mjs`: decorative artwork. |
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
