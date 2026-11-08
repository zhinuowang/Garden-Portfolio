"use client";

import { setLocale, useLocale, type Locale } from "@/i18n/locale";
import { useUi } from "@/i18n/ui";

// EN / 中文: two quiet words in the header. The chosen one carries the same painted underline as the current
// page; switching changes only the words on the page (no reload), so the garden and its music carry on.
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
            <PaintedUnderline />
          </button>
        </span>
      ))}
    </div>
  );
}

/** A short, tapering brushstroke: the active page's (and language's) mark, drawn in on hover. */
export function PaintedUnderline() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 60 8" preserveAspectRatio="none" className="garden-nav__stroke">
      <path d="M2 5.2 C 14 3.2, 28 6.6, 42 4.4 C 49 3.4, 54 3.9, 58 3.6 C 54 5.6, 47 6.2, 40 6.4 C 27 7.4, 13 5.6, 2 5.2 Z" fill="currentColor" filter="url(#paint)" />
      <path d="M50 3.9 C 52.5 1.2, 55.5 0.6, 57.5 1.4 C 55.6 3, 53 3.9, 50 3.9 Z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
