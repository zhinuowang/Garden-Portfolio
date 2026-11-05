# Eliminate Bacteria Pro — source map

The case study at `/work/eliminate-bacteria-pro` reproduces the English project deck in
`Desktop/Portofolio/[wang2764].Y1-portfolio.[zhinuo].[wang].pdf`, pages 36–63 (dated Jan. 2, 2026).
Content lives in `src/data/case-studies/eliminate-bacteria-pro.ts`; the renderer is
`src/components/case-study/`. Nothing in `Desktop/Portofolio` was modified, moved or renamed.

## Sources inspected

| File | What it is | Used |
| --- | --- | --- |
| `[wang2764].Y1-portfolio.[zhinuo].[wang].pdf` p.36–63 | English case-study deck: the fullest version | Text, structure, order; PDF-only images |
| `Nora Wang - Eliminate Bacteria Pro - 产品设计.pdf`, `作品集.pdf` p.4, `个人作品集.pdf` | Chinese web version: same content, fewer sections (no problem statement, objectives, design research, intangible metadesign or deliverables) | Cross-check only; type, date and tools in the page header |
| `1.png` – `6.png`, `build-in camera.png`, `pattern selection.png`, `Anti-dropout bumps .png`, `speaker.png`, `Charger.png`, `Logo.png`, `bussiness card front.png`, `Business card back.png`, `Experience Architecture.png` | Original illustration files | Copied unchanged |
| `COVER PAGE.png` | English cover | Hero (already on the site) |
| `ELIMINATE.png`, `Product Card.png`, `Eliminate Bacteria Pro Cover Page.png` | Cover variants (one English, two Chinese) not used in the deck | Not used |
| `1.mp4` – `9.mp4`, `AIGC个人IP视频.mp4` | Little Moments clips, not this project | Not used |

## Section and image order

| Deck page | Chapter → section | Image (`public/assets/projects/eliminate-bacteria-pro/`) | From |
| --- | --- | --- | --- |
| 37 | Project Overview → What problems am I solving? | — (small toothbrush icon omitted, see below) | |
| 38 | → Project Objectives | — | |
| 39 | → About the product | `about-the-product.png` 1122×1245 | PDF embedded image |
| 40 | Product Concept and Functional Design → Product Form | — | |
| 41 | → Interaction Mechanism — Gamified Cleaning Feedback | `interaction-mechanism.png` 582×271 | `5.png`, lower part as shown in the deck |
| 42–47 | → User Flow, steps 1–6 | `user-flow-1.png` … `user-flow-6.png` | `1.png` … `6.png` |
| 48–52 | → Product Detail Design 1–5 | `detail-camera.png`, `detail-pattern-selection.png`, `detail-anti-dropout-bumps.png`, `detail-speakers.png`, `detail-inductive-charging.png` | originals |
| 53 | Design Research → VR Technology (+ references) | — | |
| 54 | → Vibration Frequency; Bristles material - Nylon (+ references) | — | |
| 55 | Metadesign → Metadesign-Tangible | `logo-annotated.png`, `business-card-front.png`, `business-card-back.png` | `Logo.png`, card originals |
| 56 | → Metadesign-Intangible | — | |
| 57 | Experience Architecture → Experiential Marketing | `experiential-marketing.png` 2196×1217 | `Experience Architecture.png` |
| 58 | Design Value & Impact → Key Design Value | `key-design-value.png` | PDF vector art, rendered at 3× |
| 59 | → Expect Design Impact | `design-impact.png` 1600×1200 | PDF embedded image |
| 60 | Final Deliverables → 01 Product Overview, 02 Product Details | `deliverable-01-…`, `deliverable-02-…` | PDF embedded images |
| 61 | → 03 User Journey, 04 Brand Identity Design | `deliverable-03-…`, `deliverable-04-brand-logo.png` + the two card originals | PDF embedded images |
| 62 | → 05 Commercial Video | `deliverable-05-commercial-video.png` (opening frame) | PDF embedded image |
| 63 | → 06 Go-to-Market | `deliverable-06-go-to-market.png` | PDF embedded image |

PDF images were extracted as the embedded image streams (native resolution, transparency kept),
not screenshots.

## Edits to the source text

- Line breaks from the slides joined into paragraphs.
- Misspellings corrected in headings and tabs only: "Overivew" → Overview, "Architcture" →
  Architecture, "Bussiness card" → Business card. "Electric T oothbrush" and "T op 9" were PDF
  text-extraction gaps, not typos.
- Everything else, including "Expect Design Impact" and "Prize include:", is verbatim.

## Missing or unclear

- **Commercial video:** the deck says it is "available via the Google Drive link provided", but no
  link or video file is in the supplied materials. The page shows the opening frame and
  "Video link to be provided."
- **Toothbrush icon on page 37:** a small decorative vector icon; omitted because it cannot be
  separated cleanly from the slide text.
- **Deliverable boards (pages 60–63):** only exist inside the PDF, at ~1588 px wide; their small
  print is legible but not crisp. Original exports would be sharper.
