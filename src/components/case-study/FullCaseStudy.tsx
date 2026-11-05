import Image from "next/image";
import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import MarkVisited from "@/components/MarkVisited";
import { PressedBlossom, PressedDaisy, PressedSprig } from "@/components/botanical/Pressed";
import type { CsBlock, CsImage, FullCaseStudy as Data } from "@/data/case-studies/types";
import type { Project } from "@/data/projects";
import JournalContents from "./JournalContents";

// A full case study as a page from the painted garden's field journal: an
// oil-on-canvas backdrop (scripts/paint-landing.mjs --journal), sage and moss
// accents, editorial type and a few pressed flowers. The garden is only the
// frame — the project's own words and images are shown as supplied, in their
// original order, never recoloured or cropped.

const pad = (n: number) => String(n).padStart(2, "0");

function Picture({ image, sizes, priority, className = "" }: { image: CsImage; sizes: string; priority?: boolean; className?: string }) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      priority={priority}
      className={`mx-auto h-auto w-full ${className}`}
      style={{ maxWidth: image.width }}
    />
  );
}

/**
 * A project image placed straight on the page, exactly as supplied: no card,
 * mat, border or rounding. Only an image with its own opaque background gets
 * a barely-there, diffused neutral shadow so its edge settles into the paper;
 * one with a transparent background needs nothing.
 */
function Plate({ image, caption, sizes, priority, className = "", imgClass = "" }: { image: CsImage; caption?: string; sizes: string; priority?: boolean; className?: string; imgClass?: string }) {
  return (
    <figure className={className}>
      <Picture image={image} sizes={sizes} priority={priority} className={`${image.bare ? "" : "journal-settle"} ${imgClass}`} />
      {caption && <figcaption className="mt-2 text-center font-hand text-2xl leading-none text-forest">{caption}</figcaption>}
    </figure>
  );
}

const SIZE = { sm: "max-w-sm", md: "max-w-xl", lg: "max-w-none" } as const;

