# Case study source map

Two case studies are reproduced from the PDFs Zhinuo supplied as the single source of truth:

| Page | Source PDF (content, headings, order) |
| --- | --- |
| `/work/eliminate-bacteria-pro` | `Desktop/Wang Nora - Eliminate Bacteria Pro.pdf` |
| `/work/dog-nutrition-tracker` | `Desktop/Wang Nora - Dog Nutrition Tracking App.pdf` |

Each PDF is a one-page export of a web portfolio (1324 px wide). Its text extracts cleanly and is
reproduced verbatim (wrapped lines joined, nothing else changed). Content: `src/data/case-studies/`.
Layout: `src/components/case-study/` (garden field-journal presentation; the project images are
never recoloured, cropped or redrawn).

**No other PDF is used.** An earlier version of the Eliminate Bacteria Pro page reproduced the
Y1 portfolio deck (`Desktop/Portofolio/[wang2764].Y1-portfolio…pdf`); that content and its
PDF-only images were removed. A check confirms none of its phrases remain.

## How images were matched

Images are the original files in `Desktop/Portofolio` (the folder is spelled "Portofolio"),
copied unchanged into `public/assets/projects/…`. Nothing in that folder was modified.

- The PDF export left most image slots as blank grey boxes, but each box keeps the exact position
  and proportions of its image. Every box matched exactly one original file to within 1% aspect
  ratio, in reading order.
- Images the PDF did render (both heroes and the two Dog Nutrition research charts) were matched
  pixel by pixel against the candidates (mean difference ≤ 2.7/255 for the match, versus ≥ 21 for
  the alternatives), which also picked the English versions over the Chinese ones.

### Eliminate Bacteria Pro

| # | Section (PDF order) | Original file | Box ratio → file ratio |
| --- | --- | --- | --- |
| 1 | Overview (hero, beside the text) | `ELIMINATE.png` | pixel match (vs Chinese `Product Card.png`) |
| 2–7 | User Flow, steps 1–6 | `1.png` … `6.png` | 1.237→1.246, 0.901→0.907, 1.231→1.234, 0.643→0.646, 1.124→1.128, 1.775→1.760 |
| 8 | Product Detail 1, Camera Embedded in the Brush Head | `build-in camera.png` | 1.124→1.121 |
| 9 | 2, Pattern Style Selection | `pattern selection.png` | 0.777→0.777 |
| 10 | 3, Anti-Slip Bumps | `Anti-dropout bumps .png` | 0.867→0.868 |
| 11 | 4, Speakers Embedded in the VR Glasses Arms | `speaker.png` | 1.219→1.216 |
| 12 | 5, Inductive Charging | `Charger.png` | 1.462→1.457 |
| 13 | Brand Visual Design, Logo and Brand Name | `Logo.png` | 2.482→2.478 |
| 14–15 | Business Card Design, Front / Back | `bussiness card front.png`, `Business card back.png` | 1.762 / 1.754→1.749 |
| 16 | Experiential Marketing (after Campaign Goals) | `Experience Architecture.png` | 1.802→1.804 |

The two product components keep the PDF's emoji (🥽 VR Glasses, 🪥 Electric Toothbrush).

### Dog Nutrition Tracking App

| # | Section (PDF order) | Original file | Match |
| --- | --- | --- | --- |
| 1 | Overview (hero, beside the text) | `mockup.png` | pixel match |
| 2 | Primary Research (beside the findings) | `未命名的设计.png` (English chart) | pixel match (vs Chinese `喂养频率是否会调整.png`) |
| 3 | Primary Research (below) | `RESEARCH 2.png` (English Behavioral Strategies) | pixel match (vs Chinese `行为策略.png`) |
| 4 | Persona | `Personas.png` | 0.889→0.888 |
| 5 | User Journey Map | `User Journey Map.png` | 0.788→0.788 |
| 6 | Story Board | `Storyboard.png` | 1.619→1.610 |
| 7 | User Task-Flow Diagram | `User Task-Flow Diagram.png` | 0.688→0.687 |
| 8 | Initial Wireframes (after the text) | `Original Wireframe.png` | 0.925→0.924 |
| 9 | Interactive Prototype… (after "After these changes…") | `Wireframe changed.png` | 2.317→2.312 |
| 10 | Final Wireframe Design | `Revised Wireframe.png` | 1.404→1.400 |
| 11 | Final UI Design (before the closing text) | `Final UI.png` | 1.008→1.008 |

## Not reproduced

- The PDFs' site navigation and "You may also like" thumbnails (the website has its own navigation
  and Next Project link).
- Role, collaboration and course lines that the site showed earlier (from the résumé) are not in
  these PDFs, so the two pages show only the PDF's Type / Time / Tool.

## Open points

- None of the matches was ambiguous. Every PDF image slot has exactly one original file.

## Little Moments

`/work/little-moments` uses the same case-study template. It is a self-initiated Vibe Coding project
(AI-assisted development with Claude Code and ChatGPT).

| Content | Source |
| --- | --- |
| Title, subtitle, Type, Tool, the three Overview paragraphs, live-app link | Zhinuo's brief in chat, 2026-11-05 (verbatim) |
| `public/assets/projects/little-moments/draw-a-little-idea.png` (1152×1580) | Screenshot supplied in chat, copied byte for byte |
| Core Experience, opening paragraphs | Describe only what that screenshot shows (categories, Filters, capsule machine, cat, "Draw a little idea", "Skip the animation") |
| Time: 2026.10 | Commit history of the little-moments repository (28 commits, 21–27 October 2026) |
| Core Experience "From Inspiration to Action", the three Vibe Coding subsections, Reflection | Zhinuo's copy in chat, 2026-11-06 (verbatim) |
| Core Experience "Inside the App" | Confirmed in the live app on 2026-11-06 as a guest (Feeling → Choose → Draw; the result card and its actions), nothing saved |

The suggested sections The Inspiration, The Design Challenge and Product Concept are not separate sections
yet: their supplied content is the Overview itself, so they can be added once there is more to say.
