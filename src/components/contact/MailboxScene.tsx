"use client";

import { useState } from "react";
import { contact } from "@/data/site";
import { Clouds, ForegroundStems, PaintedHill, Wildflowers } from "../garden/Painted";

// Decorative garden mailbox (Category A). The envelope is a small delight only:
// the email address is always shown as a plain link on the page as well.

function Mailbox({ raised }: { raised: boolean }) {
  return (
    <svg viewBox="0 0 220 300" className="w-full" aria-hidden="true" focusable="false">
      <g filter="url(#paint)">
        <ellipse cx="110" cy="288" rx="90" ry="10" fill="#7f9a66" opacity="0.6" />
        {/* post wrapped in a flowering vine */}
        <path d="M100 290 V150 H120 V290 Z" fill="#a27a5e" />
        <path d="M104 286 C 130 260, 92 240, 118 214 C 136 196, 96 180, 112 160" stroke="#6f8a5a" strokeWidth="3" fill="none" />
        {[[118, 214], [106, 240], [114, 178], [124, 262]].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="5" fill="#e9afab" />
        ))}
        {/* box */}
        <path d="M30 150 V100 C 30 62, 60 44, 96 44 H160 C 190 44, 200 70, 200 100 V150 Z" fill="#e8b3a3" />
        <path d="M30 150 V100 C 30 62, 60 44, 96 44 C 128 44, 140 70, 140 100 V150 Z" fill="#f2c5b4" />
        <path d="M44 150 V104 C 44 76, 66 60, 92 60 C 116 60, 126 80, 126 104 V150 Z" fill="#7a5a4c" opacity="0.85" />
        <path d="M30 150 H200" stroke="#c98f7f" strokeWidth="4" />
        <circle cx="170" cy="96" r="5" fill="#c98f7f" />
      </g>
      {/* flag lifts when the letter is opened */}
      <g style={{ transform: raised ? "rotate(-80deg)" : "rotate(0deg)", transformOrigin: "184px 120px", transition: "transform 0.6s cubic-bezier(.3,1.4,.5,1)" }}>
        <path d="M184 120 H192 V70 H184 Z" fill="#8a6a52" />
        <path d="M192 70 H222 V92 H192 Z" fill="#d9776a" filter="url(#paint)" />
      </g>
    </svg>
  );
}

export default function MailboxScene() {
  const [open, setOpen] = useState(false);

  return (
    <div className="paper-grain relative min-h-[100svh] overflow-hidden">
      {/* landscape */}
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="cSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f2c9c7" />
            <stop offset="0.5" stopColor="#f7d9cb" />
            <stop offset="1" stopColor="#f6e7d7" />
          </linearGradient>
        </defs>
        <rect width="1600" height="1000" fill="url(#cSky)" />
        <g className="drift">
          <Clouds
            items={[
              { cx: 300, cy: 160, rx: 300, ry: 40, color: "#eaa5a6", o: 0.45 },
              { cx: 1250, cy: 200, rx: 320, ry: 44, color: "#f3b694", o: 0.45 },
              { cx: 780, cy: 320, rx: 380, ry: 22, color: "#f6c6b0", o: 0.5 },
            ]}
          />
        </g>
        <PaintedHill seed={51} points={[[0, 640], [400, 610], [800, 636], [1200, 604], [1600, 630]]} base="#c3c6ab" strokes={["#aeb796", "#cfd1b4"]} density={0.3} angle={-3} />
        <PaintedHill seed={52} points={[[0, 760], [360, 724], [760, 752], [1180, 720], [1600, 748]]} base="#acbd83" strokes={["#95ab6f", "#bfc98d", "#7f9a66", "#d0cf98"]} density={0.8} angle={-9} />
        <Wildflowers seed={53} count={200} x={[0, 1600]} y={[770, 1000]} size={[1.5, 8]} colors={["#f2b8a0", "#e9afab", "#fbf3ea", "#fbf3ea", "#e3bf73", "#c9b8d8"]} />
        <ForegroundStems seed={9} xs={[50, 140, 1440, 1530]} bottom={1000} height={180} colors={["#fbf3ea", "#e9afab", "#f2b8a0"]} />
      </svg>

      <div className="relative mx-auto grid min-h-[100svh] max-w-5xl items-center gap-8 px-5 pt-28 pb-16 md:grid-cols-2">
        <div className="text-center md:text-left">
          <p className="font-hand text-2xl text-rose">the garden gate is always open</p>
          <h1 className="font-serif text-[clamp(2.6rem,6vw,4.4rem)] leading-[1.02] font-medium">Leave a Little Note</h1>
          <p className="mt-4 text-lg text-ink-soft">For opportunities, collaborations, or a friendly hello.</p>
          <p className="mt-6">
            <a href={`mailto:${contact.email}`} className="font-serif text-[clamp(1.2rem,2.6vw,1.6rem)] text-forest underline decoration-forest/40 underline-offset-4 hover:decoration-forest">
              {contact.email}
            </a>
          </p>
          {contact.links.length > 0 && (
            <ul className="mt-4 space-y-1">
              {contact.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-ink-soft underline-offset-4 hover:text-forest hover:underline">
                    {l.label} <span aria-hidden="true">↗</span>
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          {/* the letter that rises from the mailbox */}
          <div
            className={`absolute inset-x-6 top-[6%] z-10 -rotate-3 rounded-[4px] bg-paper p-5 text-center shadow-[0_20px_40px_-22px_rgb(64_88_60/0.8)] transition-all duration-700 ease-[cubic-bezier(.2,.9,.3,1.2)] ${
              open ? "-translate-y-[58%] opacity-100" : "pointer-events-none translate-y-[20%] opacity-0"
            }`}
            aria-hidden={!open}
          >
            <p className="font-hand text-2xl text-ink">Thank you for visiting!</p>
            <p className="mt-1 text-sm text-ink-soft">Write to me at</p>
            <a href={`mailto:${contact.email}`} tabIndex={open ? 0 : -1} className="mt-1 inline-block break-all font-medium text-forest underline underline-offset-4">
              {contact.email}
            </a>
          </div>

          <Mailbox raised={open} />

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="absolute top-[24%] left-[17%] w-[34%] -rotate-6 rounded-md transition hover:-rotate-2 hover:scale-105"
          >
            <span className="sr-only">{open ? "Tuck the letter back in" : "Open the letter"}</span>
            <svg viewBox="0 0 120 80" className="w-full drop-shadow-md" aria-hidden="true">
              <g filter="url(#paint)">
                <rect x="4" y="8" width="112" height="68" rx="4" fill="#fbf5ea" />
                <path d="M4 12 L60 48 L116 12" stroke="#d9c8ad" strokeWidth="2.5" fill="none" />
                <path
                  d="M4 10 L60 46 L116 10 Z"
                  fill="#f6ecdb"
                  style={{ transform: open ? "scaleY(-1)" : "scaleY(1)", transformOrigin: "60px 10px", transition: "transform 0.5s" }}
                />
                <circle cx="60" cy="44" r="7" fill="#d9776a" />
              </g>
            </svg>
          </button>
          <p className="mt-2 text-center font-hand text-xl text-ink-soft" aria-hidden="true">
            {open ? "" : "psst — open the letter"}
          </p>
        </div>
      </div>
    </div>
  );
}
