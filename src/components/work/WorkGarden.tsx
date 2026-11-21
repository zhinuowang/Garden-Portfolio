"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import anchors from "@/data/work-anchors.json";
import { getProject } from "@/data/projects";
import { useLocale } from "@/i18n/locale";
import { placeName } from "@/i18n/content";
import { useUi } from "@/i18n/ui";

// The Work page: one painted garden, taller than the window. The first screen holds
// three project landmarks; a path leads down to a fourth (the greenhouse) in the
// lower garden, revealed as the visitor scrolls. A small guide lives in it. Hover (or focus) a landmark and it lifts, its label grows and the
// girl turns to look; click it and she walks over and shares a short moment with
// it — kneels to offer the puppy a treat and pat it, touches the fountain's water
// so two koi leap, takes out her phone for a selfie with the windmill, or opens the
// greenhouse door — then a soft paper wipe grows from the landmark into the project
// page. She keeps to the paths (a landmark may give waypoints) and passes behind
// whatever stands nearer the viewer. Landmarks are real links: Enter works, and
// with reduced motion they open straight away.
// All artwork is decorative (scripts/paint-landing.mjs --work); project content
// lives only on the project pages.

type Sprite = { name: string; kind: string; x: number; y: number; w: number; h: number; pivot: number[] };
type Landmark = { slug: string; kind: "fountain" | "doghouse" | "windmill" | "greenhouse"; base: number; hit: number[]; label: number[]; via?: number[][]; stand: number[]; face: number; layers: string[] };
/** All y values are fractions of the whole painting; `screen` is how much of it the first screen shows. */
type Composition = { screen: number; start: number[]; girl: { w: number; h: number; feet: number[]; phone: number[] }; landmarks: Landmark[]; sprites: Sprite[] };

const POSES = ["idle", "walk-a", "walk-b", "reach", "offer", "pet-a", "pet-b", "turn", "phone", "phone-up", "selfie"] as const;
/** The landmarks rise into the garden in this order when the page opens. */
const ENTER_ORDER = { doghouse: 0, fountain: 1, windmill: 2, greenhouse: 3 } as const;
/** How long each moment plays before the page turns. */
const MOMENT_MS = { doghouse: 2100, fountain: 1900, windmill: 2400, greenhouse: 1250 } as const;
/** Stacking by depth: whatever stands lower in the picture is nearer, so it is drawn over what is behind it. */
const depth = (y: number) => Math.round(y * 1000);
type Pose = (typeof POSES)[number];
const src = (fmt: string, name: string) => `/assets/garden/work/sprites/${fmt}-${name.replace("work-", "")}.webp`;
const pct = (v: number) => `${v * 100}%`;

/**
 * Her route as one smooth curve: a Catmull–Rom spline through the start, the landmark's waypoints and the spot
 * where she stops, sampled every few pixels, with the distance walked so far at each sample.
 */
function routePath(points: number[][], W: number, H: number) {
  const P = points.map(([x, y]) => [x * W, y * H]);
  const pts: number[][] = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] ?? P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] ?? P[i + 1];
    const n = Math.max(6, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 3));
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      pts.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  pts.push(P[P.length - 1]);
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, len, total: len[len.length - 1] };
}

/** Distance along the route at time t: a gentle start, an even pace, a gentle stop. */
function walked(t: number, T: number, L: number) {
  const ta = Math.min(0.22 * T, 300), td = Math.min(0.26 * T, 360);
  const v = L / (T - ta / 2 - td / 2);
  if (t <= 0) return 0;
  if (t < ta) return (0.5 * v * t * t) / ta;
  if (t < T - td) return v * (ta / 2) + v * (t - ta);
  if (t >= T) return L;
  const u = T - t;
  return L - (0.5 * v * u * u) / td;
}

