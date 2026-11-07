import type { Metadata } from "next";
import WorkGarden from "@/components/work/WorkGarden";

export const metadata: Metadata = {
  title: "Work | A Garden of Ideas — Zhinuo Wang",
  description: "Explore three projects by Zhinuo Wang in a small painted garden: two academic projects and one personal project.",
};

export default function WorkPage() {
  return (
    <div className="work-page nightable relative flex min-h-svh flex-col justify-end overflow-hidden px-0 pt-28 sm:pt-[4.2rem]">
      <section aria-labelledby="work-title" className="relative flex flex-col items-center">
        {/* the heading sits in the garden's open sky, so the garden itself begins right under the site header */}
        <h1 id="work-title" className="pointer-events-none absolute inset-x-0 top-[3.5%] z-10 mx-auto max-w-5xl px-4 text-center font-serif text-[clamp(1.6rem,3vw,2.5rem)] leading-tight font-medium text-ink [text-shadow:0_0_18px_rgb(251_243_236/0.7)] portrait-art:top-[2.5%]">
          Choose a place to explore my work.
        </h1>
        <WorkGarden />
      </section>
    </div>
  );
}
