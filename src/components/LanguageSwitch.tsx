"use client";

import { setLocale, useLocale, type Locale } from "@/i18n/locale";
import { useUi } from "@/i18n/ui";

// EN / 中文: two quiet words in the header. The chosen one carries the same thin underline as the current page;
// switching changes only the words on the page (no reload), so the garden and its music carry on.
const OPTIONS: { id: Locale; label: string; lang: string }[] = [
  { id: "en", label: "EN", lang: "en" },
  { id: "zh", label: "中文", lang: "zh-Hans" },
];

export default function LanguageSwitch() {
  const locale = useLocale();
  const t = useUi().lang;
  return (
    <div role="group" aria-label={t.group} className="garden-lang flex items-center">
      {OPTIONS.map((o, i) => (
        <span key={o.id} className="flex items-center">
          {i > 0 && <span aria-hidden="true" className="garden-lang__slash">/</span>}
          <button
            type="button"
            lang={o.lang}
            aria-pressed={locale === o.id}
            aria-label={o.id === "en" ? t.en : t.zh}
            title={o.id === "en" ? t.en : t.zh}
            onClick={() => locale !== o.id && setLocale(o.id)}
            className="garden-nav__item garden-lang__option"
          >
            {o.label}
          </button>
        </span>
      ))}
    </div>
  );
}
