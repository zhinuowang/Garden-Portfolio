import type { Metadata } from "next";
import Link from "next/link";
import WorkGarden from "@/components/work/WorkGarden";
import { getProject, workSlugs } from "@/data/projects";

export const metadata: Metadata = {
  title: "Work | A Garden of Ideas — Zhinuo Wang",
  description: "Explore three projects by Zhinuo Wang in a small painted garden: two academic projects and one personal project.",
};

export default function WorkPage() {
  const projects = workSlugs.map((s) => getProject(s)!);
  return (
    <div className="work-page relative overflow-hidden px-0 pt-32 pb-10 sm:pt-[5.75rem] sm:px-4">
      <section aria-labelledby="work-title" className="relative">
        <h1 id="work-title" className="mx-auto mb-5 max-w-5xl px-4 text-center font-serif text-[clamp(1.6rem,3vw,2.5rem)] leading-tight font-medium text-ink sm:mb-6">
          Choose a place to explore my work.
        </h1>
        <WorkGarden />
      </section>

      {/* the same three projects as a plain list, for anyone who prefers it */}
      <nav aria-label="Projects" className="relative mx-auto mt-6 max-w-3xl px-4 text-center">
        <p className="text-sm text-ink-soft">Or open a project directly:</p>
        <ul className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {projects.map((p) => (
            <li key={p.slug}>
              <Link href={`/work/${p.slug}`} className="group inline-flex min-h-11 items-center gap-2 font-serif text-lg text-ink hover:text-forest">
                {p.title}
                <span className={`rounded-full px-2 py-0.5 font-sans text-[0.68rem] font-semibold tracking-[0.12em] uppercase ${p.category === "academic" ? "bg-[#e3ead2] text-moss" : "bg-[#f6dcd6] text-rose"}`}>
                  {p.category === "academic" ? "Academic" : "Personal"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
