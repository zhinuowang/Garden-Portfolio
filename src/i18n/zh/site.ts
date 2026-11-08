// Simplified Chinese page copy for the Landing, About and Contact pages. It mirrors src/data/site.ts.
//
// Sources, so nothing here is invented:
// - About statement, education and every experience bullet, company name and skill: Zhinuo's own Chinese, from
//   Desktop/Portofolio/个人作品集.pdf (page 1–2) and Desktop/王之诺简历.pdf, copied verbatim (the PDFs' compatibility
//   characters normalised, e.g. ⻚ → 页).
// - The Landing thoughts, the one-line intro and the portrait's description have no Chinese original: they are
//   translations of the English, kept close to its meaning (listed for review in docs/TRANSLATION-NOTES.md).

export const landingScenesZh = {
  title: "A Garden of Ideas",
  // (\u200b marks where a thought may break onto its second line on the hills: never inside a word)
  thoughts: ["每个想法，都始于一颗小小的种子。", "我在细微之处\u200b寻找灵感。", "设计，是我把观察化为体验的方式。"],
  invitation: "来看看我种出了些什么吧。",
  cta: "探索我的作品",
};

export const aboutZh = {
  intro: "我是一名设计师，致力于打造用心而直观的体验。",
  // 个人作品集.pdf, page 1 — Zhinuo's own words (the English on the site is translated from this)
  statement: [
    "设计对我来说，是在复杂世界中建立一种可被理解的秩序。我关注的不只是界面与功能本身，更在意人在使用过程中的感受——是否清晰、是否安心、是否无需费力思考。",
    "留学经历让我对文化差异与表达方式更加敏感，也让我学会在不同语境中思考人与产品之间的关系。我希望通过设计，让体验更自然可信，也更贴近真实生活。",
  ],
  education: [
    { school: "多伦多大学", degree: "信息学硕士 — 用户体验设计方向", dates: "2025.09 – 至今" },
    { school: "多伦多大学", degree: "文学学士 — 经济与传播、信息和技术双专业", dates: "2021.09 – 2025.06" },
  ],
  // 王之诺简历.pdf — Zhinuo's own Chinese résumé
  experience: [
    {
      role: "视觉设计实习生",
      company: "云汉芯城（上海）互联网科技股份有限公司",
      place: "中国上海",
      dates: "2026.04 – 2026.07",
      bullets: [
        "使用 Adobe Photoshop 和 Illustrator 设计移动端及 PC 端促销海报与活动视觉，支持品牌营销推广。",
        "使用 Figma 协助网站页面设计，并独立完成弹窗、悬浮组件、横幅及促销模块等网页 UI 组件。",
        "运用 GPT Image-2、Seedance、Lovart 等 AI 设计工具加速内容产出，提升设计工作流效率。",
      ],
    },
    {
      role: "产品设计实习生",
      company: "滁州市贝蒂玛童车有限公司",
      place: "中国滁州",
      dates: "2024.06 – 2024.08",
      bullets: [
        "使用 Adobe Photoshop 辅助婴儿童车产品的设计与插画工作，提供创意想法和艺术作品，提升产品吸引力。",
        "为营销物料制作图形和视觉内容，增强品牌知名度和推广效果。",
        "与设计团队协作，构思并执行新产品及营销活动的创新理念。",
      ],
    },
  ],
  skills: {
    software: ["Adobe InDesign", "Adobe Illustrator", "Adobe Photoshop", "Adobe Premiere", "Figma", "微软办公软件（MS Office）"],
    professional: ["内容创作", "市场分析", "商业智能", "商业分析与可视化", "用户体验分析", "客户画像分析", "视频剪辑"],
    interpersonal: ["中小型项目领导力", "团队协作", "时间管理"],
  },
  portraitAlt: "王之诺站在海边轮船的栏杆旁，身穿一件柔软的驼色大衣。",
};

/** The Work garden's landmarks, in Chinese. */
export const placesZh: Record<string, string> = {
  "dog-nutrition-tracker": "小狗角",
  "eliminate-bacteria-pro": "泡泡喷泉",
  "little-moments": "风车",
};
