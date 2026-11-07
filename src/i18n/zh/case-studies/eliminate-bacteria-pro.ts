import type { FullCaseStudy } from "@/data/case-studies/types";
import type { Overlay } from "./index";

// Eliminate Bacteria Pro in Chinese. The headings and body text are Zhinuo's own Chinese, copied verbatim from
// Desktop/Portofolio/Nora Wang - Eliminate Bacteria Pro - 产品设计.pdf (compatibility characters normalised).
// The English page splits or extends a few passages; where it says a little more than the Chinese PDF, only that
// extra clause is translated and joined on (marked ⟨+⟩ below, listed in docs/TRANSLATION-NOTES.md). Image
// descriptions are translated. In-product labels shown in the images ("Style Selection") stay in English.

export const eliminateBacteriaProZh: Overlay<FullCaseStudy> = {
  facts: [
    { label: "类型", value: "概念产品设计" },
    { label: "日期", value: "2023.12 - 2024.04" },
    { label: "工具", value: "Adobe InDesign, Adobe Illustrator" },
  ],
  sections: [
    {
      heading: "概述",
      blocks: [
        {
          image: { alt: "Eliminate Bacteria Pro：品牌名下方是一支粉蓝相间的牙刷，四个图标分别标注 Gamified Brushing（游戏化刷牙）、Real-time VR display（VR 实时显示）、Zone-based Guidance（分区引导）和 3-Second Detection（3 秒检测）。" },
          blocks: [
            { text: "本项目旨在通过将 VR 技术与电动牙刷结合，使刷牙过程既有趣又有效。当儿童佩戴 VR 眼镜刷牙时，系统会实时显示牙齿图像，并在牙齿表面每隔 4 毫米生成可爱的灰色图案。只有当牙刷在对应位置停留 3 秒时，该图案才会由灰色变为绿色。通过这种方式，刷牙被转化为类似“消灭小怪兽”的互动游戏，在提升趣味性的同时，引导儿童更加细致地刷牙，减少遗漏区域。" },
          ],
        },
      ],
    },
    {
      heading: "系统组成与工作原理",
      blocks: [
        { text: "该产品由两个核心组件组成：" },
        { items: [{ name: "VR 眼镜" }, { name: "电动牙刷" }] },
        // ⟨+⟩ "，表示该区域已清洁完成" (the English adds "indicating that the area has been cleaned")
        { text: "电动牙刷通过内置摄像头扫描口腔内部，而 VR 眼镜则实时呈现牙齿的可视化画面。在牙齿图像表面会出现灰色卡通“细菌”图案，孩子需要将牙刷停留在对应图案进行清洁。当牙刷在目标图案停留一段时间后，图案颜色会由灰色变为绿色，表示该区域已清洁完成。" },
        { text: "通过这种方式，刷牙过程被转化为一个互动式的清洁任务，使儿童在游戏化体验中完成更全面、更细致的刷牙。" },
      ],
    },
    {
      heading: "交互机制：游戏化清洁反馈",
      blocks: [
        {
          items: [
            "在牙齿图像表面每隔 4 mm 生成灰色“细菌”图案；",
            "牙刷在对应图案停留 3 秒时进行清洁；",
            "图案由灰色变为绿色，表示该区域清洁完成；",
            "系统提供音频提示反馈；",
            // ⟨+⟩ the English adds which areas are done and which still need attention
            "VR 眼镜实时呈现牙齿清洁进度，让用户看清哪些区域已经清洁、哪些区域仍需继续清洁。",
          ],
        },
      ],
    },
    {
      heading: "用户流程",
      blocks: [
        { text: "同时长按 VR 眼镜与电动牙刷上的按钮 5 秒即可完成蓝牙配对；再次长按 5 秒可关闭设备。", image: { alt: "一根手指按下苹果造型 VR 眼镜上的按钮，另一根按下牙刷上的按钮，中间是“5 秒”时钟和连接图标。" } },
        { lead: "获取牙齿图像：", text: "VR 眼镜会引导用户使用牙刷头上的摄像头对口腔进行 360° 扫描拍摄，从而获取完整的牙齿图像并用于后续清洁反馈显示。", image: { alt: "刷头上的摄像头、360 度图标，以及蓝色扫描框中扫描得到的牙齿图像。" } },
        { text: "用户可通过牙刷手柄上的按钮选择喜欢的图案。选择过程中，VR 眼镜中会显示 “Style Selection” 提示，并在牙齿图像上呈现对应的图案效果。", image: { alt: "“Style Selection”菜单，列出 Bacteria、Lollipop、Hamburger、Orange、Cola、Dots 和 Fried chicken 等图案，旁边是一根手指按下手柄按钮。" } },
        { text: "轻按按钮，电动牙刷开始振动。", image: { alt: "一根手指按下牙刷按钮，刷头周围画着振动线。" } },
        { text: "根据 VR 眼镜中显示的牙齿图像，将刷头放在灰色图案所在的位置，并保持约 3 秒，直到图案变为绿色。刷头只需轻轻贴在牙齿表面，通过牙刷的振动完成清洁。", image: { alt: "牙刷贴着牙齿，旁边是“3 秒”时钟；下方是布满灰色细菌图案的牙齿图像。" } },
        { text: "当所有图案均变为绿色时，表示牙齿清洁完成。", image: { alt: "所有图案都已变绿的牙齿图像，旁边是一个大大的绿色对勾。" } },
      ],
    },
    {
      heading: "产品细节设计",
      blocks: [
        { title: "刷头内置摄像头", text: "在首次使用产品时，系统会通过刷头内置的摄像头对口腔进行扫描，从而生成牙齿结构信息并建立基础数据。在刷牙过程中，摄像头会实时扫描牙刷经过的牙齿位置，帮助用户清晰了解哪些区域已经被清洁、哪些区域仍需要继续清洁。", image: { alt: "蓝色刷头的特写，刷毛间藏着一个小摄像头，并连到放大的摄像头模块。" } },
        { title: "图案样式选择", text: "为了避免儿童在多次使用后产生乏味感，系统加入了图案样式更换功能。通过牙齿上的图案发生变化，为儿童带来新的体验，从而提升持续刷牙的兴趣。", image: { alt: "“Style Selection”菜单：Bacteria、Lollipop、Hamburger、Orange、Cola、Dots、Fried chicken。" } },
        { title: "防滑凸点", text: "手柄上的凸点能够增加与手部之间的摩擦力，即使牙膏泡沫落至手柄上，也能防止从儿童手中滑落。", image: { alt: "粉色手柄，以及其圆形凸点的放大图。" } },
        { title: "VR 眼镜镜腿内置扬声器", text: "当灰色图案变为绿色时，系统会播放泡泡音效进行提示。通过这种声音反馈与用户互动，使整个使用过程更加有趣。", image: { alt: "小熊造型的 VR 眼镜，以及镜腿内扬声器的放大图。" } },
        { title: "感应式充电", text: "牙刷采用无接口的感应充电设计，减少电池损坏的风险。即使牙刷被水打湿，也无需担心漏电或触电等安全隐患，更加安全可靠。", image: { alt: "一块淡黄色的充电底座，带有电池充电图标和一根 USB 线。" } },
      ],
    },
    {
      heading: "品牌视觉设计",
      blocks: [
        { text: "Logo 与品牌名称" },
        { text: "我设计的 Logo 是一颗戴着 VR 眼镜、手持放大镜的牙齿形象。品牌名称为 “Eliminate Bacteria Pro”。这一名称不仅表达了产品在口腔清洁方面的高效功能，同时也希望让儿童将使用产品的过程联想到“消灭细菌”的游戏，从而在轻松、有趣的体验中主动完成刷牙。" },
        { image: { alt: "Eliminate Bacteria Pro 的 Logo：一颗戴着 VR 眼镜、手持放大镜、面带微笑的牙齿，附注解——VR 眼镜；放大镜代表能够“看见”细菌、检查遗漏，对应产品的功能；品牌名称。" } },
        { text: "名片设计" },
        { text: "名片正面展示产品的 Logo，并以平铺的牙齿图案作为背景元素，强化品牌视觉识别。名片背面则提供多种联系方式，方便客户获取信息与沟通，包括电话、电子邮箱、官方网站以及地址等。" },
        { caption: "正面", image: { alt: "名片正面：浅蓝色底上铺满小牙齿图案，中间是 Logo。" } },
        { caption: "反面", image: { alt: "名片反面：Logo 与品牌名并排，写着“Specializing in children’s oral cleaning”（专注儿童口腔清洁），下方是网站、电话、邮箱和地址。" } },
      ],
    },
    {
      heading: "体验式营销",
      blocks: [
        { text: "我设计了一项与购物中心合作的体验式营销活动，在商场内设置互动屏幕，让儿童参与一场“消灭细菌挑战赛”。屏幕上会同时出现大量“细菌”图案，当儿童用手指点击这些“细菌”时，它们会化为灰色烟雾消失。参与者需要在 1 分钟内尽可能多地消灭细菌，与其他儿童进行挑战比拼。" },
        { text: "活动奖励" },
        { items: ["第一名：免费获得 Eliminate Bacteria Pro 产品", "第二名：6 折优惠券", "第三名：50 美元现金奖励"] },
        { text: "活动目标" },
        { items: ["让儿童通过互动体验感受游戏化刷牙的概念", "帮助家长更直观地了解产品功能", "在高人流场所提升品牌曝光度", "观察真实用户行为，为后续设计优化提供参考"] },
        { image: { alt: "一台互动展示屏；放大图中，卡通细菌散落在屏幕上，计分显示“Total: 2”，计时器为 00:58。" } },
      ],
    },
    {
      heading: "设计核心价值",
      blocks: [
        {
          items: [
            { title: "儿童导向的互动体验", text: "通过游戏化的方式让刷牙变成一种有趣的互动体验，从而激发儿童主动参与刷牙。" },
            { title: "可视化清洁反馈", text: "系统实时呈现牙齿清洁状态，帮助用户清晰了解哪些区域已经清洁、哪些区域仍需继续刷牙，减少遗漏。" },
            { title: "情感化体验设计", text: "友好的视觉元素与音效反馈共同营造轻松愉快的使用氛围，使儿童更愿意持续使用产品。" },
            { title: "整体化品牌体验", text: "设计不仅关注产品功能，同时整合品牌视觉与体验传播，形成统一且完整的品牌体验。" },
          ],
        },
      ],
    },
    {
      heading: "预期设计影响",
      blocks: [
        {
          items: [
            { title: "更长且更专注的刷牙时间", text: "游戏化机制能够提升儿童的参与度，使其更愿意持续并专注地完成刷牙过程。" },
            { title: "降低蛀牙风险", text: "更完整、细致的清洁过程有助于减少口腔细菌残留，从而降低蛀牙发生的风险。" },
            { title: "养成健康的日常习惯", text: "通过有趣且具有反馈机制的体验，帮助儿童逐渐建立稳定的刷牙习惯。" },
            { title: "增强亲子互动", text: "产品的互动体验能够鼓励家长参与孩子的刷牙过程，促进更多亲子交流。" },
            { title: "提升品牌信任感", text: "通过有趣且有效的产品体验，增强用户对品牌的认可与信任。" },
          ],
        },
      ],
    },
  ],
};
