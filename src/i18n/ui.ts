"use client";

import { useLocale, type Locale } from "./locale";

// Every interface string on the site — navigation, buttons, tooltips, accessibility labels — in one place.
// English is the source; the Chinese must have exactly the same keys (the type below enforces it).
// Page copy (the Landing thoughts, About, case studies) lives in ./content.ts.

const en = {
  brand: "A Garden of Ideas",
  designer: "Zhinuo Wang",
  skip: "Skip to content",
  nav: { label: "Main", home: "A Garden of Ideas — home", about: "About", work: "Work", contact: "Contact", openMenu: "Open menu", closeMenu: "Close menu" },
  lang: { group: "Language", en: "Switch to English", zh: "切换到中文" },
  music: {
    play: "Play soft background music",
    stop: "Turn the music off",
    soon: "Background music coming soon",
    on: "Music on",
    off: "Music off",
    soonHint: "Music coming soon",
  },
  night: { toDay: "Put out the lamp and return to day", day: "Day" },
  lamp: { light: "Light up the garden", dark: "Return to daylight" },
  footer: { rights: "Zhinuo Wang · A Garden of Ideas", note: "The garden illustrations are decorative and are not project work." },
  newTab: "(opens in a new tab)",
  category: { personal: "Personal Project", academic: "Academic Project" },
  categoryShort: { personal: "Personal project", academic: "Academic project" },
  landing: {
    thoughts: "Thoughts",
    mailbox: "Contact: write to Zhinuo",
    mailboxHint: "Write to me ✉",
  },
  work: {
    heading: "Choose a place to explore my work.",
    landmark: (title: string, category: "personal" | "academic", place: string) =>
      `${title}, ${category} project. Walk to ${place.replace(/^The /, "the ")} and open it`,
  },
  cs: {
    back: "Back to Work",
    next: "Next Project",
    more: "More projects",
    contents: "contents",
    contentsLabel: "Contents",
    toWrite: "to write —",
    pending: "To be provided",
    zoom: "View full size",
    zoomHint: "Pinch to zoom · double-tap to zoom in or out",
    zoomClose: "Close the full-size image",
  },
  aurelle: {
    video: "AURELLE, AI skincare commercial (1 minute, with sound)",
    noVideo: "Your browser can’t play this video here.",
  },
  about: {
    meet: "Meet the Gardener",
    caption: "the gardener",
    role: "UX/UI & Product Designer · Toronto",
    resume: "Download Resume",
    pdf: "(PDF)",
    education: "Education",
    educationNote: "where I studied",
    experience: "Professional Experience",
    experienceNote: "what I've worked on",
    skills: "Skills",
    skillsNote: "tools in my shed",
    software: "Software",
    professional: "Professional",
    interpersonal: "Interpersonal",
  },
  contact: {
    title: "Let’s stay in touch.",
    email: "Email",
    emailSub: "Send a note",
    linkedin: "LinkedIn",
    linkedinSub: "View my profile ↗",
    wechat: "WeChat",
    wechatSub: "Scan my QR code",
    openMailbox: "Open the mailbox",
    closeMailbox: "Close the mailbox",
    thanks: "Thanks for stopping by my garden!",
    qrAlt: "Zhinuo Wang's WeChat QR code (WeChat name 小诺., Toronto, Canada)",
    scan: "Scan with WeChat to add me.",
    qrPlaceholder: "Placeholder: WeChat QR code not added yet",
    qrSoonTitle: "QR code",
    qrSoon: "coming soon",
    qrSoonText: "My WeChat QR code will be here soon. Until then, email is the quickest way to reach me:",
    close: "Close",
  },
};

export type Ui = typeof en;

const zh: Ui = {
  brand: "A Garden of Ideas",
  designer: "王之诺",
  skip: "跳到正文",
  nav: { label: "主导航", home: "A Garden of Ideas — 首页", about: "关于我", work: "作品", contact: "联系我", openMenu: "打开菜单", closeMenu: "关闭菜单" },
  lang: { group: "语言", en: "Switch to English", zh: "切换到中文" },
  music: {
    play: "播放轻柔的背景音乐",
    stop: "关闭背景音乐",
    soon: "背景音乐即将上线",
    on: "音乐已开启",
    off: "音乐已关闭",
    soonHint: "音乐即将上线",
  },
  night: { toDay: "熄灭路灯，回到白天", day: "白天" },
  lamp: { light: "点亮花园", dark: "回到白天" },
  footer: { rights: "王之诺 · A Garden of Ideas", note: "花园插画仅作装饰，并非项目作品。" },
  newTab: "（在新标签页中打开）",
  category: { personal: "个人项目", academic: "学术项目" },
  categoryShort: { personal: "个人项目", academic: "学术项目" },
  landing: {
    thoughts: "随想",
    mailbox: "联系我：给之诺写封信",
    mailboxHint: "给我写信 ✉",
  },
  work: {
    heading: "选一处角落，看看我的作品吧。",
    landmark: (title, category, place) => `${title}，${category === "academic" ? "学术项目" : "个人项目"}。走到${place}，打开这个项目`,
  },
  cs: {
    back: "返回作品",
    next: "下一个项目",
    more: "更多项目",
    contents: "目录",
    contentsLabel: "目录",
    toWrite: "待补充 —",
    pending: "待补充",
    zoom: "查看大图",
    zoomHint: "双指缩放 · 双击放大或还原",
    zoomClose: "关闭大图",
  },
  aurelle: {
    video: "AURELLE，AI 护肤广告片（1 分钟，有声）",
    noVideo: "你的浏览器暂时无法在这里播放此视频。",
  },
  about: {
    meet: "认识这位园丁",
    caption: "", // no caption under the photo in Chinese
    role: "UX/UI 与产品设计师 · 多伦多",
    resume: "下载中文简历",
    pdf: "（PDF）",
    education: "教育背景",
    educationNote: "我求学的地方",
    experience: "工作经验",
    experienceNote: "我做过的事",
    skills: "专业技能",
    skillsNote: "工具棚里的家当",
    software: "软件技能",
    professional: "专业技能",
    interpersonal: "人际技能",
  },
  contact: {
    title: "保持联系吧。",
    email: "邮箱",
    emailSub: "给我写封信",
    linkedin: "领英 LinkedIn",
    linkedinSub: "查看我的主页 ↗",
    wechat: "微信",
    wechatSub: "扫描我的二维码",
    openMailbox: "打开信箱",
    closeMailbox: "关上信箱",
    thanks: "谢谢你来我的花园坐坐！",
    qrAlt: "王之诺的微信二维码（微信名：小诺.，加拿大多伦多）",
    scan: "用微信扫一扫，加我为好友。",
    qrPlaceholder: "占位：微信二维码尚未添加",
    qrSoonTitle: "二维码",
    qrSoon: "即将添加",
    qrSoonText: "我的微信二维码很快就会放在这里。在此之前，发邮件是联系我最快的方式：",
    close: "关闭",
  },
};

export const UI: Record<Locale, Ui> = { en, zh };

/** The interface strings for the visitor's language. */
export function useUi(): Ui {
  return UI[useLocale()];
}
