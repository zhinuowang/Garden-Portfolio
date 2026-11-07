import type { FullCaseStudy } from "@/data/case-studies/types";
import type { Overlay } from "./index";

// Little Moments in Chinese — a translation of Zhinuo's English text (there is no Chinese original), written to
// keep her meaning, structure and gentle first-person voice. The app's own interface is in English, so its labels
// ("Draw a little idea", "Slow down"…) stay in English as they appear on screen, with a Chinese gloss the first
// time each appears. "Vibe Coding" is kept as the established term. Listed for review in
// docs/TRANSLATION-NOTES.md.

export const littleMomentsZh: Overlay<FullCaseStudy> = {
  subtitle: "一款帮你发现生活小事的趣味应用。",
  facts: [
    { label: "类型", value: "Vibe Coding / 产品设计" },
    { label: "日期", value: "2026.10" },
    { label: "工具", value: "Claude Code, ChatGPT" },
  ],
  sections: [
    {
      heading: "概述",
      blocks: [
        {
          image: {
            alt: "Little Moments 截图：标题“Little ideas — Small, gentle things to do with your time.”（小点子——用来打发时光的温柔小事），分类标签 Everything、Slow down、Go outside、Try something new 和 Stay cozy，一个 Filters 筛选按钮，以及一台黑白扭蛋机，机械爪悬在一堆扭蛋上方。旁边的小猫举着爱心牌，说着“Ready? I’ve been practising.”（准备好了吗？我已经练习过啦。）下方是“42 ideas inside”（里面有 42 个点子）、“Draw a little idea”按钮和“Skip the animation”（跳过动画）。",
          },
          blocks: [
            { text: "Little Moments 源于我生活中一个简单的小烦恼：我常常想在周末出门走走、好好利用时间，却不总是知道该做些什么。这让我开始思考：数字体验能否把日常的犹豫不决，转化为一个个轻松、容易开始的小活动点子。" },
            { text: "这个项目逐渐发展成一款趣味活动发现应用：用户可以按主题分类浏览点子，也可以通过“Draw a little idea”（抽一个小点子）的互动来探索。Little Moments 没有用太多选项让人无所适从，而是提供一种温和又有趣的方式，帮人找到想做的事。" },
            { text: "作为一个自发的 Vibe Coding 项目，Little Moments 也让我得以探索：Claude Code、ChatGPT 等 AI 辅助开发工具，如何帮助我把一个个人产品构想变成可交互的数字体验。" },
            { label: "体验在线应用 ↗" },
          ],
        },
      ],
    },
    {
      heading: "核心体验",
      blocks: [
        { text: "上图中的“Little ideas”界面，把应用里的活动点子汇集在一句话之下：“Small, gentle things to do with your time.”（用来打发时光的温柔小事。）点子可以按主题浏览——Everything（全部）、Slow down（慢下来）、Go outside（出门走走）、Try something new（尝试新事物）和 Stay cozy（舒适宅家）——还能通过 Filters 进一步筛选。" },
        { text: "这些点子没有排成列表，而是装在一台扭蛋机里，点一下“Draw a little idea”按钮就能抽出一个。一只小猫陪伴着来访者（“Ready? I’ve been practising.”），而想直接看结果的人，也可以选择“Skip the animation”。" },
        { text: "从灵感到行动" },
        { text: "整个体验围绕一个简单的想法展开：找一件开心的事来做，应该是令人期待的，而不是让人不知所措的。" },
        { text: "Little Moments 没有给用户呈现一份望不到头的活动清单，而是用一种好玩的方式帮人发现各种可能。用户可以根据自己想要的体验，按“Slow down”“Go outside”“Try something new”和“Stay cozy”等主题分类探索点子。" },
        { text: "体验的核心是“Draw a little idea”互动。它的灵感来自扭蛋机和抓娃娃机，把一次普通的选择，变成一个充满期待与惊喜的小时刻。" },
        { text: "一只小猫伙伴为体验增添了个性，而跳过动画的选项则为用户提供了一条更直接通往结果的路径。" },
        { text: "通过将主题浏览与互动式抽取机制相结合，Little Moments 希望让“选一件事来做”不再像又一个需要做的决定，而更像一次小小的发现。" },
        { text: "应用内部" },
        { text: "首页通过三个温和的步骤引向抽取——Feeling（心情）、Choose（选择）、Draw（抽取）。小猫 Momo 先问你此刻的心情（这一步可以跳过），再问你想做什么：慢下来、出门走走、尝试新事物、舒适宅家、好好休息，或者写下今天的一页。" },
        { text: "抽出一个点子后，它会以卡片的形式出现，写着所属分类、一段简短描述，以及需要多长时间、在哪里进行、花费多少。接下来，你可以看看进展如何、选择“Let’s do it”（就做这个）、换一个试试，或者先收藏起来。这一把抽到的其余点子会列在下方，你可以再抽一次，也可以不看动画、直接换一把新的。" },
      ],
    },
    {
      heading: "Vibe Coding 过程",
      blocks: [
        { text: "从个人观察到产品概念" },
        { text: "Little Moments 源于我日常生活中的一个小烦恼：我常常想在周末出门走走、好好利用时间，却不总是知道该做些什么。" },
        { text: "我没有把它当作一个传统的活动规划问题来处理，而是想探索一种更好玩、更亲切的发现点子的方式。" },
        { text: "产品概念逐渐围绕三个重点成形：让体验保持简单，提供不同类型的活动，并让发现的过程本身充满乐趣。" },
        { text: "最终的界面通过主题活动分类、受扭蛋机启发的互动以及温柔的视觉个性，把这些想法融合在一起。" },
        { text: "探索 AI 辅助的产品开发" },
        { text: "Little Moments 是一个在 Claude Code 和 ChatGPT 辅助下开发的个人 Vibe Coding 项目。" },
        { text: "我把 AI 辅助开发当作一种方式，去探索一个产品想法如何被转化为一个真正可用的交互体验。" },
        { text: "这个项目也让我有机会跳出静态界面去思考，考虑界面设计、交互行为、视觉细节与技术实现如何相互配合。" },
        { text: "对我来说，Vibe Coding 不只是生成代码。它是一个机会，让我探索一种把个人设计构想变为现实的不同工作流程。" },
        { text: "在迭代中设计" },
        { text: "这个项目很重要的一点，是把应用看作一个不断演进的体验，而不是一个一次性完成的设计。" },
        { text: "这个过程让我更清楚地看到：一个功能的外观、它的行为方式，以及用户如何理解它，三者之间是紧密相连的。" },
        { text: "扭蛋机互动就是这种关系的一个很好的例子：它的视觉设计营造出轻松有趣的氛围，而交互本身则需要保持易懂、易用。" },
        { text: "这个项目促使我思考视觉个性与功能清晰之间的平衡。" },
        { text: "它也让我更加确信：评估一个交互产品时，应当把它作为一个完整的体验来审视，而不是孤立地看待单个界面。" },
      ],
    },
    {
      heading: "反思",
      blocks: [
        { text: "我的收获" },
        { text: "Little Moments 让我看到，一个微小的个人观察也可以成为一款数字产品的起点。" },
        { text: "最初只是一个“周末该怎么过”的简单问题，后来逐渐发展成对活动发现、交互设计以及 AI 辅助开发的一次探索。" },
        { text: "这个项目带给我最宝贵的收获之一，是认识到让日常数字体验变得亲切、愉快的重要性。" },
        { text: "一款产品并不总是需要解决复杂的问题才能创造价值。有时候，用心的设计能够减少生活中那些小小的犹豫，让平凡的决定变得轻松一点。" },
        { text: "这个项目也拓宽了我对设计与技术实现之间关系的理解。借助 Claude Code 和 ChatGPT，我得以探索 AI 辅助开发如何支持交互体验的创建。" },
        { text: "展望" },
        { text: "如果继续开发 Little Moments，我希望探索如何让活动推荐更贴合不同的用户与情境。" },
        { text: "可能的方向包括：" },
        {
          items: [
            "更个性化的活动发现",
            "根据可用时间与个人偏好，更好地筛选点子",
            "增加更多互动，让体验更有吸引力",
            "开展可用性测试，了解人们如何浏览和理解这款应用",
            "进一步打磨趣味动画与高效交互之间的平衡",
          ],
        },
      ],
    },
  ],
};
