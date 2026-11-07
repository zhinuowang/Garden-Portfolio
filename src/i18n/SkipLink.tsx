"use client";

import { useUi } from "./ui";

export default function SkipLink() {
  const t = useUi();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-paper focus:px-4 focus:py-2"
    >
      {t.skip}
    </a>
  );
}
