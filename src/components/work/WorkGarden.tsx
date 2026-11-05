"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import anchors from "@/data/work-anchors.json";
import { getProject } from "@/data/projects";

// The Work page: one compact painted garden with three project landmarks and a
// small guide. Hover (or focus) a landmark and it lifts, its label grows and the
// girl turns to look; click it and she walks over, plays a short moment with it
// (kneels to the puppy, wakes the fountain, sets the windmill turning), then a
// soft paper wipe grows from the landmark into the project page. Landmarks are
// real links: Enter works, and with reduced motion they open straight away.
// All artwork is decorative (scripts/paint-landing.mjs --work); project content
// lives only on the project pages.

type Sprite = { name: string; kind: string; x: number; y: number; w: number; h: number; pivot: number[] };
type Landmark = { slug: string; kind: "fountain" | "doghouse" | "windmill"; hit: number[]; label: number[]; stand: number[]; face: number; layers: string[] };
type Composition = { start: number[]; girl: { w: number; h: number; feet: number[] }; landmarks: Landmark[]; sprites: Sprite[] };

const POSES = ["idle", "walk-a", "walk-b", "reach", "kneel"] as const;
type Pose = (typeof POSES)[number];
const src = (fmt: string, name: string) => `/assets/garden/work/sprites/${fmt}-${name.replace("work-", "")}.webp`;
const pct = (v: number) => `${v * 100}%`;

