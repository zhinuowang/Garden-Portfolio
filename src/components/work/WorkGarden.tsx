"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import anchors from "@/data/work-anchors.json";
import { getProject } from "@/data/projects";

// The Work page: one compact painted garden with three project landmarks and a
// small guide. Hover (or focus) a landmark and it lifts, its label grows and the
// girl turns to look; click it and she walks over and shares a short moment with
// it — kneels to offer the puppy a treat and pat it, touches the fountain's water
// so two koi leap, or takes out her phone for a selfie with the windmill — then a soft
// paper wipe grows from the landmark into the project page. Landmarks are
// real links: Enter works, and with reduced motion they open straight away.
// All artwork is decorative (scripts/paint-landing.mjs --work); project content
// lives only on the project pages.

type Sprite = { name: string; kind: string; x: number; y: number; w: number; h: number; pivot: number[] };
type Landmark = { slug: string; kind: "fountain" | "doghouse" | "windmill"; hit: number[]; label: number[]; stand: number[]; face: number; layers: string[] };
type Composition = { start: number[]; girl: { w: number; h: number; feet: number[]; phone: number[] }; landmarks: Landmark[]; sprites: Sprite[] };

const POSES = ["idle", "walk-a", "walk-b", "reach", "offer", "pet-a", "pet-b", "turn", "phone", "phone-up", "selfie"] as const;
/** The landmarks rise into the garden in this order when the page opens. */
const ENTER_ORDER = { doghouse: 0, fountain: 1, windmill: 2 } as const;
/** How long each moment plays before the page turns. */
const MOMENT_MS = { doghouse: 2100, fountain: 1900, windmill: 2400 } as const;
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
      stageRef.current?.setAttribute("data-moment", m.kind);
      if (m.kind === "doghouse") {
        // kneel and hold out a treat, then pat the puppy a few times
        setFace(m.face);
        setPose("offer");
        let pat = 0;
        later(() => {
          const patting = window.setInterval(() => setPose(pat++ % 2 ? "pet-b" : "pet-a"), 260);
          timers.current.push(patting);
          later(() => clearInterval(patting), 1300);
        }, 700);
      } else if (m.kind === "fountain") {
        setFace(m.face);
        setPose("reach");
      } else {
        // the selfie: turn to the viewer, take the phone out, lift it, hold it up beside her
        setFace(1);
        setPose("turn");
        later(() => setPose("phone"), 260);
        later(() => setPose("phone-up"), 560);
        later(() => setPose("selfie"), 860);
      }
    }, ms);
    // then a soft paper wipe from the landmark into the project
    const hold = MOMENT_MS[m.kind];
    later(() => {
      const r = stageRef.current!.getBoundingClientRect();
      setWipe({ x: r.left + (m.hit[0] + m.hit[2] / 2) * r.width, y: r.top + (m.hit[1] + m.hit[3] / 2) * r.height });
    }, ms + hold);
    later(() => router.push(`/work/${m.slug}`), ms + hold + 750);
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
        {/* night: a moonlit wash over the painted garden (fades in with the lamp) */}
        <span aria-hidden="true" className="work-night absolute inset-0" />

        {/* landmarks: their layers, a soft discoverability glow, the label, and the link over them */}
        {c.landmarks.map((m, i) => {
          const p = getProject(m.slug)!;
          const state = active === m.slug ? "active" : hover === m.slug ? "hover" : "idle";
          return (
            <div key={m.slug} className="work-landmark" data-kind={m.kind} data-state={state} style={{ ["--i" as string]: i, ["--enter" as string]: ENTER_ORDER[m.kind] } as React.CSSProperties}>
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
                <>
                  <span aria-hidden="true" className="absolute" style={{ left: pct(m.hit[0]), top: pct(m.hit[1]), width: pct(m.hit[2]), height: pct(m.hit[3]) }}>
                    {[[30, 62, 0], [44, 58, 0.3], [58, 64, 0.15], [70, 60, 0.45], [50, 40, 0.6]].map(([l, t, d], j) => (
                      <span key={j} className="work-bubble absolute" style={{ left: `${l}%`, top: `${t}%`, animationDelay: `${d}s` }} />
                    ))}
                  </span>
                  {/* rings on the water: where she touches it, and where each koi leaps out and dives back in */}
                  {(() => {
                    const a = sprite("work-fish-a"), b = sprite("work-fish-b");
                    const ay = a.y + a.h / 2, step = (b.x - a.x) * 0.8;
                    return [[b.x + b.w * 0.9, ay, 0], [a.x + a.w / 2, ay, 0.25], [a.x + a.w / 2 + step, ay, 0.8], [b.x + b.w / 2, ay, 0.6], [b.x + b.w / 2 - step, ay, 1.15]].map(([x, y, d], j) => (
                      <span key={j} aria-hidden="true" className="work-ripple absolute" style={{ left: pct(x), top: pct(y), width: pct(a.w * 0.9), animationDelay: `${d}s` }} />
                    ));
                  })()}
                </>
              )}
              {m.kind === "doghouse" && (() => {
                const pup = sprite("work-puppy");
                return [[0.35, 0.05, 0.75], [0.6, -0.05, 1.2], [0.2, -0.12, 1.6]].map(([u, v, d], j) => (
                  <span key={j} aria-hidden="true" className="work-heart absolute" style={{ left: pct(pup.x + pup.w * u), top: pct(pup.y + pup.h * v), animationDelay: `${d}s` }}>
                    ♥
                  </span>
                ));
              })()}
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
            {/* the phone's flash: a small burst and a sparkle at the phone, never the whole screen */}
            <span aria-hidden="true" className="work-flash absolute" style={{ left: pct(c.girl.phone[0]), top: pct(c.girl.phone[1]) }} />
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