function Stage({ fmt, c, ratio, className }: { fmt: "desktop" | "mobile"; c: Composition; ratio: number; className: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useUi();
  const stageRef = useRef<HTMLDivElement>(null);
  const girlRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(c.start);
  const [walking, setWalking] = useState(false);
  const raf = useRef(0);
  const faceRef = useRef(-1);
  const [pose, setPose] = useState<Pose>("idle");
  const [face, setFace] = useState(-1);
  const [hover, setHover] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [wipe, setWipe] = useState<{ x: number; y: number } | null>(null);
  const timers = useRef<number[]>([]);
  const busy = active !== null;
  const chosen = c.landmarks.find((l) => l.slug === active);
  const focusOrigin = chosen ? `${(chosen.hit[0] + chosen.hit[2] / 2) * 100}% ${(chosen.hit[1] + chosen.hit[3] / 2) * 100}%` : "50% 50%";

  useEffect(() => () => {
    timers.current.forEach((t) => clearTimeout(t));
    cancelAnimationFrame(raf.current);
  }, []);
  useEffect(() => {
    if (girlRef.current) girlRef.current.style.zIndex = String(depth(c.start[1]));
  }, [c.start]);
  useEffect(() => {
    faceRef.current = face;
  }, [face]);
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
    // the walk: ONE continuous motion along a smooth curve through her waypoints, at an even walking pace (a
    // gentle start and stop only at the ends). A single animation-frame loop moves her with a transform (no layout
    // work per frame and no React re-render per step), counts her steps by the distance she actually covers (so
    // her feet keep pace with the ground), turns her only when the path really changes direction, and keeps her
    // depth in step with her feet.
    const el = girlRef.current!, stage = stageRef.current!;
    const W = stage.clientWidth, H = stage.clientHeight;
    const path = routePath([pos, ...(m.via ?? []), m.stand], W, H);
    const gh = c.girl.h * H; // her height in pixels
    const T = Math.min(2400, Math.max(700, (path.total / (2.2 * gh)) * 1000));
    const stride = 0.38 * gh;
    const ox = pos[0] * W, oy = pos[1] * H;
    let i = 0, step = -1, t0 = 0;
    const at = (d: number, from: number) => {
      let k = from;
      while (k < path.len.length - 2 && path.len[k + 1] < d) k++;
      const a = path.pts[k], b = path.pts[k + 1], span = path.len[k + 1] - path.len[k] || 1, u = Math.min(1, (d - path.len[k]) / span);
      return { k, x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u };
    };
    const arrive = () => {
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
      } else if (m.kind === "greenhouse") {
        // she reaches for the handle and the door swings open on its hinge (the swing itself is CSS)
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
      // then a soft paper wipe from the landmark into the project
      const hold = MOMENT_MS[m.kind];
      later(() => {
        const r = stageRef.current!.getBoundingClientRect();
        setWipe({ x: r.left + (m.hit[0] + m.hit[2] / 2) * r.width, y: r.top + (m.hit[1] + m.hit[3] / 2) * r.height });
      }, hold);
      later(() => router.push(`/work/${m.slug}`), hold + 750);
    };
    const tick = (now: number) => {
      if (!t0) t0 = now;
      const t = now - t0, d = walked(t, T, path.total);
      const here = at(d, i);
      i = here.k;
      el.style.translate = `${here.x - ox}px ${here.y - oy}px`;
      el.style.zIndex = String(depth(here.y / H));
      // her steps: one per stride of ground covered
      const s = Math.floor(d / stride);
      if (s !== step) {
        step = s;
        el.dataset.pose = s % 2 ? "walk-b" : "walk-a";
      }
      // which way she faces: from the path a little ahead, ignoring tiny wobbles
      const ahead = at(Math.min(path.total, d + 14), i);
      if (Math.abs(ahead.x - here.x) > 2.5) {
        const f = ahead.x > here.x ? 1 : -1;
        if (f !== faceRef.current) {
          faceRef.current = f;
          setFace(f);
        }
      }
      if (t < T) {
        raf.current = requestAnimationFrame(tick);
        return;
      }
      // arrived: hand her resting place back to React in the same frame, so nothing jumps
      el.style.left = pct(m.stand[0]);
      el.style.top = pct(m.stand[1]);
      el.style.translate = "";
      setPos(m.stand);
      setWalking(false);
      arrive();
    };
    setWalking(true);
    setPose("walk-a");
    raf.current = requestAnimationFrame(tick);
  };

  return (
    <div className={className}>
      <div
        ref={stageRef}
        className={`work-stage relative isolate mx-auto overflow-hidden ${wipe ? "work-stage--leaving" : ""}`}
        style={{ aspectRatio: String(ratio), transformOrigin: focusOrigin, ["--ratio" as string]: String(ratio) } as React.CSSProperties}
      >
        <picture>
          <img
            src={`/assets/garden/work/garden-${fmt}-${fmt === "desktop" ? 2000 : 720}.webp`}
            srcSet={fmt === "desktop" ? "/assets/garden/work/garden-desktop-2000.webp 2000w, /assets/garden/work/garden-desktop-3000.webp 3000w" : "/assets/garden/work/garden-mobile-720.webp 720w, /assets/garden/work/garden-mobile-1080.webp 1080w"}
            sizes="100vw"
            alt=""
            className="absolute inset-0 block h-full w-full select-none"
            draggable={false}
          />
        </picture>
        {/* night: the same garden painted by moonlight (scripts/night-grade.mjs), cross-faded in with the lamp */}
        {/* eslint-disable-next-line @next/next/no-img-element -- prepared night painting */}
        <img
          aria-hidden="true"
          alt=""
          src={`/assets/garden/work/garden-${fmt}-${fmt === "desktop" ? 2000 : 720}-night.webp`}
          srcSet={fmt === "desktop" ? "/assets/garden/work/garden-desktop-2000-night.webp 2000w, /assets/garden/work/garden-desktop-3000-night.webp 3000w" : "/assets/garden/work/garden-mobile-720-night.webp 720w, /assets/garden/work/garden-mobile-1080-night.webp 1080w"}
          sizes="100vw"
          className="work-night absolute inset-0 block h-full w-full select-none"
          draggable={false}
        />

        {/* landmarks: their layers, a soft discoverability glow, the label, and the link over them */}
        {c.landmarks.map((m, i) => {
          const p = getProject(m.slug)!;
          const state = active === m.slug ? "active" : hover === m.slug ? "hover" : "idle";
          return (
            <div key={m.slug} className="work-landmark" data-kind={m.kind} data-state={state} style={{ zIndex: depth(m.base), ["--i" as string]: i, ["--enter" as string]: ENTER_ORDER[m.kind] } as React.CSSProperties}>
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
                  {t.categoryShort[p.category]}
                </span>
              </span>
              <Link
                href={`/work/${m.slug}`}
                aria-label={t.work.landmark(p.title, p.category, placeName(m.slug, locale))}
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
          ref={girlRef}
          aria-hidden="true"
          className={`work-girl pointer-events-none absolute ${walking ? "work-girl--walking" : ""}`}
          data-pose={pose}
          style={{
            left: pct(pos[0]),
            top: pct(pos[1]),
            width: pct(girl.w),
            transform: `translate(-50%, -${c.girl.feet[1] * 100}%)`,
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
      {/* a full-width panorama (3000 × 2350: a 3000 × 1350 first screen and the lower garden) on wide screens;
          a tall composition on phones (1080 × 2880: a 9:16 first screen and the lower garden) */}
      <Stage fmt="desktop" c={anchors.desktop as Composition} ratio={3000 / 2350} className="work-wide portrait-art:hidden" />
      <Stage fmt="mobile" c={anchors.mobile as Composition} ratio={1080 / 2880} className="hidden w-full portrait-art:block" />
    </>
  );
}