function Num({ n }: { n: number }) {
  return (
    <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full border border-moss/40 bg-[#e8eedc] font-serif text-sm font-semibold text-forest">
      {n}
    </span>
  );
}

function Block({ b }: { b: CsBlock }) {
  switch (b.type) {
    case "p":
      return <p className="mt-4 text-[1.075rem] leading-[1.8] text-ink-soft">{b.text}</p>;
    case "h3":
      return (
        <h3 className="mt-9 flex items-center gap-3 font-serif text-[1.45rem] font-medium text-forest">
          {b.n && <Num n={b.n} />}
          {b.text}
        </h3>
      );
    case "bullets":
      return (
        <ul className="journal-leaves mt-4 space-y-2.5 text-[1.075rem] leading-[1.7] text-ink-soft">
          {b.items.map((t) => <li key={t}>{t}</li>)}
        </ul>
      );
    case "components":
      return (
        <ul className="mt-4 flex flex-wrap gap-3">
          {b.items.map((c) => (
            <li key={c.name} className="inline-flex items-center gap-2 rounded-full border border-moss/25 bg-paper px-4 py-2 text-ink">
              <span aria-hidden="true">{c.icon}</span>
              {c.name}
            </li>
          ))}
        </ul>
      );
    case "entries":
      return (
        <ol className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {b.items.map((e) => (
            <li key={e.title} className="border-t border-dashed border-moss/35 pt-4">
              <p className="font-serif text-lg leading-snug font-medium text-ink">
                <span className="mr-2 text-moss">{e.label}</span>
                {e.title}
              </p>
              <p className="mt-2 leading-[1.75] text-ink-soft">{e.text}</p>
            </li>
          ))}
        </ol>
      );
    case "figure":
      return (
        <div className={`mx-auto mt-8 ${SIZE[b.size ?? "md"]}`}>
          <Plate image={b.image} caption={b.caption} sizes={b.size === "lg" ? "(max-width: 900px) 92vw, 760px" : "(max-width: 640px) 90vw, 576px"} />
        </div>
      );
    case "step":
      return (
        <div className="mt-8 grid items-center gap-6 border-t border-dashed border-moss/30 pt-8 first:border-0 md:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]">
          <div>
            <div className="flex items-start gap-3">
              <Num n={b.n} />
              <div className="pt-0.5">
                {b.title && <h3 className="mb-2 font-serif text-xl font-medium text-ink">{b.title}</h3>}
                {b.lead && <p className="font-medium text-ink">{b.lead}</p>}
                <p className="text-[1.075rem] leading-[1.8] text-ink-soft">{b.text}</p>
              </div>
            </div>
          </div>
          <Plate image={b.image} sizes="(max-width: 768px) 70vw, 272px" className="mx-auto w-full max-w-[17rem]" imgClass="max-h-60 w-auto object-contain" />
        </div>
      );
    case "link":
      return (
        <p className="mt-6">
          <a
            href={b.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-forest px-5 py-2.5 font-medium text-paper transition-colors hover:bg-moss focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-moss"
          >
            {b.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      );
    case "placeholder":
      return (
        <p className="mt-4 rounded-xl border-2 border-dashed border-moss/35 px-4 py-3 text-[0.95rem] leading-relaxed text-ink-soft italic">
          <span className="mr-1.5 font-hand text-lg text-moss not-italic">to write —</span>
          {b.text}
        </p>
      );
    case "aside": {
      // a wide chart gets more of the row (and sits straight) so its small print stays legible
      const wide = b.image.width / b.image.height > 1.6;
      return (
        <div className={`mt-4 grid items-center gap-8 ${wide ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]" : "md:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] md:items-start"}`}>
          <div>{b.blocks.map((x, i) => <Block key={i} b={x} />)}</div>
          <Plate
            image={b.image}
            sizes={wide ? "(max-width: 1024px) 92vw, 420px" : "(max-width: 768px) 80vw, 304px"}
            priority={!wide}
            className={`mx-auto mt-4 w-full ${wide ? "" : "max-w-[19rem]"}`}
          />
        </div>
      );
    }
  }
}

export default function FullCaseStudy({ project, data, next }: { project: Project; data: Data; next: Project }) {
  return (
    <article className="relative isolate overflow-x-clip px-4 pt-28 pb-24 sm:px-6">
      <div aria-hidden="true" className="journal-backdrop" />
      <MarkVisited slug={project.slug} />
      <PressedSprig className="pointer-events-none absolute top-24 -right-3 hidden w-20 rotate-12 opacity-70 md:block" />
      <PressedBlossom className="pointer-events-none absolute top-[46rem] -left-10 hidden w-24 -rotate-12 opacity-60 xl:block" />

      <div className="mx-auto max-w-6xl">
        <Link href="/work" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-forest underline-offset-4 hover:underline">
          <span aria-hidden="true">←</span> Back to Work
        </Link>

        <header className="mt-6 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <CategoryBadge category={project.category} />
            <span className="font-hand text-xl text-moss">field notes from {project.locationName.replace(/^The /, "the ")}</span>
          </div>
          <h1 className="mt-4 font-serif text-[clamp(2.5rem,6vw,4.4rem)] leading-[1.02] font-medium text-ink">{project.title}</h1>
          {data.subtitle && <p className="mt-3 font-serif text-[clamp(1.2rem,2.2vw,1.55rem)] text-moss italic">{data.subtitle}</p>}
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-y border-dashed border-moss/35 py-5">
            {data.facts.map((f) => (
              <div key={f.label}>
                <dt className="text-xs font-semibold tracking-[0.16em] text-moss uppercase">{f.label}</dt>
                <dd className={`mt-1 ${f.pending ? "text-ink-soft/70 italic" : "text-ink"}`}>{f.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="mt-12 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
          <JournalContents sections={data.sections.map((s) => ({ id: s.id, heading: s.heading }))} />

          <div className="min-w-0 max-w-3xl">
            {data.sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`h-${s.id}`} className="journal-section scroll-mt-28 pt-12 first:pt-2">
                <p aria-hidden="true" className="font-serif text-sm tracking-[0.2em] text-moss">{pad(i + 1)}</p>
                <h2 id={`h-${s.id}`} className="mt-1 font-serif text-[clamp(1.75rem,3.4vw,2.4rem)] leading-tight font-medium text-ink">{s.heading}</h2>
                <span aria-hidden="true" className="journal-rule mt-3 block" />
                {s.blocks.map((b, j) => <Block key={j} b={b} />)}
              </section>
            ))}

            <PressedDaisy className="pointer-events-none mx-auto mt-16 block w-12 opacity-80" />

            <nav aria-label="More projects" className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-moss/35 pt-8">
              <Link href="/work" className="inline-flex min-h-11 items-center font-medium text-forest underline-offset-4 hover:underline">
                ← Back to Work
              </Link>
              <Link href={`/work/${next.slug}`} className="group inline-flex min-h-11 flex-col items-end text-right">
                <span className="text-xs font-semibold tracking-[0.16em] text-moss uppercase">Next Project</span>
                <span className="font-serif text-2xl font-medium text-ink group-hover:text-forest">{next.title} →</span>
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </article>
  );
}
