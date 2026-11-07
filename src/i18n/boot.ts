// Shared by the server layout and the client locale store (kept out of the "use client" module so the layout
// can inline it as a plain string).

export type Locale = "en" | "zh";
export const LOCALE_KEY = "garden-locale";
/** The value written to <html lang> for each locale. */
export const HTML_LANG: Record<Locale, string> = { en: "en", zh: "zh-Hans" };

/**
 * Runs before first paint (inlined in layout.tsx). A visitor who chose 中文 gets <html lang="zh-Hans"> straight
 * away, and the page is held invisible for the moment it takes the client to swap the English the server sent
 * for the Chinese — so the English never flashes first. A timer lets it show regardless after 1.5 s, should
 * scripts fail.
 */
export const LOCALE_BOOT = `try{if(localStorage.getItem("${LOCALE_KEY}")==="zh"){var h=document.documentElement;h.lang="${HTML_LANG.zh}";h.dataset.locale="zh";h.dataset.localePending="";setTimeout(function(){delete h.dataset.localePending},1500)}}catch(e){}`;
