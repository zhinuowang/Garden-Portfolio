import { landingArt as art } from "@/data/landingArt";

// The night version of each Landing scene: the same painting colour-graded into
// moonlight (scripts/night-grade.mjs), laid over the day painting and simply
// cross-faded in, plus — in the first scene — a soft moon, a sprinkling of stars
// and a few fireflies over the grass. Loaded with the page (lazily for the lower
// scenes), so nothing has to load when the lamp is lit. Invisible by day.

const rand = (i: number, k: number) => {
  const s = Math.sin(i * 91.7 + k * 47.3) * 43758.5453;
  return s - Math.floor(s);
};
const STARS = Array.from({ length: 46 }, (_, i) => ({ x: rand(i, 1) * 100, y: rand(i, 2) * 30, r: 1 + rand(i, 3) * 1.6, d: rand(i, 4) * 6 }));
const FLIES = Array.from({ length: 10 }, (_, i) => ({ x: 8 + rand(i, 5) * 84, y: 58 + rand(i, 6) * 34, d: rand(i, 7) * 8, s: 7 + rand(i, 8) * 6 }));
const nightSrc = (scene: 1 | 2 | 3, fmt: "desktop" | "mobile", w: number) => art.src(scene, fmt, w).replace(/\.webp$/, "-night.webp");

export default function NightSky({ scene }: { scene: 1 | 2 | 3 }) {
  return (
    <div aria-hidden="true" className="night-sky pointer-events-none absolute inset-0">
      <picture>
        <source media={art.portraitQuery} srcSet={art.portrait.sizes.map((w) => `${nightSrc(scene, "mobile", w)} ${w}w`).join(", ")} sizes="100vw" />
        <img
          src={nightSrc(scene, "desktop", art.desktop.sizes[0])}
          srcSet={art.desktop.sizes.map((w) => `${nightSrc(scene, "desktop", w)} ${w}w`).join(", ")}
          sizes="100vw"
          alt=""
          loading={scene === 1 ? "eager" : "lazy"}
          decoding="async"
          className="night-sky__art absolute inset-0 block h-full w-full select-none"
          draggable={false}
        />
      </picture>
      {scene === 1 && (
        <div className="night-sky__details absolute inset-0">
          <span className="night-sky__moon absolute" />
          {STARS.map((s, i) => (
            <span key={i} className="night-sky__star absolute rounded-full" style={{ left: `${s.x.toFixed(3)}%`, top: `${s.y.toFixed(3)}%`, width: `${(s.r * 2).toFixed(2)}px`, height: `${(s.r * 2).toFixed(2)}px`, animationDelay: `${s.d.toFixed(2)}s` }} />
          ))}
          {FLIES.map((f, i) => (
            <span key={i} className="night-sky__fly absolute rounded-full" style={{ left: `${f.x.toFixed(3)}%`, top: `${f.y.toFixed(3)}%`, animationDelay: `${f.d.toFixed(2)}s`, animationDuration: `${f.s.toFixed(2)}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}
