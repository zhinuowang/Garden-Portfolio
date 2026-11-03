import Link from "next/link";
import type { Project } from "@/data/projects";
import CategoryBadge from "./CategoryBadge";
import ProjectMedia from "./ProjectMedia";

export default function ProjectCard({ project, headingLevel = "h3" }: { project: Project; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  return (
    <article className="group relative flex h-full flex-col rounded-3xl bg-paper p-4 shadow-[0_18px_40px_-28px_rgb(64_88_60/0.55)] transition hover:-translate-y-1 sm:p-5">
      <ProjectMedia image={project.heroImage} sizes="(max-width: 768px) 92vw, 540px" />
      <div className="mt-4 flex flex-1 flex-col px-1">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={project.category} />
          <span className="text-sm text-ink-soft">{project.locationName}</span>
        </div>
        <H className="mt-3 font-serif text-2xl font-medium">
          <Link href={`/work/${project.slug}`} className="after:absolute after:inset-0 after:rounded-3xl">
            {project.title}
          </Link>
        </H>
        <p className="mt-2 flex-1 leading-relaxed text-ink-soft">
          {project.shortDescription ?? "Project description to be provided."}
        </p>
        <p className="mt-4 font-medium text-forest">
          View Case Study <span aria-hidden="true">→</span>
        </p>
      </div>
    </article>
  );
}
