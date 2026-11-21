"use client";

import { useEffect, useRef, useState } from "react";
import { useUi } from "@/i18n/ui";

// Phones only: tap a case-study image to see the original file full screen, pinch to zoom, drag to look around.
//
// Nothing in the page's markup changes. On a phone (below 640px) this marks each project image inside the given
// container as a button ("View full size"), focusable from the keyboard, with a zoom-in cursor; on wider screens
// it takes those marks away again, so the desktop page is exactly as it was. The viewer is a native <dialog>
// (focus stays inside, Escape closes), shows the very same image file at its own proportions on a dark ground,
// and supports pinch-to-zoom, panning while zoomed, and double-tap to zoom in or back out. It never closes on a
// stray tap (only the close button or Escape), the page behind cannot scroll, and the reading position is
// restored afterwards. No library: plain pointer events.

const PHONE = "(max-width: 639px)";
const MAX = 4;
const IMAGES = ".journal-section img:not([aria-hidden='true']), .cs-hero img";

type View = { s: number; x: number; y: number };

export default function ImageZoom({ container }: { container: React.RefObject<HTMLElement | null> }) {
  const t = useUi().cs;
  const dialog = useRef<HTMLDialogElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const [shown, setShown] = useState<{ src: string; alt: string } | null>(null);
  const view = useRef<View>({ s: 1, x: 0, y: 0 });
  const saved = useRef(0);
  const opener = useRef<HTMLElement | null>(null);

  // mark the images as tappable on phones only, and follow the screen size as it changes
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    const mq = window.matchMedia(PHONE);
    const mark = () => {
      root.querySelectorAll<HTMLImageElement>(IMAGES).forEach((el) => {
        if (mq.matches) {
          el.dataset.zoom = "";
          el.setAttribute("role", "button");
          el.tabIndex = 0;
          el.setAttribute("aria-label", `${t.zoom}: ${el.alt}`);
        } else if ("zoom" in el.dataset) {
          delete el.dataset.zoom;
          el.removeAttribute("role");
          el.removeAttribute("tabindex");
          el.removeAttribute("aria-label");
        }
      });
    };
    mark();
    mq.addEventListener("change", mark);
    const openFrom = (target: EventTarget | null) => {
      const el = target instanceof HTMLImageElement && "zoom" in target.dataset ? target : null;
      if (!el || !mq.matches) return false;
      opener.current = el;
      setShown({ src: el.currentSrc || el.src, alt: el.alt });
      return true;
    };
    const onClick = (e: MouseEvent) => {
      if (openFrom(e.target)) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && openFrom(e.target)) e.preventDefault();
    };
    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKey);
    return () => {
      mq.removeEventListener("change", mark);
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKey);
    };
  }, [container, t.zoom]);

  // open / close the dialog; hold the page still behind it and return to the same place afterwards
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (shown) {
      saved.current = window.scrollY;
      document.documentElement.style.overflow = "hidden";
      view.current = { s: 1, x: 0, y: 0 };
      apply();
      if (!d.open) d.showModal();
    } else if (d.open) d.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply reads refs only
  }, [shown]);

  const onClosed = () => {
    document.documentElement.style.overflow = "";
    window.scrollTo({ top: saved.current, behavior: "instant" as ScrollBehavior });
    opener.current?.focus({ preventScroll: true });
    setShown(null);
  };

  // ---- pinch, pan and double-tap
  const apply = () => {
    const { s, x, y } = view.current;
    if (img.current) img.current.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  };
  /** keep the zoomed image covering the screen: no panning past its edges */
  const clamp = (v: View): View => {
    const el = img.current;
    if (!el) return v;
    const w = el.clientWidth * v.s, h = el.clientHeight * v.s;
    const mx = Math.max(0, (w - window.innerWidth) / 2), my = Math.max(0, (h - window.innerHeight) / 2);
    return { s: v.s, x: Math.min(mx, Math.max(-mx, v.x)), y: Math.min(my, Math.max(-my, v.y)) };
  };
  /** zoom to scale s about a screen point, keeping that point where it is */
  const zoomAt = (s: number, px: number, py: number, from: View) => {
    const cx = px - window.innerWidth / 2, cy = py - window.innerHeight / 2;
    const k = s / from.s;
    return clamp({ s, x: cx - (cx - from.x) * k, y: cy - (cy - from.y) * k });
  };
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ d: number; mx: number; my: number; v: View } | null>(null);
  const lastTap = useRef(0);

  const onDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, v: { ...view.current } };
    }
  };
  const onMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const now = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, now);
    if (pointers.current.size >= 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()];
      const g = gesture.current;
      const s = Math.min(MAX, Math.max(1, (g.v.s * Math.hypot(a.x - b.x, a.y - b.y)) / g.d));
      const z = zoomAt(s, g.mx, g.my, g.v);
      // and follow the fingers as they move together
      view.current = clamp({ s: z.s, x: z.x + ((a.x + b.x) / 2 - g.mx), y: z.y + ((a.y + b.y) / 2 - g.my) });
      apply();
    } else if (pointers.current.size === 1 && view.current.s > 1) {
      view.current = clamp({ ...view.current, x: view.current.x + now.x - prev.x, y: view.current.y + now.y - prev.y });
      apply();
    }
  };
  const onUp = (e: React.PointerEvent) => {
    const was = pointers.current.size;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current = null;
    if (was !== 1) return;
    // a double tap zooms in on that spot, or back out
    const now = performance.now();
    if (now - lastTap.current < 300) {
      view.current = view.current.s > 1.05 ? { s: 1, x: 0, y: 0 } : zoomAt(2.5, e.clientX, e.clientY, view.current);
      if (img.current) img.current.style.transition = "transform 0.25s ease";
      apply();
      window.setTimeout(() => img.current && (img.current.style.transition = ""), 260);
      lastTap.current = 0;
    } else lastTap.current = now;
  };

  return (
    <dialog ref={dialog} className="zoom-viewer" aria-label={shown?.alt ? `${t.zoom}: ${shown.alt}` : t.zoom} onClose={onClosed}>
      <div className="zoom-viewer__stage" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        {shown && (
          // eslint-disable-next-line @next/next/no-img-element -- the original file, shown as it is
          <img ref={img} src={shown.src} alt={shown.alt} draggable={false} className="zoom-viewer__img" />
        )}
      </div>
      <p className="zoom-viewer__hint" aria-hidden="true">{t.zoomHint}</p>
      <button type="button" className="zoom-viewer__close" onClick={() => setShown(null)} aria-label={t.zoomClose}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6 L18 18 M18 6 L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </dialog>
  );
}
