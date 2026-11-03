"use client";

import { useEffect, useState } from "react";
import { projects, projectsInRegion, regions, type GardenRegionId, type Project } from "@/data/projects";
import { readLastProject, readRegion, readVisited, saveLastProject, saveRegion, type RegionView } from "@/lib/gardenMemory";
import ProjectPreview from "../ProjectPreview";
import GardenLandscape from "./GardenLandscape";
import { objectArt, VisitedBloom } from "./GardenObjects";

// Where each landmark sits in the 1600×900 scene, as percentages.
const placement: Record<Project["gardenLocation"], { left: number; top: number; width: number; labelEnd?: boolean }> = {
  cottage: { left: 4, top: 37, width: 15 },
  greenhouse: { left: 22, top: 55, width: 16 },
  "puppy-corner": { left: 61, top: 61, width: 15 },
  fountain: { left: 72, top: 41, width: 13 },
  windmill: { left: 86, top: 18, width: 9.5, labelEnd: true },
};

// Camera framing when a region is selected: scale about a point on that side.
const camera: Record<RegionView, string> = {
  all: "scale(1)",
  "creative-corner": "scale(1.45)",
  "growing-grounds": "scale(1.45)",
};
const origin: Record<RegionView, string> = {
  all: "50% 50%",
  "creative-corner": "8% 72%",
  "growing-grounds": "96% 55%",
};

const regionIds: GardenRegionId[] = ["creative-corner", "growing-grounds"];

