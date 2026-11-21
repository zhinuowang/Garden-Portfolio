import type { FullCaseStudy } from "@/data/case-studies/types";
import type { Overlay } from "./index";

// AURELLE in Chinese: a translation of Zhinuo's English brief. The project name stays in English, and the film's
// own on-screen text is never translated. Listed for review in docs/TRANSLATION-NOTES.md.

export const aurelleZh: Overlay<FullCaseStudy> = {
  subtitle: "AI 护肤广告片",
  facts: [
    { label: "类型", value: "AI 创意制作" },
    { label: "工具", value: "剪映、可灵" },
  ],
  sections: [
    {
      heading: "概述",
      blocks: [{ text: "AURELLE 是我个人创作的一支 AI 生成护肤精华广告片，探索生成式 AI 在美妆广告与视觉叙事中的运用。" }],
    },
    { heading: "广告片" },
  ],
};
