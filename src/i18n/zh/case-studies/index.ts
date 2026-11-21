import type { FullCaseStudy } from "@/data/case-studies/types";
import { dogNutritionTrackerZh } from "./dog-nutrition-tracker";
import { eliminateBacteriaProZh } from "./eliminate-bacteria-pro";
import { littleMomentsZh } from "./little-moments";
import { aurelleZh } from "./aurelle";

// A Chinese case study is an overlay on the English one: the same sections and blocks in the same order, giving
// only the words (headings, text, bullet items, image descriptions, captions, labels). Everything else — image
// files, sizes, links, ids — always comes from the English original, so the two can never drift apart and the
// original images are never touched.

/** The translatable shape of T: its strings, at the same places, all optional. */
export type Overlay<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? (Overlay<U> | undefined)[]
    : T extends object
      ? { [K in keyof T]?: Overlay<T[K]> }
      : never;

// never translated: they are identifiers, file paths or links
const KEEP = new Set(["id", "src", "source", "href", "type", "icon", "width", "height", "bare", "size", "n", "pending", "video"]);

function merge(en: unknown, zh: unknown, key = ""): unknown {
  if (zh === undefined || zh === null || KEEP.has(key)) return en;
  if (typeof en === "string") return typeof zh === "string" ? zh : en;
  if (Array.isArray(en)) return en.map((x, i) => merge(x, (zh as unknown[])[i]));
  if (en && typeof en === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(en)) out[k] = merge(v, (zh as Record<string, unknown>)[k], k);
    return out;
  }
  return en;
}

export function localize(en: FullCaseStudy, zh: Overlay<FullCaseStudy>): FullCaseStudy {
  return merge(en, zh) as FullCaseStudy;
}

export const caseStudiesZh: Record<string, Overlay<FullCaseStudy>> = {
  "dog-nutrition-tracker": dogNutritionTrackerZh,
  "eliminate-bacteria-pro": eliminateBacteriaProZh,
  "little-moments": littleMomentsZh,
  aurelle: aurelleZh,
};
