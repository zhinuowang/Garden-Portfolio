"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NightSwitch from "@/components/night/NightSwitch";
import GardenMusic from "@/components/GardenMusic";
import LanguageSwitch from "@/components/LanguageSwitch";
import { useUi } from "@/i18n/ui";

// The navigation, kept nearly invisible so the garden stays the focus: no background, panel, paint or shadow —
// just clean type over the page (dark sage by day, warm cream at night, with the faintest text shadow for
// legibility over the paintings). The brand is the way home; on the right sit the three pages, then the language,
// the music and, at night, the way back to day. Hover warms the colour; the current page and language carry a thin
// underline. The same bar on every page.

const LINKS = [
  { href: "/about", key: "about" },
  { href: "/work", key: "work" },
  { href: "/contact", key: "contact" },
] as const;

export default function SiteHeader() {
  const pathname = usePathname();
  const t = useUi();

  return (
    <header className="garden-nav fixed inset-x-0 top-0 z-40">
      <nav aria-label={t.nav.label} className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-1 px-2 py-1 min-[390px]:gap-x-2 min-[390px]:px-3 sm:gap-x-4 sm:px-6 max-sm:pb-0">
        {/* the brand is the same in both languages */}
        <Link href="/" aria-label={t.nav.home} lang="en" className="garden-brand flex min-h-11 flex-col justify-center leading-tight">
          <span className="font-serif text-lg font-medium">A Garden of Ideas</span>
          <span className="garden-brand__name text-[0.68rem] font-semibold tracking-[0.2em] uppercase">Zhinuo Wang</span>
        </Link>
        <ul className="flex items-center max-sm:order-2 max-sm:-mt-1 max-sm:w-full max-sm:justify-center sm:ml-auto">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} aria-current={pathname.startsWith(l.href) ? "page" : undefined} className="garden-nav__item">
                {t.nav[l.key]}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-0.5 max-sm:order-1 sm:gap-1">
          <span aria-hidden="true" className="garden-nav__sep" />
          <LanguageSwitch />
          <GardenMusic />
          <span className="night-switch-slot">
            <NightSwitch />
          </span>
        </div>
      </nav>
    </header>
  );
}
