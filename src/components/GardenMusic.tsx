"use client";

import { useEffect, useRef, useState } from "react";
import { useNight } from "@/components/night/night";
import { useUi } from "@/i18n/ui";

// Background music for the garden: soft piano, ON by default. It fades in over ~1.8 s to a low volume (a little
// lower at night), loops, and fades out before pausing when turned off with the small note in the header.
// Browsers do not let a page start sound by itself before the visitor has interacted with it, so the garden asks
// once on arrival and, if the browser says "not yet", begins the music at the visitor's first click, tap or key
// press anywhere. Turning it off is remembered for the rest of the visit (sessionStorage), so it never comes back
// uninvited; a new visit starts with music again. The control lives in the site header, which stays mounted
// across page changes, so the music carries on uninterrupted between pages (and through a change of language).
//
// THE TRACK: public/audio/garden-music.mp3, a calm solo-piano piece supplied by Zhinuo (Clavier Music,
// "Calming Piano — Soft and Peaceful", 1:48, 256 kbps). To change it, replace that file. If it is missing or
// the browser refuses to play it, the button says "Music coming soon" and nothing plays.

export const MUSIC_SRC = "/audio/garden-music.mp3";

const DAY_VOLUME = 0.22;
const NIGHT_VOLUME = 0.15;
const KEY = "garden-music"; // "off" once the visitor turns it off, for the rest of this visit

type Status = "off" | "on" | "unavailable";

const remember = (v: "on" | "off") => {
  try {
    sessionStorage.setItem(KEY, v);
  } catch {
    /* private mode: nothing to remember */
  }
};

export default function GardenMusic() {
  const night = useNight();
  const t = useUi().music;
  const [status, setStatus] = useState<Status>("off");
  const audio = useRef<HTMLAudioElement | null>(null);
  const fadeTimer = useRef(0);
  const nightRef = useRef(night);
  nightRef.current = night;
  /** set while the music waits for the visitor's first interaction (autoplay not yet allowed) */
  const waiting = useRef<(() => void) | null>(null);

  // ease the volume to `to` over `ms`, then run `done`. A timer (not requestAnimationFrame) drives it, so the
  // fade still completes if the visitor switches to another tab while the music keeps playing.
  const fade = (to: number, ms: number, done?: () => void) => {
    const a = audio.current;
    if (!a) return;
    window.clearInterval(fadeTimer.current);
    const from = a.volume, start = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - start) / ms);
      const eased = t * t * (3 - 2 * t);
      a.volume = Math.max(0, Math.min(1, from + (to - from) * eased));
      if (t >= 1) {
        window.clearInterval(fadeTimer.current);
        done?.();
      }
    };
    fadeTimer.current = window.setInterval(step, 30);
  };

  const stopWaiting = () => {
    waiting.current?.();
    waiting.current = null;
  };

  /** Start (or resume) the music; resolves to how it went. */
  const start = async (): Promise<"on" | "blocked" | "unavailable"> => {
    if (!audio.current) {
      const a = new Audio(MUSIC_SRC);
      a.loop = true;
      a.preload = "auto";
      a.volume = 0;
      audio.current = a;
    }
    const a = audio.current;
    try {
      a.volume = 0;
      await a.play();
      setStatus("on");
      fade(nightRef.current ? NIGHT_VOLUME : DAY_VOLUME, 1800);
      return "on";
    } catch (e) {
      // the browser wants an interaction first: try again then. Anything else means no playable track.
      if (e instanceof DOMException && e.name === "NotAllowedError") return "blocked";
      audio.current = null;
      setStatus("unavailable");
      return "unavailable";
    }
  };

  const turnOn = async () => {
    stopWaiting();
    remember("on");
    await start();
  };

  const turnOff = () => {
    stopWaiting();
    remember("off");
    setStatus("off");
    fade(0, 1500, () => audio.current?.pause());
  };

  // on by default: on arrival, ask to play; if the browser needs an interaction first, begin at the first one
  // (a click on the note itself is the button's own business: it starts the music through turnOn)
  useEffect(() => {
    let off = false;
    try {
      off = sessionStorage.getItem(KEY) === "off";
    } catch {
      /* no storage: default on */
    }
    if (off) return;
    let cancelled = false;
    start().then((how) => {
      if (cancelled || how !== "blocked") return;
      const begin = (e: Event) => {
        if (e.target instanceof Element && e.target.closest(".garden-music")) return;
        stopWaiting();
        start();
      };
      const events = ["pointerdown", "keydown", "touchstart"] as const;
      for (const ev of events) window.addEventListener(ev, begin, { capture: true, passive: true });
      waiting.current = () => events.forEach((ev) => window.removeEventListener(ev, begin, { capture: true }));
    });
    return () => {
      cancelled = true;
      stopWaiting();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, []);

  // day and night: the same track carries on, only its volume eases a little lower or higher
  useEffect(() => {
    if (status === "on") fade(night ? NIGHT_VOLUME : DAY_VOLUME, 1200);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the mood changes
  }, [night]);

  useEffect(() => () => {
    window.clearInterval(fadeTimer.current);
    audio.current?.pause();
  }, []);

  const label = status === "on" ? t.stop : status === "unavailable" ? t.soon : t.play;
  const hint = status === "on" ? t.on : status === "unavailable" ? t.soonHint : t.off;

  return (
    <button
      type="button"
      onClick={() => (status === "on" ? turnOff() : turnOn())}
      aria-pressed={status === "on"}
      aria-label={label}
      title={label}
      data-status={status}
      className="garden-music group relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-[0.6rem] text-ink-soft transition-colors hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-moss"
    >
      {/* a small painted note; when playing, two soft sound curls drift beside it */}
      <svg viewBox="0 0 28 28" className="garden-music__note h-6 w-6" aria-hidden="true" focusable="false">
        <g filter="url(#paint)">
          <path d="M11 6.5 L20 4.5 L20 17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 6.5 L11 19.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="8.2" cy="20" rx="3.4" ry="2.6" transform="rotate(-18 8.2 20)" fill="currentColor" />
          <ellipse cx="17.2" cy="17.6" rx="3.4" ry="2.6" transform="rotate(-18 17.2 17.6)" fill="currentColor" />
        </g>
        <g className="garden-music__waves" fill="none" stroke="#b8615e" strokeWidth="1.4" strokeLinecap="round">
          <path d="M23.5 9 q2 2 0 4" />
          <path d="M25.5 7.5 q3 3.5 0 7" />
        </g>
        {/* off: a light stroke across */}
        <path className="garden-music__mute" d="M5 24 L24 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      </svg>
      <span aria-hidden="true" className="garden-music__hint">{hint}</span>
    </button>
  );
}
