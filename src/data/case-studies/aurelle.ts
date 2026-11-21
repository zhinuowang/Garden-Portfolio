import type { FullCaseStudy } from "./types";

// AURELLE: a personal AI-generated skincare serum commercial. It uses the same project-page structure as the
// other case studies (category, title, subtitle, a Type / Time / Tool row, then the sections), but its subject is
// a film. Everything here is Zhinuo's own:
// - the project facts and overview are from her briefs of 2026-11-20 and 2026-11-21;
// - the film is her finished commercial (src/data/aurelle.ts).
// Time: no date has been supplied, so the row shows only Type and Tool. Add { label: "Time", value: "…" } between
// them once it is confirmed (and its Chinese overlay: { label: "日期", value: "…" }).
// Later sections — concept, visual direction, storyboard and shot planning, AI keyframes, character and product
// consistency, image-to-video, editing — are added here only from materials Zhinuo supplies.

export const aurelle: FullCaseStudy = {
  source: "Zhinuo's finished commercial (Desktop/AURELLE AD.mp4) and her project brief, 2026-11-20 / 2026-11-21",
  subtitle: "AI Skincare Commercial",
  facts: [
    { label: "Type", value: "AI Creative Production" },
    { label: "Tool", value: "CapCut, Kling" },
  ],
  sections: [
    {
      id: "overview",
      heading: "Overview",
      blocks: [
        {
          type: "p",
          text: "AURELLE is a personal AI-generated skincare serum commercial exploring the use of generative AI in beauty advertising and visual storytelling.",
        },
      ],
    },
    {
      id: "commercial",
      heading: "The Commercial",
      blocks: [{ type: "video", video: "aurelle" }],
    },
  ],
};
