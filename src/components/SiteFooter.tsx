"use client";

import { useUi } from "@/i18n/ui";

export default function SiteFooter() {
  const t = useUi();
  return (
    <footer className="border-t border-forest/10 px-4 py-8 text-center text-sm text-ink-soft sm:px-6">
      <p>© {new Date().getFullYear()} {t.footer.rights}</p>
      <p className="mt-1 text-xs">{t.footer.note}</p>
    </footer>
  );
}