export default function GardenExplorer() {
  const [view, setView] = useState<RegionView>("all");
  const [hovered, setHovered] = useState<GardenRegionId | null>(null);
  const [open, setOpen] = useState<Project | null>(null);
  const [visited, setVisited] = useState<string[]>([]);

  // Restore the last explored region and visited flowers for this session, and
  // return keyboard focus to the landmark the visitor last opened.
  useEffect(() => {
    setView(readRegion());
    setVisited(readVisited());
    const last = readLastProject();
    if (last) {
      const visible = [...document.querySelectorAll<HTMLButtonElement>(`[data-project="${last}"]`)].find((b) => b.offsetParent);
      visible?.focus({ preventScroll: true });
    }
  }, []);

  const openProject = (p: Project) => {
    saveLastProject(p.slug);
    setOpen(p);
  };

  const choose = (v: RegionView) => {
    setView(v);
    saveRegion(v);
  };

  const emphasised = (r: GardenRegionId) => hovered === r || view === r;

  return (
    <div>
      {/* Region chooser: also the accessible, non-spatial way to move the view. */}
      <div role="group" aria-label="Choose a garden region" className="mb-5 flex flex-wrap justify-center gap-2">
        {(["all", ...regionIds] as RegionView[]).map((v) => {
          const active = view === v;
          return (
            <button
              key={v}
              type="button"
              aria-pressed={active}
              onClick={() => choose(v)}
              className={`min-h-11 rounded-full border px-5 py-2 text-sm font-medium transition ${
                active ? "border-forest bg-forest text-paper" : "border-forest/25 bg-paper/70 text-forest hover:border-forest/60"
              }`}
            >
              {v === "all" ? "Whole garden" : `${regions[v].name} · ${regions[v].subtitle}`}
            </button>
          );
        })}
      </div>

      {/* ---------- Tablet & desktop: one continuous painted scene ---------- */}
      <div className="paper-grain relative hidden aspect-[16/9] overflow-hidden rounded-[28px] shadow-[0_24px_60px_-30px_rgb(64_88_60/0.5)] md:block">
        <div
          className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(.22,.8,.2,1)]"
          style={{ transform: camera[view], transformOrigin: origin[view] }}
        >
          <GardenLandscape className="absolute inset-0 h-full w-full" />

          {/* invisible halves used only for hover emphasis of a region */}
          <div className="absolute inset-y-0 left-0 w-1/2" onMouseEnter={() => setHovered("creative-corner")} onMouseLeave={() => setHovered(null)} />
          <div className="absolute inset-y-0 right-0 w-1/2" onMouseEnter={() => setHovered("growing-grounds")} onMouseLeave={() => setHovered(null)} />

          {/* region titles, painted into the sky */}
          {regionIds.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => choose(view === r ? "all" : r)}
              onMouseEnter={() => setHovered(r)}
              onMouseLeave={() => setHovered(null)}
              className={`absolute top-[6%] rounded-2xl px-4 py-2 text-left transition duration-500 ${
                r === "creative-corner" ? "left-[4%]" : "right-[4%] text-right"
              } ${emphasised(r) ? "bg-paper/75 shadow-sm" : "bg-paper/0"}`}
              aria-label={`${view === r ? "Show the whole garden" : `Walk to ${regions[r].name}`}, ${regions[r].subtitle}`}
            >
              <span className={`block font-serif text-[clamp(1.25rem,2.4vw,2.1rem)] font-medium leading-tight transition-colors ${emphasised(r) ? "text-forest" : "text-ink/80"}`}>
                {regions[r].name}
              </span>
              <span className={`block text-[clamp(0.7rem,1vw,0.9rem)] font-semibold tracking-[0.14em] uppercase ${r === "creative-corner" ? "text-[#9b5444]" : "text-moss"}`}>
                {regions[r].subtitle}
              </span>
            </button>
          ))}

          {/* project landmarks */}
          {projects.map((p) => {
            const Art = objectArt[p.gardenLocation];
            const pos = placement[p.gardenLocation];
            return (
              <button
                key={p.id}
                type="button"
                data-project={p.slug}
                onClick={() => openProject(p)}
                onMouseEnter={() => setHovered(p.gardenRegion)}
                onMouseLeave={() => setHovered(null)}
                className={`hotspot group absolute flex flex-col rounded-2xl ${pos.labelEnd ? "items-end" : "items-center"}`}
                style={{ left: `${pos.left}%`, top: `${pos.top}%`, width: `${pos.width}%` }}
                aria-label={`${p.title} — ${p.category === "personal" ? "Personal" : "Academic"} project at ${p.locationName}. Open preview.`}
              >
                <Art className="art w-full overflow-visible" />
                {/* handwritten label with a little drawn underline */}
                <span className="hand-label pointer-events-none -mt-2 w-max text-center whitespace-nowrap">
                  <span className="block font-hand text-[clamp(1.15rem,1.9vw,1.8rem)] leading-none font-semibold text-ink">{p.title}</span>
                  <svg viewBox="0 0 120 10" preserveAspectRatio="none" className="hand-underline mx-auto -mt-0.5 h-2 w-full" aria-hidden="true">
                    <path d="M3 6 C 30 2, 60 9, 117 4" stroke={p.category === "personal" ? "#c4705c" : "#6f8a5a"} strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  </svg>
                  <span className="block font-hand text-[clamp(0.85rem,1.2vw,1.15rem)] leading-tight text-ink-soft">{p.locationName}</span>
                </span>
                {visited.includes(p.slug) && (
                  <span className="absolute -top-1 right-[8%] w-[16%] min-w-5" title="Visited this session">
                    <VisitedBloom className="w-full" />
                    <span className="sr-only">Visited</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* "You are here" label stays put while the view is zoomed into a region. */}
        {view !== "all" && (
          <div className="absolute top-4 left-4 flex items-center gap-3 rounded-2xl bg-paper/90 py-2 pr-2 pl-4 shadow-sm">
            <p>
              <span className="block font-serif text-lg leading-tight font-medium text-ink">{regions[view].name}</span>
              <span className={`block text-xs font-semibold tracking-[0.14em] uppercase ${view === "creative-corner" ? "text-[#9b5444]" : "text-moss"}`}>
                {regions[view].subtitle}
              </span>
            </p>
            <button
              type="button"
              onClick={() => choose("all")}
              className="min-h-11 rounded-full border border-forest/30 px-4 text-sm font-medium text-forest transition hover:bg-cream"
            >
              Whole garden
            </button>
          </div>
        )}
      </div>

      {/* ---------- Mobile: illustrated regions stacked vertically ---------- */}
      <div className="space-y-6 md:hidden">
        {regionIds.map((r) => (
          <section
            key={r}
            aria-labelledby={`m-${r}`}
            className={`paper-grain overflow-hidden rounded-[24px] p-5 ${
              r === "creative-corner"
                ? "bg-[linear-gradient(180deg,#f6d6cc_0%,#f3e2cf_35%,#c6c995_100%)]"
                : "bg-[linear-gradient(180deg,#f3dccf_0%,#e9e6cf_35%,#a9bb8c_100%)]"
            } ${view === r ? "ring-2 ring-forest/50" : ""}`}
          >
            <h3 id={`m-${r}`} className="font-serif text-2xl font-medium text-ink">{regions[r].name}</h3>
            <p className={`text-xs font-semibold tracking-[0.14em] uppercase ${r === "creative-corner" ? "text-[#9b5444]" : "text-forest"}`}>
              {regions[r].subtitle}
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {projectsInRegion(r).map((p) => {
                const Art = objectArt[p.gardenLocation];
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      data-project={p.slug}
                      onClick={() => openProject(p)}
                      className="hotspot relative flex h-full w-full flex-col items-center rounded-2xl bg-paper/55 p-3 text-center"
                      aria-label={`${p.title} at ${p.locationName}. Open preview.`}
                    >
                      <Art className="art h-24 w-full" />
                      <span className="mt-2 font-hand text-2xl leading-none font-semibold">{p.title}</span>
                      <span className="font-hand text-lg text-ink-soft">{p.locationName}</span>
                      {visited.includes(p.slug) && (
                        <span className="absolute top-2 right-2 w-5" title="Visited this session">
                          <VisitedBloom className="w-full" />
                          <span className="sr-only">Visited</span>
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <ProjectPreview project={open} onClose={() => setOpen(null)} />
    </div>
  );
}
