import Image from "next/image";
import Link from "next/link";
import { getProject, selectedWorkSlugs } from "@/data/projects";
import { about, contact } from "@/data/site";
import ProjectCard from "./ProjectCard";

export function SelectedWork() {
  const featured = selectedWorkSlugs.map(getProject).filter((p) => p !== undefined);
  return (
    <section id="selected-work" aria-labelledby="work-title" className="scroll-mt-16 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-moss uppercase">Selected Work</p>
            <h2 id="work-title" className="mt-2 font-serif text-[clamp(2rem,4vw,3rem)] font-medium">A personal and an academic project</h2>
          </div>
          <Link href="/work" className="inline-flex min-h-11 items-center font-medium text-forest underline-offset-4 hover:underline">
            All five projects <span aria-hidden="true" className="ml-1">→</span>
          </Link>
        </div>
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {featured.map((p) => (
            <li key={p.id}>
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function AboutTheGardener() {
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-16 bg-[#eef0e2] px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-6xl items-start gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="mx-auto w-full max-w-sm">
          <Image
            src={about.portrait.src}
            alt={about.portrait.alt}
            width={about.portrait.width}
            height={about.portrait.height}
            sizes="(max-width: 768px) 80vw, 380px"
            className="h-auto w-full rounded-[28px] shadow-[0_20px_50px_-30px_rgb(64_88_60/0.7)]"
          />
        </div>
        <div>
          <h2 id="about-title" className="font-serif text-[clamp(2rem,4vw,3rem)] font-medium">About the Gardener</h2>
          {about.statement.map((para) => (
            <p key={para.slice(0, 20)} className="mt-4 text-lg leading-relaxed text-ink-soft">{para}</p>
          ))}
          <h3 className="mt-10 text-sm font-semibold tracking-[0.2em] text-moss uppercase">Education</h3>
          <ul className="mt-3 space-y-4">
            {about.education.map((e) => (
              <li key={e.degree}>
                <p className="font-medium text-ink">{e.degree}</p>
                <p className="text-ink-soft">{e.school} · {e.dates}</p>
              </li>
            ))}
          </ul>
          <h3 className="mt-8 text-sm font-semibold tracking-[0.2em] text-moss uppercase">Tools</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {about.tools.map((t) => (
              <li key={t} className="rounded-full bg-paper px-3 py-1 text-sm text-ink">{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="scroll-mt-16 px-4 py-20 text-center sm:px-6">
      <div className="mx-auto max-w-xl">
        <h2 id="contact-title" className="font-serif text-[clamp(2rem,4vw,3rem)] font-medium">Leave a Little Note</h2>
        <p className="mt-3 text-lg text-ink-soft">For opportunities, collaborations, or a friendly hello.</p>
        <a
          href={`mailto:${contact.email}`}
          className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-forest px-7 py-3 font-medium text-paper transition hover:bg-[#344a31]"
        >
          {contact.email}
        </a>
      </div>
    </section>
  );
}
