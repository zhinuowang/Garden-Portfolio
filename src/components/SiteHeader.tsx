"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NightSwitch from "@/components/night/NightSwitch";
import GardenMusic from "@/components/GardenMusic";
import LanguageSwitch, { PaintedUnderline } from "@/components/LanguageSwitch";
import { useUi } from "@/i18n/ui";

// The navigation as a strip of the painted garden: a thin band of cream paint (deep indigo at night) laid with
// long horizontal strokes, its lower edge left ragged where the strokes end, with a breath of blur behind it
// (scripts/paint-landing.mjs --refine). The brand is the way home; on the right sit the three pages, then the
// language and the music. The current page (and language) is marked by a short sage brushstroke, which hovering
// draws in faintly. On the Landing the painting is the hero, so the brand steps away and the links rest on a
// small painted cloud in the corner.

const LINKS = [
  { href: "/about", key: "about" },
  { href: "/work", key: "work" },
  { href: "/contact", key: "contact" },
] as const;

export default function SiteHeader() {
  const pathname = usePathname();
  const t = useUi();
  const overGarden = pathname === "/";

  const links = (
    <ul className="flex items-center">
      {LINKS.map((l) => {
        const active = pathname.startsWith(l.href);
        return (
          <li key={l.href}>
            <Link href={l.href} aria-current={active ? "page" : undefined} className="garden-nav__item">
              {t.nav[l.key]}
              <PaintedUnderline />
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const controls = (
    <div className="flex items-center gap-0.5 sm:gap-1">
      <span aria-hidden="true" className="garden-nav__sep" />
      <LanguageSwitch />
      <GardenMusic />
      <span className="night-switch-slot">
        <NightSwitch />
      </span>
    </div>
  );

  return (
    <header className={`garden-nav fixed inset-x-0 top-0 z-40 isolate ${overGarden ? "garden-nav--landing" : "garden-nav--bar"}`}>
      <nav
        aria-label={t.nav.label}
        className={`mx-auto flex max-w-6xl items-center px-3 sm:px-6 ${overGarden ? "justify-end pt-2" : "flex-wrap justify-between gap-x-4 py-1 max-sm:pb-0"}`}
      >
        {overGarden ? (
          <div className="garden-nav__cloud flex items-center">
            {links}
            {controls}
          </div>
        ) : (
          <>
            <Link href="/" aria-label={t.nav.home} className="garden-brand flex min-h-11 flex-col justify-center leading-tight">
              <span className="font-serif text-lg font-medium text-ink">{t.brand}</span>
              <span className="garden-brand__name text-[0.68rem] font-semibold tracking-[0.2em] text-ink-soft uppercase">{t.designer}</span>
            </Link>
            <div className="flex items-center max-sm:order-2 max-sm:-mt-1 max-sm:w-full max-sm:justify-center sm:ml-auto">{links}</div>
            <div className="max-sm:order-1">{controls}</div>
          </>
        )}
      </nav>
    </header>
  );
}
