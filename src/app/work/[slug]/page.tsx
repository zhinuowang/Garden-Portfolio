import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryBadge from "@/components/CategoryBadge";
import { AssetPlaceholder } from "@/components/ProjectMedia";
import ProjectMedia from "@/components/ProjectMedia";
import MarkVisited from "@/components/MarkVisited";
import { getProject, nextProject, projects } from "@/data/projects";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return {};
  return {
    title: `${project.title} | A Garden of Ideas — Zhinuo Wang`,
    description: project.shortDescription ?? `${project.title}, a project by Zhinuo Wang.`,
  };
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-[0.16em] text-moss uppercase">{label}</dt>
      <dd className={`mt-1 ${value ? "text-ink" : "text-ink-soft/70 italic"}`}>{value ?? "To be provided"}</dd>
    </div>
  );
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const next = nextProject(project.slug);

  return (
    <article className="px-4 pt-28 pb-20 sm:px-6">
      <MarkVisited slug={project.slug} />
      <div className="mx-auto max-w-4xl">
        <Link href="/work" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-forest underline-offset-4 hover:underline">
          <span aria-hidden="true">←</span> Back to Work
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <CategoryBadge category={project.category} />
            <span className="text-sm text-ink-soft">{project.locationName}</span>
          </div>
          <h1 className="mt-4 font-serif text-[clamp(2.4rem,6vw,4.2rem)] leading-[1.02] font-medium">{project.title}</h1>
          {project.discipline && <p className="mt-2 text-lg text-moss">{project.discipline}</p>}
        </header>

        <div className="mt-8">
          <ProjectMedia image={project.heroImage} sizes="(max-width: 900px) 92vw, 896px" priority />
        </div>

        <dl className="mt-10 grid gap-6 rounded-3xl bg-paper p-6 sm:grid-cols-2 lg:grid-cols-3">
          <Fact label="Date" value={project.projectDate} />
          <Fact label="Tools" value={project.tools?.join(", ") ?? null} />
          <Fact label={project.category === "academic" ? "Context" : "Type"} value={project.category === "academic" ? project.courseContext : "Personal project"} />
          <Fact label="Collaboration" value={project.collaboration} />
          <div className="sm:col-span-2">
            <Fact label="My role" value={project.role} />
          </div>
        </dl>

        {project.shortDescription && (
          <p className="mt-10 font-serif text-2xl leading-snug text-ink">{project.shortDescription}</p>
        )}

        {project.caseStudySections.map((s) => (
          <section key={s.id} aria-labelledby={`s-${s.id}`} className="mt-12">
            <h2 id={`s-${s.id}`} className="font-serif text-3xl font-medium">{s.heading}</h2>
            {s.body.map((p) => (
              <p key={p.slice(0, 24)} className="mt-4 text-lg leading-relaxed text-ink-soft">{p}</p>
            ))}
            {s.bullets && (
              <ul className="mt-4 list-disc space-y-2 pl-6 text-lg text-ink-soft marker:text-moss">
                {s.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
          </section>
        ))}

        <section aria-label="Case study in progress" className="mt-14 rounded-3xl border border-forest/15 p-6">
          <p className="font-medium text-ink">The full case study is still being planted.</p>
          <p className="mt-1 text-ink-soft">
            Process images and the remaining sections will be added from the original project files.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <AssetPlaceholder />
            <AssetPlaceholder />
          </div>
        </section>

        <nav aria-label="More projects" className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-forest/15 pt-8">
          <Link href="/work" className="inline-flex min-h-11 items-center font-medium text-forest underline-offset-4 hover:underline">
            ← Back to Work
          </Link>
          <Link href={`/work/${next.slug}`} className="group inline-flex min-h-11 flex-col items-end text-right">
            <span className="text-xs font-semibold tracking-[0.16em] text-moss uppercase">Next Project</span>
            <span className="font-serif text-2xl font-medium text-ink group-hover:text-forest">{next.title} →</span>
          </Link>
        </nav>
      </div>
    </article>
  );
}
