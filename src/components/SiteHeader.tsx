import Link from "next/link";

const links = [
  { href: "/#garden", label: "Garden" },
  { href: "/work", label: "Work" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export default function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <nav aria-label="Main" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-4 sm:px-6">
        <Link href="/" className="font-serif text-lg font-medium text-ink">
          A Garden of Ideas
        </Link>
        <ul className="flex gap-1 sm:gap-2">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-ink/85 transition hover:bg-paper/60 hover:text-ink">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
