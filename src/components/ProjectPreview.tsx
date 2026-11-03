"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Project } from "@/data/projects";
import CategoryBadge from "./CategoryBadge";
import ProjectMedia from "./ProjectMedia";
import { PressedDaisy, Tape } from "./botanical/Pressed";

// Native modal <dialog>: traps focus, closes on Esc, returns focus to the
// hotspot that opened it.
export default function ProjectPreview({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (project && !dialog.open) dialog.showModal();
    if (!project && dialog.open) dialog.close();
  }, [project]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="preview-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="preview-dialog m-auto w-[min(92vw,640px)] max-h-[90dvh] overflow-visible bg-transparent p-0 text-ink backdrop:bg-[#40583c]/35 backdrop:backdrop-blur-[2px]"
    >
      {project && (
        <div className="paper-grain relative max-h-[90dvh] overflow-y-auto rounded-[6px] bg-paper p-5 shadow-[0_30px_80px_-20px_rgb(64_88_60/0.5)] sm:-rotate-[0.6deg] sm:p-7">
          <Tape className="pointer-events-none absolute top-0 left-8 w-24 -rotate-6" />
          <Tape className="pointer-events-none absolute top-0 right-20 w-20 rotate-6" color="#a4b68c" />
          <PressedDaisy className="pointer-events-none absolute right-2 bottom-2 hidden w-10 rotate-12 opacity-80 sm:block" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <CategoryBadge category={project.category} />
              <p className="mt-2 font-hand text-xl text-ink-soft">found at {project.locationName}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-cream text-ink transition hover:bg-[#ece4d3]"
              aria-label="Close preview"
            >
              <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <h2 id="preview-title" className="mt-2 font-serif text-3xl font-medium sm:text-4xl">
            {project.title}
          </h2>
          {project.discipline && <p className="mt-1 text-sm font-medium text-moss">{project.discipline}</p>}

          <div className="mt-5">
            <ProjectMedia image={project.heroImage} sizes="(max-width: 700px) 92vw, 600px" />
          </div>

          <p className="mt-5 leading-relaxed text-ink-soft">
            {project.shortDescription ?? "Project description to be provided."}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={`/work/${project.slug}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-forest px-6 py-2.5 font-medium text-paper transition hover:bg-[#344a31]"
            >
              View Case Study
              <span aria-hidden="true">→</span>
            </Link>
            <button type="button" onClick={onClose} className="min-h-11 rounded-full px-5 py-2.5 font-medium text-forest underline-offset-4 hover:underline">
              Keep exploring
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
