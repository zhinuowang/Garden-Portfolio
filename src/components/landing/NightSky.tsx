// The night layer laid over each Landing scene: a moonlit blue wash multiplied
// into the painting (so it reads as the same painting at night), and, in the
// first scene, a soft moon, a sprinkling of stars and a few fireflies over the
// grass. Invisible by day; it fades in with the lamp (see globals.css).

const rand = (i: number, k: number) => {
  const s = Math.sin(i * 91.7 + k * 47.3) * 43758.5453;
  return s - Math.floor(s);
};
const STARS = Array.from({ length: 46 }, (_, i) => ({ x: rand(i, 1) * 100, y: rand(i, 2) * 30, r: 1 + rand(i, 3) * 1.6, d: rand(i, 4) * 6 }));
const FLIES = Array.from({ length: 10 }, (_, i) => ({ x: 8 + rand(i, 5) * 84, y: 58 + rand(i, 6) * 34, d: rand(i, 7) * 8, s: 7 + rand(i, 8) * 6 }));

export default function NightSky({ scene }: { scene: 1 | 2 | 3 }) {
  return (
    <div aria-hidden="true" className="night-sky pointer-events-none absolute inset-0">
      <span className="night-sky__wash absolute inset-0" />
      {scene === 1 && (
        <>
          <span className="night-sky__moon absolute" />
          {STARS.map((s, i) => (
            <span key={i} className="night-sky__star absolute rounded-full" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2, animationDelay: `${s.d}s` }} />
          ))}
          {FLIES.map((f, i) => (
            <span key={i} className="night-sky__fly absolute rounded-full" style={{ left: `${f.x}%`, top: `${f.y}%`, animationDelay: `${f.d}s`, animationDuration: `${f.s}s` }} />
          ))}
        </>
      )}
    </div>
  );
}
