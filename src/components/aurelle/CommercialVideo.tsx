"use client";

import { useEffect, useRef } from "react";
import { aurelle } from "@/data/aurelle";
import { announceMedia } from "@/lib/mediaAudio";
import { useUi } from "@/i18n/ui";

// The finished commercial, shown as it is: the original file at its own 16:9 shape (never cropped, stretched or
// filtered), the browser's own controls (play and pause, progress, volume, fullscreen — they work everywhere,
// including Safari on iPhone, and with the keyboard and screen readers), a real frame of the film as its poster,
// and no autoplay. Only the file's index is fetched until the visitor presses play ("metadata"), and the video
// exists on this page alone, so no other page downloads it. While it plays with sound the garden's music steps
// aside (src/lib/mediaAudio.ts).

export default function CommercialVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const t = useUi().aurelle;
  const v = aurelle.video;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const audible = () => !el.paused && !el.ended && !el.muted && el.volume > 0;
    const sync = () => announceMedia(audible());
    const events = ["play", "playing", "pause", "ended", "volumechange", "emptied"] as const;
    events.forEach((e) => el.addEventListener(e, sync));
    return () => {
      events.forEach((e) => el.removeEventListener(e, sync));
      announceMedia(false); // leaving the page: the music may come back
    };
  }, []);

  return (
    <video
      ref={ref}
      className="aurelle-video block h-auto w-full"
      width={v.width}
      height={v.height}
      poster={v.poster.src}
      preload="metadata"
      controls
      playsInline
      aria-label={t.video}
    >
      <source src={v.src} type={v.type} />
      <p className="p-6 text-center text-ink-soft">{t.noVideo}</p>
    </video>
  );
}
