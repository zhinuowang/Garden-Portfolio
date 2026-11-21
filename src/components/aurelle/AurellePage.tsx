"use client";

import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import MarkVisited from "@/components/MarkVisited";
import CommercialVideo from "@/components/aurelle/CommercialVideo";
import { aurelle } from "@/data/aurelle";
import type { Project } from "@/data/projects";
import { useLocale } from "@/i18n/locale";
import { useUi } from "@/i18n/ui";

// AURELLE: a video-led project page, not a UX case study. The film is the page: a calm editorial header, the
// commercial itself at full width with nothing around it but a little air, and a short overview. The garden's
// painted backdrop sits quietly behind (as on the other project pages), with a faint blush wash; no flowers float
// over this page, so nothing competes with the film. Process sections (concept, direction, boards, keyframes,
// consistency, image-to-video, edit) appear only once Zhinuo supplies them in src/data/aurelle.ts.

export default function AurellePage({ project, next }: { project: Project; next: Project }) {
  const locale = useLocale();
  const ui = useUi();
  const t = ui.aurelle;
  const cs = ui.cs;

  return (
    <article className="aurelle-page nightable relative isolate overflow-x-clip px-4 pt-28 pb-24 sm:px-6">
      <div aria-hidden="true" className="journal-backdrop" />
      <div aria-hidden="true" className="aurelle-wash" />
      <MarkVisited slug={project.slug} />

      <div className="mx-auto max-w-6xl">
        <Link href="/work" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-forest underline-offset-4 hover:underline">
          <span aria-hidden="true">←</span> {cs.back}
        </Link>

        <header className="aurelle-header mt-6 max-w-3xl">
          <CategoryBadge category={project.category} />
          <h1 lang="en" className="aurelle-title mt-5 font-serif text-[clamp(2.8rem,7vw,5rem)] leading-none font-medium text-ink">
            {aurelle.title}
          </h1>
          {/* italic only in English: Chinese has no italic */}
          <p className={`mt-3 font-serif text-[clamp(1.25rem,2.4vw,1.7rem)] text-moss ${locale === "en" ? "italic" : ""}`}>{t.subtitle}</p>
          <p className="aurelle-discipline mt-5 text-xs font-semibold tracking-[0.2em] text-ink-soft uppercase">{t.discipline}</p>
        </header>

        <section aria-label={t.film} className="aurelle-film mt-10 sm:mt-14">
          <CommercialVideo />
        </section>

        <section aria-labelledby="aurelle-overview" className="aurelle-overview mt-14 grid gap-4 sm:mt-20 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
          <h2 id="aurelle-overview" className="aurelle-kicker font-serif text-sm tracking-[0.2em] text-moss uppercase">
            {t.overview}
          </h2>
          <p className="aurelle-lede max-w-3xl font-serif text-[clamp(1.3rem,2.3vw,1.75rem)] leading-snug text-ink">{t.overviewText}</p>
        </section>

        {/* the creative process: shown only when real material has been supplied */}
        {aurelle.process.map((s) => (
          <section key={s.id} aria-labelledby={`aurelle-${s.id}`} className="mt-16 grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
            <h2 id={`aurelle-${s.id}`} className="aurelle-kicker font-serif text-sm tracking-[0.2em] text-moss uppercase">{s.heading}</h2>
            <div className="max-w-3xl">
              {s.body.map((p) => (
                <p key={p.slice(0, 32)} className="mt-4 text-lg leading-relaxed text-ink-soft first:mt-0">{p}</p>
              ))}
              {s.images?.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element -- supplied project files, shown as they are
                <img key={img.src} src={img.src} alt={img.alt} width={img.width} height={img.height} loading="lazy" className="mt-8 h-auto w-full rounded-lg" />
              ))}
            </div>
          </section>
        ))}

        <nav aria-label={cs.more} className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-forest/15 pt-8">
          <Link href="/work" className="inline-flex min-h-11 items-center font-medium text-forest underline-offset-4 hover:underline">
            ← {cs.back}
          </Link>
          <Link href={`/work/${next.slug}`} className="group inline-flex min-h-11 flex-col items-end text-right">
            <span className="text-xs font-semibold tracking-[0.16em] text-moss uppercase">{cs.next}</span>
            <span className="font-serif text-2xl font-medium text-ink group-hover:text-forest">{next.title} →</span>
          </Link>
        </nav>
      </div>
    </article>
  );
}
