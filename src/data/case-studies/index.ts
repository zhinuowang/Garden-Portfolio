import { dogNutritionTracker } from "./dog-nutrition-tracker";
import { eliminateBacteriaPro } from "./eliminate-bacteria-pro";
import { littleMoments } from "./little-moments";
import { aurelle } from "./aurelle";
import type { FullCaseStudy } from "./types";

/** Projects whose page is a full case study reproduced from an original PDF. */
export const fullCaseStudies: Record<string, FullCaseStudy> = {
  "dog-nutrition-tracker": dogNutritionTracker,
  "eliminate-bacteria-pro": eliminateBacteriaPro,
  "little-moments": littleMoments,
  aurelle,
};
