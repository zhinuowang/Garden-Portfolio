"use client";

import { useEffect, useState } from "react";
import { useUi } from "@/i18n/ui";

// The journal's contents: a quiet index in the margin on wide screens (marking
// the section being read), and a folded list at the top on small ones.
export default function JournalContents({ sections }: { sections: { id: string; heading: string }[] }) {
  const [current, setCurrent] = useState(sections[0]?.id);
  const t = useUi().cs;

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const update = () => {
      let id = sections[0]?.id;
      for (const el of els) if (el.getBoundingClientRect().top <= window.innerHeight * 0.3) id = el.id;
      setCurrent(id);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sections]);

  const list = (
    <ol className="space-y-1">
      {sections.map((s, i) => {
        const on = s.id === current;
        return (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={on ? "true" : undefined}
              className={`group flex gap-2.5 rounded-lg py-1.5 pr-2 text-sm leading-snug transition-colors ${on ? "text-forest" : "text-ink-soft hover:text-forest"}`}
            >
              <span className={`mt-[0.45em] h-px shrink-0 transition-all ${on ? "w-5 bg-moss" : "w-2.5 bg-moss/40 group-hover:w-4"}`} />
              <span className={on ? "font-semibold" : ""}>
                <span className="mr-1.5 font-serif text-moss">{String(i + 1).padStart(2, "0")}</span>
                {s.heading}
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      <nav aria-label={t.contentsLabel} data-contents className="sticky top-24 hidden max-h-[calc(100svh-7rem)] self-start overflow-y-auto lg:block">
        <p className="mb-3 font-hand text-2xl text-moss">{t.contents}</p>
        {list}
      </nav>
      <details className="journal-fold mb-6 rounded-2xl border border-moss/25 bg-paper/80 px-4 py-3 lg:hidden">
        <summary className="cursor-pointer font-hand text-2xl text-moss">{t.contents}</summary>
        <nav aria-label={t.contentsLabel} className="mt-2">{list}</nav>
      </details>
    </>
  );
}
