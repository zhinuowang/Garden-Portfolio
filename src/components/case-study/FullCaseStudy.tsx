import Image from "next/image";
import type { CsBlock, CsImage, FullCaseStudy as Data } from "@/data/case-studies/eliminate-bacteria-pro";
import ChapterTabs from "./ChapterTabs";

// A full case study reproduced from the original portfolio: the deck's chapters
// (shown as tabs, like the browser-tab bar on every page of the original), each
// with its own sections, text and images, in the original order. Project
// visuals sit on the deck's light grey so they keep their own identity.

const ACCENT = "text-[#d6336c]"; // the deck's highlight pink

/** Render **highlighted** phrases from the source in the deck's accent colour. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") ? (
          <strong key={i} className={`font-semibold ${ACCENT}`}>
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

const MAX = { sm: "max-w-sm", md: "max-w-xl", lg: "max-w-none" } as const;

function Picture({ image, sizes, className = "" }: { image: CsImage; sizes: string; className?: string }) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      className={`h-auto w-full ${className}`}
      style={{ maxWidth: image.width }}
    />
  );
}

function Num({ n }: { n: number }) {
  return (
    <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#fde3ec] font-semibold text-[#d6336c]">
      {n}
    </span>
  );
}

function Block({ b }: { b: CsBlock }) {
  switch (b.type) {
    case "p":
      return <p className="mt-4 text-lg leading-relaxed text-ink-soft"><Rich text={b.text} /></p>;
    case "bullets":
      return (
        <ul className={`mt-3 list-disc space-y-1.5 pl-6 text-lg ${b.tone === "accent" ? "text-[#2f6b3a] marker:text-[#2f6b3a]" : "text-ink-soft marker:text-[#d6336c]"}`}>
          {b.items.map((t) => <li key={t}>{t}</li>)}
        </ul>
      );
    case "numbered":
      return (
        <ol className="mt-4 space-y-4">
          {b.items.map((it, i) => (
            <li key={it.title} className="flex gap-4">
              <Num n={i + 1} />
              <div className="pt-0.5">
                <p className="text-lg font-semibold text-ink">{it.title}</p>
                {it.text && <p className="mt-1 text-lg leading-relaxed text-ink-soft">{it.text}</p>}
              </div>
            </li>
          ))}
        </ol>
      );
    case "figure":
      return (
        <figure className="cs-figure mt-6">
          <div className={`mx-auto flex justify-center ${MAX[b.size ?? "md"]}`}>
            <Picture image={b.image} sizes={b.size === "lg" ? "(max-width: 900px) 92vw, 840px" : "(max-width: 640px) 80vw, 560px"} />
          </div>
          {b.caption && <figcaption className="mt-3 text-center text-sm font-medium text-ink-soft">{b.caption}</figcaption>}
        </figure>
      );
    case "figures":
      return (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {b.items.map((f) => (
            <figure key={f.image.src + (f.caption ?? "")} className="cs-figure">
              <Picture image={f.image} sizes="(max-width: 640px) 90vw, 420px" />
              {f.caption && <figcaption className="mt-3 text-center text-sm font-semibold text-[#d6336c]">{f.caption}</figcaption>}
            </figure>
          ))}
        </div>
      );
    case "steps":
      return (
        <ol className="mt-6 space-y-6">
          {b.items.map((s, i) => (
            <li key={s.image.src} className="grid items-center gap-5 sm:grid-cols-[1fr_minmax(0,18rem)]">
              <div className="flex gap-4">
                <Num n={i + 1} />
                <p className="pt-0.5 text-lg leading-relaxed text-ink-soft">{s.text}</p>
              </div>
              <figure className="cs-figure">
                <Picture image={s.image} sizes="(max-width: 640px) 80vw, 288px" className="mx-auto max-h-64 object-contain" />
              </figure>
            </li>
          ))}
        </ol>
      );
    case "details":
      return (
        <ol className="mt-6 space-y-8">
          {b.items.map((d, i) => (
            <li key={d.title} className="grid items-center gap-5 sm:grid-cols-[1fr_minmax(0,16rem)]">
              <div>
                <div className="flex items-center gap-3">
                  <Num n={i + 1} />
                  <h4 className="text-xl font-semibold text-ink">{d.title}</h4>
                </div>
                <p className="mt-3 text-lg leading-relaxed text-ink-soft">{d.text}</p>
              </div>
              <figure className="cs-figure">
                <Picture image={d.image} sizes="(max-width: 640px) 70vw, 256px" className="mx-auto max-h-56 object-contain" />
              </figure>
            </li>
          ))}
        </ol>
      );
    case "cards":
      return (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {b.items.map((c) => (
            <div key={c.title} className="rounded-2xl bg-[#d7e8f3] p-5">
              <h4 className="text-center font-semibold text-ink">{c.title}</h4>
              <p className="mt-3 leading-relaxed text-ink-soft">{c.text}</p>
            </div>
          ))}
        </div>
      );
    case "refs":
      return (
        <div className="mt-4 border-l-2 border-[#d6336c]/40 pl-4 text-sm leading-relaxed text-ink-soft">
          <p className="font-semibold text-ink">Reference{b.items.length > 1 ? "s" : ""}:</p>
          {b.items.map((r) => (
            <p key={r.url} className="mt-1 break-words">
              {r.text}{" "}
              <a href={r.url} className="text-forest underline underline-offset-2" target="_blank" rel="noopener noreferrer">
                {r.url}
              </a>
            </p>
          ))}
        </div>
      );
    case "missing":
      return (
        <p className="mt-4 rounded-xl border-2 border-dashed border-ink-soft/30 bg-[#efe9dc] px-4 py-3 text-sm font-medium text-ink-soft">{b.text}</p>
      );
  }
}

export default function FullCaseStudy({ data }: { data: Data }) {
  return (
    <div className="mt-12">
      <ChapterTabs chapters={data.chapters.map((c) => ({ id: c.id, tab: c.tab }))} />
      {data.chapters.map((c) => (
        <section key={c.id} id={c.id} aria-labelledby={`h-${c.id}`} className="cs-chapter mt-14 scroll-mt-36">
          <p className="text-xs font-semibold tracking-[0.16em] text-[#d6336c] uppercase">Eliminate Bacteria Pro</p>
          <h2 id={`h-${c.id}`} className="mt-1 font-serif text-[clamp(1.9rem,4vw,2.6rem)] leading-tight font-medium">{c.tab}</h2>
          {c.sections.map((s) => (
            <div key={s.heading} className="mt-8">
              <h3 className="text-2xl font-bold tracking-tight text-ink">{s.heading}</h3>
              {s.blocks.map((b, i) => <Block key={i} b={b} />)}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
