"use client";

import { useEffect, useRef } from "react";

/**
 * Fades its `.reveal-item` children in once the block scrolls into view.
 * Content is only hidden after hydration, so it is never lost without
 * JavaScript; reduced motion shows it at once (globals.css).
 */
export default function Reveal({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.dataset.reveal = "waiting";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.reveal = "shown";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -18% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
