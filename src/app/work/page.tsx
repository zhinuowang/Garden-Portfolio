import type { Metadata } from "next";
import Link from "next/link";
import GardenExplorer from "@/components/garden/GardenExplorer";
import { projectsInRegion, regions, type GardenRegionId } from "@/data/projects";

export const metadata: Metadata = {
  title: "Work | A Garden of Ideas — Zhinuo Wang",
  description: "Explore Zhinuo Wang's five projects in an illustrated garden: personal projects in the Creative Corner and academic projects in the Growing Grounds.",
};

const order: GardenRegionId[] = ["creative-corner", "growing-grounds"];

export default function WorkPage() {
  return (
    <div className="bg-[linear-gradient(180deg,#f6e2d6_0%,#f6f1e5_320px)] px-4 pt-24 pb-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto max-w-2xl text-center">
          <p className="font-hand text-2xl text-rose">wander, and click what catches your eye</p>
          <h1 className="font-serif text-[clamp(2.4rem,5vw,3.6rem)] leading-tight font-medium">Every idea has a place to grow.</h1>
          <p className="mt-3 text-lg text-ink-soft">
            Explore two corners of my garden, each telling a different story of creativity, learning, and design.
          </p>
        </header>

        <div className="mt-8">
          <GardenExplorer />
        </div>

        {/* Fast, non-spatial route to every project. */}
        <section aria-labelledby="project-list" className="mx-auto mt-14 max-w-3xl">
          <h2 id="project-list" className="text-center font-serif text-2xl font-medium">Prefer a list?</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            {order.map((r) => (
              <div key={r}>
                <h3 className={`text-sm font-semibold tracking-[0.14em] uppercase ${r === "creative-corner" ? "text-[#9b5444]" : "text-moss"}`}>
                  {regions[r].name} · {regions[r].subtitle}
                </h3>
                <ul className="mt-3 divide-y divide-forest/10 border-y border-forest/10">
                  {projectsInRegion(r).map((p) => (
                    <li key={p.id}>
                      <Link href={`/work/${p.slug}`} className="group flex min-h-12 items-center justify-between gap-3 py-3">
                        <span>
                          <span className="block font-serif text-lg font-medium text-ink group-hover:text-forest">{p.title}</span>
                          <span className="block text-sm text-ink-soft">{p.discipline ?? p.locationName}</span>
                        </span>
                        <span aria-hidden="true" className="text-forest transition group-hover:translate-x-1">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
