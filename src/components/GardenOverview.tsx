import Link from "next/link";
import GardenExplorer from "./garden/GardenExplorer";

export default function GardenOverview() {
  return (
    <section id="garden" aria-labelledby="garden-title" className="scroll-mt-16 bg-[linear-gradient(180deg,#f6e6d6_0%,#f6f1e5_220px)] px-4 pt-16 pb-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="garden-title" className="font-serif text-[clamp(2rem,4.5vw,3.2rem)] leading-tight font-medium">
            Every idea has a place to grow.
          </h2>
          <p className="mt-3 text-lg text-ink-soft">
            Explore two corners of my garden, each telling a different story of creativity, learning, and design.
          </p>
        </div>
        <div className="mt-10">
          <GardenExplorer />
        </div>
        <p className="mt-5 text-center text-sm text-ink-soft">
          Select any landmark to preview its project, or browse the{" "}
          <Link href="/work" className="font-medium text-forest underline underline-offset-4">full project list</Link>.
        </p>
      </div>
    </section>
  );
}