function Stage({ fmt, c, ratio, className }: { fmt: "desktop" | "mobile"; c: Composition; ratio: number; className: string }) {
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(c.start);
  const [walkMs, setWalkMs] = useState(0);
  const [pose, setPose] = useState<Pose>("idle");
  const [face, setFace] = useState(-1);
  const [hover, setHover] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [wipe, setWipe] = useState<{ x: number; y: number } | null>(null);
  const timers = useRef<number[]>([]);
  const busy = active !== null;
  const chosen = c.landmarks.find((l) => l.slug === active);
  const focusOrigin = chosen ? `${(chosen.hit[0] + chosen.hit[2] / 2) * 100}% ${(chosen.hit[1] + chosen.hit[3] / 2) * 100}%` : "50% 50%";

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const sprite = (name: string) => c.sprites.find((s) => s.name === name)!;
  const girl = c.sprites.find((s) => s.name === "work-girl-idle")!;

  const lookAt = useCallback((m: Landmark | null) => {
    if (busy || !m) return;
    setFace(m.hit[0] + m.hit[2] / 2 > pos[0] ? 1 : -1);
  }, [busy, pos]);

  const go = (e: React.MouseEvent, m: Landmark) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // the link simply opens the page
    e.preventDefault();
    if (busy) return;
    setActive(m.slug);
    router.prefetch(`/work/${m.slug}`);
    // walk: duration grows with distance (in stage widths), legs alternating, a gentle bob
    const dx = m.stand[0] - pos[0], dy = (m.stand[1] - pos[1]) / ratio;
    const ms = Math.round(Math.min(1800, Math.max(750, 550 + Math.hypot(dx, dy) * 2600)));
    setFace(dx >= 0 ? 1 : -1);
    setWalkMs(ms);
    setPos(m.stand);
    let step = 0;
    const stride = window.setInterval(() => setPose(step++ % 2 ? "walk-b" : "walk-a"), 160);
    later(() => {
      clearInterval(stride);
      setFace(m.face);
      setPose(m.kind === "doghouse" ? "kneel" : "reach");
      stageRef.current?.setAttribute("data-moment", m.kind);
    }, ms);
    // then a soft paper wipe from the landmark into the project
    later(() => {
      const r = stageRef.current!.getBoundingClientRect();
      setWipe({ x: r.left + (m.hit[0] + m.hit[2] / 2) * r.width, y: r.top + (m.hit[1] + m.hit[3] / 2) * r.height });
    }, ms + 1300);
    later(() => router.push(`/work/${m.slug}`), ms + 1300 + 750);
    timers.current.push(stride);
  };

  return (
    <div className={className}>
      <div
        ref={stageRef}
        className={`work-stage relative mx-auto overflow-hidden ${wipe ? "work-stage--leaving" : ""}`}
        style={{ aspectRatio: String(ratio), transformOrigin: focusOrigin, ["--ratio" as string]: String(ratio) } as React.CSSProperties}
      >
        <picture>
          <img
            src={`/assets/garden/work/garden-${fmt}-${fmt === "desktop" ? 1600 : 720}.webp`}
            srcSet={fmt === "desktop" ? "/assets/garden/work/garden-desktop-1600.webp 1600w, /assets/garden/work/garden-desktop-2400.webp 2400w" : "/assets/garden/work/garden-mobile-720.webp 720w, /assets/garden/work/garden-mobile-1080.webp 1080w"}
            sizes="100vw"
            alt=""
            className="absolute inset-0 block h-full w-full select-none"
            draggable={false}
          />
        </picture>

        {/* the guide's invitation, in the sky */}
        <div className="work-intro pointer-events-none absolute inset-x-0 top-[4%] px-4 text-center">
          <p className="font-hand text-[clamp(1.2rem,2vw,1.8rem)] leading-none text-rose">three little projects grow here</p>
          <p aria-hidden="true" className="mt-1 font-serif text-[clamp(1.5rem,3.6vw,3.2rem)] leading-tight font-medium text-ink">Choose a place in the garden</p>
          <p className="mt-1 text-[clamp(0.9rem,1.2vw,1.1rem)] text-ink-soft">Click a landmark and I&rsquo;ll walk you there.</p>
          <p className="mt-2 flex flex-wrap justify-center gap-2 text-[0.7rem] portrait-art:hidden font-semibold tracking-[0.12em] uppercase">
            <span className="work-label__badge work-label__badge--academic">Academic projects · fountain &amp; dog house</span>
            <span className="work-label__badge work-label__badge--personal">Personal project · windmill</span>
          </p>
        </div>

        {/* landmarks: their layers, a soft discoverability glow, the label, and the link over them */}
        {c.landmarks.map((m, i) => {
          const p = getProject(m.slug)!;
          const state = active === m.slug ? "active" : hover === m.slug ? "hover" : "idle";
          return (
            <div key={m.slug} className="work-landmark" data-kind={m.kind} data-state={state} style={{ ["--i" as string]: i } as React.CSSProperties}>
              <span aria-hidden="true" className="work-glow absolute" style={{ left: pct(m.hit[0] + m.hit[2] / 2), top: pct(m.hit[1] + m.hit[3] * 0.92), width: pct(m.hit[2] * 0.9) }} />
              {m.layers.map((name) => {
                const s = sprite(name);
                return (
                  // eslint-disable-next-line @next/next/no-img-element -- painted layer
                  <img
                    key={name}
                    src={src(fmt, name)}
                    alt=""
                    draggable={false}
                    className={`work-layer work-layer--${s.kind} pointer-events-none absolute h-auto select-none`}
                    style={{ left: pct(s.x), top: pct(s.y), width: pct(s.w), transformOrigin: `${s.pivot[0] * 100}% ${s.pivot[1] * 100}%` }}
                  />
                );
              })}
              {m.kind === "fountain" && (
                <span aria-hidden="true" className="absolute" style={{ left: pct(m.hit[0]), top: pct(m.hit[1]), width: pct(m.hit[2]), height: pct(m.hit[3]) }}>
                  {[[30, 62, 0], [44, 58, 0.3], [58, 64, 0.15], [70, 60, 0.45], [50, 40, 0.6]].map(([l, t, d], j) => (
                    <span key={j} className="work-bubble absolute" style={{ left: `${l}%`, top: `${t}%`, animationDelay: `${d}s` }} />
                  ))}
                </span>
              )}
              {m.kind === "doghouse" && (
                <span aria-hidden="true" className="work-heart absolute" style={{ left: pct(m.hit[0] + m.hit[2] * 0.72), top: pct(m.hit[1] + m.hit[3] * 0.25) }}>
                  ♥
                </span>
              )}
              <span aria-hidden="true" className="work-cue absolute" style={{ left: pct(m.hit[0] + m.hit[2] / 2), top: pct(m.hit[1] - 0.02) }}>
                <svg viewBox="0 0 20 14" className="h-full w-full">
                  <path d="M2 2 L10 11 L18 2" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span aria-hidden="true" className="work-label absolute" style={{ left: pct(m.label[0]), top: pct(m.label[1]) }}>
                <span className="work-label__title">{p.title}</span>
                <span className={`work-label__badge ${p.category === "academic" ? "work-label__badge--academic" : "work-label__badge--personal"}`}>
                  {p.category === "academic" ? "Academic project" : "Personal project"}
                </span>
              </span>
              <Link
                href={`/work/${m.slug}`}
                aria-label={`${p.title}, ${p.category} project. Walk to ${p.locationName.replace(/^The /, "the ")} and open it`}
                className="work-hit absolute"
                style={{ left: pct(m.hit[0]), top: pct(m.hit[1]), width: pct(m.hit[2]), height: pct(m.hit[3]) }}
                onMouseEnter={() => { setHover(m.slug); lookAt(m); }}
                onMouseLeave={() => setHover((h) => (h === m.slug ? null : h))}
                onFocus={() => { setHover(m.slug); lookAt(m); }}
                onBlur={() => setHover((h) => (h === m.slug ? null : h))}
                onClick={(e) => go(e, m)}
              />
            </div>
          );
        })}

        {/* the guide, anchored at her feet */}
        <div
          aria-hidden="true"
          className={`work-girl pointer-events-none absolute ${walkMs && pose.startsWith("walk") ? "work-girl--walking" : ""}`}
          data-pose={pose}
          style={{
            left: pct(pos[0]),
            top: pct(pos[1]),
            width: pct(girl.w),
            transform: `translate(-50%, -${c.girl.feet[1] * 100}%)`,
            transition: walkMs ? `left ${walkMs}ms ease-in-out, top ${walkMs}ms ease-in-out` : undefined,
          }}
        >
          <div className="work-girl__body relative" style={{ transform: face < 0 ? "scaleX(-1)" : undefined }}>
            <span className="block" style={{ aspectRatio: String((girl.w / girl.h) * ratio) }} />
            {POSES.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element -- painted guide, one layer per pose
              <img key={p} src={src(fmt, `work-girl-${p}`)} alt="" draggable={false} data-for={p} className="absolute inset-0 h-full w-full select-none" />
            ))}
          </div>
        </div>
      </div>
      {wipe && <span aria-hidden="true" className="work-wipe" style={{ ["--wx" as string]: `${wipe.x}px`, ["--wy" as string]: `${wipe.y}px` } as React.CSSProperties} />}
    </div>
  );
}

export default function WorkGarden() {
  return (
    <>
      <Stage fmt="desktop" c={anchors.desktop as Composition} ratio={16 / 9} className="portrait-art:hidden" />
      <Stage fmt="mobile" c={anchors.mobile as Composition} ratio={9 / 16} className="hidden portrait-art:block" />
    </>
  );
}
