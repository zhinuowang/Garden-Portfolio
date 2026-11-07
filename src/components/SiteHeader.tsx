"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NightSwitch from "@/components/night/NightSwitch";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/work", label: "Work" },
  // Contact is reached through the garden mailbox on the Landing (and the one on the Contact page
  // itself), so the bar keeps three quiet links
];

export default function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  // On the Landing page the painting fills the screen and its title is the only
  // hero text, so the bar and the brand step away: just the links, in a quiet
  // paper wash in the corner that reads over any part of the painting.
  const overGarden = pathname === "/";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 ${overGarden ? "" : "border-b border-forest/10 bg-cream/80 backdrop-blur-md"}`}
    >
      <nav
        aria-label="Main"
        className={`mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 px-4 py-2 sm:px-6 ${overGarden ? "justify-end" : "justify-between"}`}
      >
        {!overGarden && (
          <Link href="/" className="flex flex-col py-1 leading-tight">
            <span className="font-serif text-lg font-medium text-ink">A Garden of Ideas</span>
            <span className="text-[0.7rem] font-semibold tracking-[0.2em] text-ink-soft uppercase">Zhinuo Wang</span>
          </Link>
        )}
        <ul className={`flex gap-0.5 sm:gap-1 ${overGarden ? "mt-1 rounded-full bg-paper/60 p-1" : ""}`}>
          <li className="night-switch-slot">
            <NightSwitch />
          </li>
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium transition ${
                    active ? "bg-forest text-paper" : "text-ink hover:bg-paper hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
