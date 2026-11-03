import type { Metadata } from "next";
import ProjectCard from "@/components/ProjectCard";
import { projectsInRegion, regions, type GardenRegionId } from "@/data/projects";

export const metadata: Metadata = {
  title: "Work | A Garden of Ideas — Zhinuo Wang",
  description: "All projects by Zhinuo Wang: personal projects from the Creative Corner and academic projects from the Growing Grounds.",
};

const order: GardenRegionId[] = ["creative-corner", "growing-grounds"];

export default function WorkPage() {
  return (
    <div className="px-4 pt-28 pb-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-serif text-[clamp(2.4rem,5vw,3.6rem)] font-medium">Work</h1>
        <p className="mt-2 text-lg text-ink-soft">Five projects from two corners of the garden.</p>
        {order.map((r) => (
          <section key={r} aria-labelledby={`h-${r}`} className="mt-14">
            <h2 id={`h-${r}`} className="font-serif text-3xl font-medium">{regions[r].name}</h2>
            <p className={`text-sm font-semibold tracking-[0.14em] uppercase ${r === "creative-corner" ? "text-[#9b5444]" : "text-moss"}`}>
              {regions[r].subtitle}
            </p>
            <ul className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projectsInRegion(r).map((p) => (
                <li key={p.id}>
                  <ProjectCard project={p} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
