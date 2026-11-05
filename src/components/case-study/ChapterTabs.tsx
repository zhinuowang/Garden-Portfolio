"use client";

import { useEffect, useRef, useState } from "react";

// The chapter bar: a row of tabs like the browser-tab bar on each page of the
// original deck. It stays under the site header while reading, links to each
// chapter, and marks the one in view.
export default function ChapterTabs({ chapters }: { chapters: { id: string; tab: string }[] }) {
  const [current, setCurrent] = useState(chapters[0]?.id);
  const bar = useRef<HTMLOListElement>(null);

  // keep the current tab visible in the bar when it scrolls sideways (narrow screens)
  useEffect(() => {
    const ol = bar.current, tab = ol?.querySelector<HTMLElement>('[aria-current="true"]');
    if (ol && tab) ol.scrollTo({ left: tab.offsetLeft - ol.clientWidth / 2 + tab.offsetWidth / 2, behavior: "smooth" });
  }, [current]);

  useEffect(() => {
    const els = chapters.map((c) => document.getElementById(c.id)).filter((e): e is HTMLElement => !!e);
    const update = () => {
      const line = window.innerHeight * 0.3;
      let id = chapters[0]?.id;
      for (const el of els) if (el.getBoundingClientRect().top <= line) id = el.id;
      setCurrent(id);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [chapters]);

  return (
    <nav aria-label="Case study chapters" className="sticky top-[111px] sm:top-[67px] z-30 -mx-4 bg-cream/90 px-4 pt-2 backdrop-blur-md sm:-mx-6 sm:px-6">
      <ol ref={bar} className="flex gap-1 overflow-x-auto rounded-t-xl bg-[#2b2b2b] px-2 pt-2 [scrollbar-width:none]">
        {chapters.map((c) => {
          const on = c.id === current;
          return (
            <li key={c.id} className="shrink-0">
              <a
                href={`#${c.id}`}
                aria-current={on ? "true" : undefined}
                className={`block whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-medium transition-colors ${on ? "bg-[#eef0f3] text-ink" : "bg-[#4a4a4a] text-white/75 hover:bg-[#5a5a5a] hover:text-white"}`}
              >
                {c.tab}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
