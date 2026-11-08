# 中文 translation — sources and items for review

The site is bilingual (EN default, 中文 optional). English is always the original; Chinese is laid over it.

## How it is built

| What | Where |
| --- | --- |
| Interface strings (nav, buttons, tooltips, accessibility labels) | `src/i18n/ui.ts`: `en` and `zh` have the same keys, enforced by type |
| Landing, About and landmark copy | `src/i18n/zh/site.ts` (mirrors `src/data/site.ts`) |
| Case studies | `src/i18n/zh/case-studies/*.ts`: overlays with the same sections and blocks, words only. Images, links and structure always come from the English data, so they cannot drift. |
| Locale store | `src/i18n/locale.ts`: `<html lang>` plus `localStorage`, restored before first paint by `src/i18n/boot.ts` |
| Tab titles and reveal | `src/i18n/LocaleSync.tsx` |

Switching language re-renders text only: no reload and no route change. The music and the garden's animations carry on.

## Where the Chinese comes from

### Zhinuo's own Chinese, copied verbatim

The PDFs' compatibility characters are normalised (for example ⻚ → 页, ⻝ → 食).

**`Desktop/Portofolio/Nora Wang - 狗狗营养追踪App - 软件设计.pdf`**
- Dog Nutrition Tracker: every heading and paragraph.
- The one exception is the heading 第二轮可用性测试, which the PDF does not have.

**`Desktop/Portofolio/Nora Wang - Eliminate Bacteria Pro - 产品设计.pdf`**
- Eliminate Bacteria Pro: every heading and paragraph.
- The English page says slightly more in two places. Only the extra clause was translated and joined on (marked ⟨+⟩ in the file):
  - **系统组成与工作原理, paragraph 2:** "，表示该区域已清洁完成"
  - **交互机制, bullet 5:** "，让用户看清哪些区域已经清洁、哪些区域仍需继续清洁"

**`Desktop/Portofolio/个人作品集.pdf` (page 1)**
- The About statement.

**`Desktop/王之诺简历.pdf`**
- Education, experience (company names 云汉芯城（上海）互联网科技股份有限公司 and 滁州市贝蒂玛童车有限公司, roles, bullets) and skills.

### Translated: please review

These have no Chinese original:

- **Little Moments:** the whole case study.
  - The app's own English labels ("Draw a little idea", "Slow down"…) stay in English, as on screen, with a Chinese gloss the first time each appears.
  - "Vibe Coding" is kept as the term.
- **Landing:**

  | English | Chinese |
  | --- | --- |
  | Every idea starts as a little seed. | 每个想法，都始于一颗小小的种子。 |
  | I find inspiration in the little things. | 我在细微之处寻找灵感。 |
  | Design is how I turn observations into experiences. | 设计，是我把观察化为体验的方式。 |
  | Come see what I've been growing. | 来看看我种出了些什么吧。 |
  | Explore My Work | 探索我的作品 |

- **About:**
  - Intro: 我是一名设计师，致力于打造用心而直观的体验。
  - Notes: 我求学的地方 / 我做过的事 / 工具棚里的家当
  - Caption: 园丁本人
  - Kicker: 认识这位园丁
  - The portrait's description.
- **Work landmarks:** 小狗角 (The Puppy Corner), 泡泡喷泉 (The Bubble Fountain), 风车 (The Windmill).
- **Image descriptions (alt text):** every image description on the case studies. They describe the images; they are not part of them.

## Decisions to confirm

- **Brand name:** "A Garden of Ideas" stays in English everywhere, including the painted title, because no Chinese name appears in the source materials.
- **Project names:** stay in English, as asked. Two Chinese names exist in your materials and could be used if wanted:
  - 狗狗营养追踪App (PDF titles)
  - FEEDO (the résumé's app name)
- **Résumé link:** the Chinese About page links to the English résumé, labelled （英文 PDF）. `Desktop/王之诺简历.pdf` exists and could be linked in Chinese instead, if you want it published.
- **Unlinked pages:** `/work/nomi-and-pudding` and `/work/dyson-interactive-brochure` are not linked from the site. Their body copy is still English only.
- **Text inside images:** never translated or changed.
