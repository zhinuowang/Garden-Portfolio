"use client";

import Image from "next/image";
import { Tape } from "@/components/botanical/Pressed";
import { useAbout } from "@/i18n/content";
import { useUi } from "@/i18n/ui";

// the same heading as the case studies: a serif title, a handwritten side note and a short painted vine
function JournalHeading({ id, children, note }: { id: string; children: React.ReactNode; note: string }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 id={id} className="font-serif text-[clamp(1.75rem,3.4vw,2.4rem)] leading-tight font-medium text-ink">{children}</h2>
        <span aria-hidden="true" className="note-rose font-hand text-xl text-rose">{note}</span>
      </div>
      <span aria-hidden="true" className="painted-vine mt-3 block" />
    </div>
  );
}

// the About page's small painted ornaments (scripts/paint-landing.mjs --refine): decorative only
function Ornament({ name, w, h, className }: { name: string; w: number; h: number; className: string }) {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- decorative painting
  return <img src={`/assets/garden/about/orn-${name}.webp`} alt="" aria-hidden="true" width={w} height={h} draggable={false} className={`about-ornament pointer-events-none select-none ${className}`} />;
}

export default function AboutContent() {
  const about = useAbout();
  const ui = useUi();
  const t = ui.about;
  return (
    // a quiet corner of the painted garden: the same oil-painted sky and meadow as the case studies
    // (scripts/paint-landing.mjs --about), with the content resting on a faint layer of light
    <div className="nightable relative isolate overflow-x-clip px-4 pt-28 pb-24 sm:px-6">
      <div aria-hidden="true" className="journal-backdrop journal-backdrop--about" />
      <article className="garden-mist relative mx-auto max-w-5xl">
        <Ornament name="sprig" w={300} h={600} className="absolute -top-12 -right-3 hidden h-auto w-[3.25rem] rotate-12 md:block lg:-top-6 lg:-right-2 lg:w-[4.5rem]" />

        {/* Introduction */}
        <header className="grid items-center gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <figure className="portrait-frame relative mx-auto w-full max-w-xs -rotate-2 p-[3.75%] pb-[15%]">
            <Tape className="absolute -top-4 left-1/2 w-28 -translate-x-1/2 rotate-3" />
            <Image
              src={about.portrait.src}
              alt={about.portrait.alt}
              width={about.portrait.width}
              height={about.portrait.height}
              sizes="(max-width: 768px) 80vw, 320px"
              priority
              className="relative h-auto w-full rounded-[3px]"
            />
            <figcaption className="absolute inset-x-0 bottom-3 text-center font-hand text-2xl text-ink-soft">{t.caption}</figcaption>
          </figure>
          <div>
            <p className="font-hand text-2xl text-moss">{t.meet}</p>
            <h1 className="mt-1 font-serif text-[clamp(2.6rem,6vw,4.4rem)] leading-[1.02] font-medium text-ink">{ui.designer}</h1>
            <p className="mt-2 text-sm font-semibold tracking-[0.2em] text-ink-soft uppercase">{t.role}</p>
            <p className="mt-6 font-serif text-2xl leading-snug text-ink">{about.intro}</p>
            {about.statement.map((para) => (
              <p key={para.slice(0, 20)} className="mt-4 text-lg leading-relaxed text-ink-soft">{para}</p>
            ))}
            <a
              href={about.resume.href}
              download
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-forest px-7 py-3 font-medium text-paper transition hover:bg-moss focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-moss"
            >
              {t.resume} <span className="opacity-75">{t.pdf}</span>
            </a>
          </div>
        </header>

        {/* Education */}
        <section aria-labelledby="education" className="relative mt-20">
          {/* the blossom rests in the margin beside the heading, where the window leaves room for it */}
          <Ornament name="blossom" w={420} h={420} className="absolute -top-7 -left-28 hidden h-auto w-[5.5rem] -rotate-12 xl:block" />
          <JournalHeading id="education" note={t.educationNote}>{t.education}</JournalHeading>
          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {about.education.map((e) => (
              <li key={e.degree} className="border-t border-dashed border-moss/35 pt-4">
                <p className="text-sm font-semibold tracking-[0.14em] text-moss uppercase">{e.dates}</p>
                <p className="mt-2 font-serif text-xl font-medium text-ink">{e.degree}</p>
                <p className="mt-1 text-ink-soft">{e.school}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Experience */}
        <section aria-labelledby="experience" className="relative mt-20">
          <Ornament name="daisies" w={380} h={560} className="absolute -top-14 right-0 hidden h-auto w-[4.75rem] rotate-6 sm:block" />
          <JournalHeading id="experience" note={t.experienceNote}>{t.experience}</JournalHeading>
          <ol className="mt-8 space-y-10 border-l-2 border-dotted border-forest/30 pl-6 sm:pl-10">
            {about.experience.map((x) => (
              <li key={x.company} className="relative">
                <span aria-hidden="true" className="absolute top-2 -left-[33px] size-4 rounded-full border-2 border-paper bg-blush sm:-left-[49px]" />
                <p className="text-sm font-semibold tracking-[0.14em] text-moss uppercase">{x.dates}</p>
                <h3 className="mt-1 font-serif text-2xl font-medium text-ink">{x.role}</h3>
                <p className="text-ink-soft">{x.company} · {x.place}</p>
                <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 text-ink-soft marker:text-moss">
                  {x.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        {/* Skills */}
        <section aria-labelledby="skills" className="mt-20">
          <JournalHeading id="skills" note={t.skillsNote}>{t.skills}</JournalHeading>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {(
              [
                [t.software, about.skills.software],
                [t.professional, about.skills.professional],
                [t.interpersonal, about.skills.interpersonal],
              ] as const
            ).map(([label, items]) => (
              <div key={label}>
                <h3 className="text-sm font-semibold tracking-[0.16em] text-moss uppercase">{label}</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {items.map((s) => (
                    <li key={s} className="about-skill rounded-full border border-moss/25 bg-paper/70 px-3 py-1.5 text-sm text-ink">{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
