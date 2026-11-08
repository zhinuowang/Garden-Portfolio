"use client";

import { Fragment, useEffect, useRef } from "react";

type Phrase = { lines: string[] };
type Composition = { viewBox: number[]; noteFont: number; phrases: Phrase[] };

const SMALL_WORDS = new Set(["in", "as", "into", "the", "a", "of", "to", "and"]);

const CJK = /[\u3000-\u9fff\uff00-\uffef]/;

/**
 * The units a thought is written in, word by word: English words, or — for Chinese, which has no spaces — its
 * characters, each punctuation mark kept with the character before it.
 */
function units(text: string) {
  if (!CJK.test(text)) return { parts: text.split(" "), gap: " " };
  const parts: string[] = [];
  for (const ch of Array.from(text)) {
    // punctuation — and a zero-width space marking the preferred line break — stays with the character before it
    if (/[，。、！？；：”’）\u200b]/.test(ch) && parts.length) parts[parts.length - 1] += ch;
    else parts.push(ch);
  }
  return { parts, gap: "" };
}

/** Split a sentence into `n` (1 or 2) lines as evenly as possible, preferring a break before a small word (or after a Chinese comma). */
function splitLines(text: string, n: number) {
  const { parts: words, gap } = units(text);
  const len = (w: string[]) => w.join(gap).length * (gap ? 1 : 2.1); // a Chinese character is about two Latin letters wide
  if (n < 2 || words.length < 2) return { lines: [words], gap };
  let best = 1, bestScore = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = len(words.slice(0, i)), b = len(words.slice(i));
    const nice = gap ? SMALL_WORDS.has(words[i].toLowerCase()) : /[，、\u200b]$/.test(words[i - 1]);
    const score = Math.max(a, b) - (nice ? 2.5 * (gap ? 1 : 2.1) : 0);
    if (score < bestScore) { bestScore = score; best = i; }
  }
  return { lines: [words.slice(0, best), words.slice(best)], gap };
}

/**
 * Scene-2 thoughts written along real hill edges: each line's baseline is the
 * crest line of a painted hill (measured by scripts/paint-landing.mjs), so the
 * words rest in the shaded hollow just above it.
 *
 * Reveal: nothing shows until the visitor scrolls into the scene. As it comes
 * up the screen, each thought in turn (at 30%, 55% and 80% of the way) is
 * written in word by word; if they are reached together (a quick scroll, or
 * the page settling) they still follow one another about 0.8 s apart. Scrolling
 * back above the scene hides them again so the walk can be repeated. The fade
 * uses fill-opacity, which every browser applies to individual words in SVG
 * text (plain opacity on a <tspan> is ignored by some). Screen readers get a
 * plain copy; without JavaScript the words are simply shown.
 */
export default function CurvedNotes({ texts, desktop, mobile }: { texts: string[]; desktop: Composition; mobile: Composition }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    const section = root?.closest("section");
    if (!root || !section) return;
    root.dataset.ready = "true";
    const notes = Array.from(root.querySelectorAll<SVGGElement>("[data-note]"));
    const THRESHOLDS = [0.3, 0.55, 0.8];
    let nextFree = 0; // when the next thought may start, so they never arrive all at once
    const update = () => {
      const vh = window.innerHeight;
      // 0 while the scene is still below the screen, 1 once it has settled at the top
      const q = Math.min(1, Math.max(0, (vh * 0.9 - section.getBoundingClientRect().top) / (vh * 0.9)));
      const now = performance.now();
      for (const g of notes) {
        const i = Number(g.dataset.note);
        const shown = g.hasAttribute("data-shown");
        const visible = g.getBoundingClientRect().width > 0; // the other composition is hidden at this size
        if (!shown && q >= THRESHOLDS[i] && !visible) {
          g.setAttribute("data-shown", "");
        } else if (!shown && q >= THRESHOLDS[i]) {
          const delay = Math.max(0, nextFree - now);
          g.style.setProperty("--note-delay", `${delay}ms`);
          g.setAttribute("data-shown", "");
          nextFree = now + delay + 800;
        } else if (shown && q < 0.05) {
          g.removeAttribute("data-shown");
          nextFree = 0;
        }
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
          const { lines, gap } = splitLines(texts[i] ?? "", ph.lines.length);
          return (
            <g key={i} data-note={i} filter={`url(#note-halo-${key})`} className="curved-note">
              {lines.map((words, l) => (
                <text key={l} fontSize={f} fontWeight={600} fill="#fcf7ea" letterSpacing={f * 0.01} style={{ fontFamily: "\"Garden Hei\", var(--font-caveat), cursive" }}>
                  <textPath href={`#note-${key}-${i}-${l}`} startOffset="50%" textAnchor="middle">
                    {words.map((w, j) => (
                      <Fragment key={j}>
                        <tspan className="note-word" style={{ "--word": j } as React.CSSProperties}>
                          {w}
                        </tspan>
                        {j < words.length - 1 ? gap : ""}
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
