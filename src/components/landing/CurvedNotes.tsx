"use client";

import { Fragment, useEffect, useRef } from "react";

type Phrase = { x: number; y: number; lines: string[] };
type Composition = { viewBox: number[]; phrases: Phrase[] };

/** Split a sentence into `n` lines of roughly equal length, at word boundaries. */
function splitLines(text: string, n: number) {
  const words = text.split(" ");
  const lines: string[][] = [];
  let rest = words;
  for (let l = n; l > 1; l--) {
    const target = rest.join(" ").length / l;
    let len = 0, i = 0;
    while (i < rest.length - 1 && len + rest[i].length / 2 < target) len += rest[i++].length + 1;
    lines.push(rest.slice(0, Math.max(1, i)));
    rest = rest.slice(Math.max(1, i));
  }
  lines.push(rest);
  return lines;
}

/**
 * Scene-2 thoughts written along gentle curves that follow the painted hills
 * (curves measured by scripts/paint-landing.mjs). Each note's words appear one
 * after another as it scrolls up into view, tied to scroll position so they
 * emerge with the visitor's movement. Without JavaScript the words are simply
 * shown; with reduced motion they fade without rising.
 */
export default function CurvedNotes({ texts, desktop, mobile }: { texts: string[]; desktop: Composition; mobile: Composition }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const notes = Array.from(root.querySelectorAll<SVGGElement>("[data-note]")).map((g) => ({ g, words: Array.from(g.querySelectorAll<SVGTSpanElement>("tspan")) }));
    const update = () => {
      const vh = window.innerHeight;
      for (const { g, words } of notes) {
        const box = g.getBoundingClientRect();
        if (box.width === 0) continue; // the other composition, hidden at this size
        const mid = box.top + box.height / 2;
        // begins as the note passes 92% of the screen height, complete by 52%
        const p = Math.min(1, Math.max(0, (vh * 0.92 - mid) / (vh * 0.4)));
        const n = words.length;
        words.forEach((w, i) => {
          w.style.opacity = String(Math.min(1, Math.max(0, (p * (n + 2.5) - i) / 2.5)));
        });
        g.style.transform = still ? "" : `translateY(${((1 - p) * 14).toFixed(1)}px)`;
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

  const draw = (c: Composition, key: string, fontSize: number, className: string) => (
    <svg viewBox={`0 0 ${c.viewBox[0]} ${c.viewBox[1]}`} className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden="true" focusable="false">
      <defs>
        {c.phrases.map((ph, i) => ph.lines.map((d, l) => <path key={`${i}-${l}`} id={`note-${key}-${i}-${l}`} d={d} />))}
      </defs>
      {c.phrases.map((ph, i) => {
        const lines = splitLines(texts[i] ?? "", ph.lines.length);
        return (
          <g key={i} data-note style={{ transition: "transform 0.25s linear" }}>
            {lines.map((words, l) => (
              <text
                key={l}
                fontSize={fontSize}
                fontWeight={600}
                fill="#2a3624"
                stroke="rgb(246 242 214 / 0.72)"
                strokeWidth={fontSize * 0.12}
                strokeLinejoin="round"
                paintOrder="stroke"
                style={{ fontFamily: "var(--font-caveat), cursive" }}
              >
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

  return (
    <div ref={ref}>
      {draw(desktop, "d", 84, "portrait-art:hidden")}
      {draw(mobile, "m", 84, "hidden portrait-art:block")}
      <div className="sr-only">
        {texts.map((t) => (
          <p key={t}>{t}</p>
        ))}
      </div>
    </div>
  );
}
