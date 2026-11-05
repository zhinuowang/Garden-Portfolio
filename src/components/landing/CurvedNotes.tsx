"use client";

import { Fragment, useEffect, useRef } from "react";

type Phrase = { lines: string[] };
type Composition = { viewBox: number[]; noteFont: number; phrases: Phrase[] };

const SMALL_WORDS = new Set(["in", "as", "into", "the", "a", "of", "to", "and"]);

/** Split a sentence into `n` (1 or 2) lines as evenly as possible, preferring a break before a small word. */
function splitLines(text: string, n: number) {
  const words = text.split(" ");
  if (n < 2 || words.length < 2) return [words];
  let best = 1, bestScore = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length, b = words.slice(i).join(" ").length;
    const score = Math.max(a, b) - (SMALL_WORDS.has(words[i].toLowerCase()) ? 2.5 : 0);
    if (score < bestScore) { bestScore = score; best = i; }
  }
  return [words.slice(0, best), words.slice(best)];
}

/**
 * Scene-2 thoughts written along real hill edges: each line's baseline is the
 * crest line of a painted hill (measured by scripts/paint-landing.mjs), so the
 * words rest in the shaded hollow just above it. As the scene arrives, the
 * notes appear one after another, word by word, tied to scroll position, and
 * are complete when the scene settles. Screen readers get a plain copy;
 * without JavaScript the words are simply shown.
 */
export default function CurvedNotes({ texts, desktop, mobile }: { texts: string[]; desktop: Composition; mobile: Composition }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    const section = root?.closest("section");
    if (!root || !section) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const notes = Array.from(root.querySelectorAll<SVGGElement>("[data-note]")).map((g) => ({
      g,
      i: Number(g.dataset.note),
      words: Array.from(g.querySelectorAll<SVGTSpanElement>("tspan")),
    }));
    const update = () => {
      const vh = window.innerHeight;
      // 0 while the scene is still low on the screen, 1 once it has settled at the top
      const q = Math.min(1, Math.max(0, (vh * 0.85 - section.getBoundingClientRect().top) / (vh * 0.85)));
      for (const { g, i, words } of notes) {
        const p = Math.min(1, Math.max(0, (q - i * 0.2) / 0.45));
        const n = words.length;
        words.forEach((w, j) => {
          w.style.opacity = String(Math.min(1, Math.max(0, (p * (n + 2.5) - j) / 2.5)));
        });
        g.style.transform = still ? "" : `translateY(${((1 - p) * 10).toFixed(1)}px)`;
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const draw = (c: Composition, key: string, className: string) => {
    const f = c.noteFont;
    return (
      <svg viewBox={`0 0 ${c.viewBox[0]} ${c.viewBox[1]}`} className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden="true" focusable="false">
        <defs>
          {/* a soft dark halo, like shade in the grass, so the cream writing reads anywhere */}
          <filter id={`note-halo-${key}`} x="-5%" y="-60%" width="110%" height="220%">
            <feMorphology in="SourceAlpha" operator="dilate" radius={f * 0.05} result="grown" />
            <feGaussianBlur in="grown" stdDeviation={f * 0.14} result="soft" />
            <feFlood floodColor="#1d2b1c" floodOpacity="0.5" />
            <feComposite in2="soft" operator="in" result="halo" />
            <feMerge>
              <feMergeNode in="halo" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {c.phrases.map((ph, i) => ph.lines.map((d, l) => <path key={`${i}-${l}`} id={`note-${key}-${i}-${l}`} d={d} />))}
        </defs>
        {c.phrases.map((ph, i) => {
          const lines = splitLines(texts[i] ?? "", ph.lines.length);
          return (
            <g key={i} data-note={i} filter={`url(#note-halo-${key})`} style={{ transition: "transform 0.3s ease-out" }}>
              {lines.map((words, l) => (
                <text key={l} fontSize={f} fontWeight={600} fill="#fcf7ea" letterSpacing={f * 0.01} style={{ fontFamily: "var(--font-caveat), cursive" }}>
                  <textPath href={`#note-${key}-${i}-${l}`} startOffset="50%" textAnchor="middle">
                    {words.map((w, j) => (
                      <Fragment key={j}>
                        <tspan style={{ transition: "opacity 0.35s ease" }}>{w}</tspan>
                        {j < words.length - 1 ? " " : ""}
                      </Fragment>
                    ))}
                  </textPath>
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div ref={ref}>
      {draw(desktop, "d", "portrait-art:hidden")}
      {draw(mobile, "m", "hidden portrait-art:block")}
      <div className="sr-only">
        {texts.map((t) => (
          <p key={t}>{t}</p>
        ))}
      </div>
    </div>
  );
}
