"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "./locale";
import { pageTitle } from "./content";

/**
 * Keeps the document in step with the language: reveals the page once the Chinese has replaced the server's
 * English (see LOCALE_BOOT), and names the browser tab in the visitor's language on every page.
 */
export default function LocaleSync() {
  const locale = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    // the hydration pass still renders English; reveal only once the rendered language is the chosen one
    const html = document.documentElement;
    if (locale === (html.dataset.locale === "zh" ? "zh" : "en")) delete html.dataset.localePending;
  }, [locale]);

  useEffect(() => {
    const title = pageTitle(pathname, locale);
    if (!title) return;
    // Next writes the route's own (English) title whenever it likes; put ours back each time it does
    const apply = () => {
      if (document.title !== title) document.title = title;
    };
    apply();
    const watch = new MutationObserver(apply);
    // (Next may stream the <title> into <body>, so watch the whole document — child and text changes only)
    watch.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    return () => watch.disconnect();
  }, [pathname, locale]);

  return null;
}
