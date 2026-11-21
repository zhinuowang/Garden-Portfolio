"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NightSwitch from "@/components/night/NightSwitch";
import GardenMusic from "@/components/GardenMusic";
import LanguageSwitch from "@/components/LanguageSwitch";
import { useUi } from "@/i18n/ui";

// The navigation, kept nearly invisible so the garden stays the focus: no background, panel, paint or shadow —
// just clean type over the page (dark sage by day, warm cream at night, with the faintest text shadow for
// legibility over the paintings). The brand is the way home; on the right sit the three pages, then the language,
// the music and, at night, the way back to day. Hover warms the colour; the current page and language carry a thin
// underline. The same bar on every page.
//
// PHONES (below 640px) get their own compact, single-row bar from the same header: the brand on the left, the
// music and a menu button on the right. The pages, the language and (at night) the way back to day move into a
// light panel that drops down under the bar. The music control is the very same component in both layouts, so
// opening or closing the menu never touches the music. On wider screens the menu button and panel do not exist
// visually (display: none), and the desktop bar is exactly as it was.

const LINKS = [
  { href: "/about", key: "about" },
  { href: "/work", key: "work" },
  { href: "/contact", key: "contact" },
] as const;

export default function SiteHeader() {
  const pathname = usePathname();
  const t = useUi();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // a destination was chosen (or the page changed some other way): close the menu
  useEffect(() => setOpen(false), [pathname]);

  // while open: the page behind stays put (no background scrolling), Escape closes, focus moves into the menu
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    panel.current?.querySelector<HTMLElement>("a, button")?.focus({ preventScroll: true });
    // a wider window (rotating the phone) has no menu: close it
    const wide = window.matchMedia("(min-width: 640px)");
    const onWide = () => wide.matches && setOpen(false);
    wide.addEventListener("change", onWide);
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <header className="garden-nav fixed inset-x-0 top-0 z-40" data-menu={open ? "open" : undefined}>
      <nav aria-label={t.nav.label} className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-1 px-2 py-[11px] sm:gap-x-4 sm:px-6 max-sm:flex-nowrap max-sm:py-2.5 max-sm:pr-1.5 max-sm:pl-4">
        {/* the brand is the same in both languages */}
        <Link href="/" aria-label={t.nav.home} lang="en" className="garden-brand flex min-h-11 flex-col justify-center leading-tight">
          <span className="font-serif text-lg font-medium">A Garden of Ideas</span>
          <span className="garden-brand__name text-[0.68rem] font-semibold tracking-[0.2em] uppercase">Zhinuo Wang</span>
        </Link>
        <ul className="flex items-center max-sm:hidden sm:ml-auto">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} aria-current={pathname.startsWith(l.href) ? "page" : undefined} className="garden-nav__item">
                {t.nav[l.key]}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <span aria-hidden="true" className="garden-nav__sep" />
          <span className="contents max-sm:hidden">
            <LanguageSwitch />
          </span>
          <GardenMusic />
          <span className="night-switch-slot max-sm:hidden">
            <NightSwitch />
          </span>
          {/* phones only: the menu button */}
          <button
            ref={button}
            type="button"
            className="garden-burger sm:hidden"
            aria-expanded={open}
            aria-controls="garden-menu"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            onClick={() => setOpen((o) => !o)}
          >
            <span aria-hidden="true" className="garden-burger__lines" />
          </button>
        </div>
      </nav>

      {/* phones only: the menu panel, under the bar; the page stays as it is behind a faint veil */}
      <div className="garden-menu-veil sm:hidden" aria-hidden="true" onClick={() => setOpen(false)} />
      <div ref={panel} id="garden-menu" className="garden-menu sm:hidden" inert={!open}>
        <ul className="garden-menu__links">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={pathname.startsWith(l.href) ? "page" : undefined}
                className="garden-menu__link"
                onClick={() => setOpen(false)}
              >
                {t.nav[l.key]}
              </Link>
            </li>
          ))}
        </ul>
        <div className="garden-menu__row">
          <span className="garden-menu__label">{t.lang.group}</span>
          <LanguageSwitch />
        </div>
        {/* returning to day is an action, like choosing a page: the menu closes after it */}
        <NightRow onDone={() => setOpen(false)} />
      </div>
    </header>
  );
}

/** At night, the way back to day, as its own row in the phone menu. */
function NightRow({ onDone }: { onDone: () => void }) {
  return (
    <div className="garden-menu__night" onClick={onDone}>
      <NightSwitch />
    </div>
  );
}
