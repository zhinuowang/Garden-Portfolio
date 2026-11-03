// Code-drawn decorative garden objects (Category A). These are navigation
// landmarks only — never project artwork. Each is a temporary stand-in until
// hand-painted files are supplied (see docs/PHASE-1-PLAN.md, "Illustrated files").

import type { GardenLocationId } from "@/data/projects";

type ArtProps = { className?: string };

function Tuft({ x, y, s = 1, c = "#6f8a5a" }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={c} strokeWidth="2" strokeLinecap="round" fill="none">
      <path d="M0 0 C -2 -8, -6 -12, -9 -16" />
      <path d="M0 0 C 0 -9, 1 -14, 2 -19" />
      <path d="M0 0 C 3 -7, 6 -10, 10 -13" />
    </g>
  );
}

function Bloom({ x, y, r = 4, petal = "#fbf3ea", eye = "#e3a94f" }: { x: number; y: number; r?: number; petal?: string; eye?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy={-r} rx={r * 0.55} ry={r * 0.95} fill={petal} transform={`rotate(${a})`} />
      ))}
      <circle r={r * 0.5} fill={eye} />
    </g>
  );
}

export function Greenhouse({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 220 180" className={className} aria-hidden="true" focusable="false">
      <ellipse className="glow" cx="110" cy="95" rx="100" ry="70" fill="url(#warmGlow)" />
      <g filter="url(#paint)">
        <ellipse cx="110" cy="164" rx="98" ry="12" fill="#8fa66f" opacity="0.6" />
        {/* brick footing */}
        <path d="M34 140 H186 V160 H34 Z" fill="#d9a48c" />
        <path d="M34 150 H186" stroke="#c08670" strokeWidth="1.5" />
        {/* glass body */}
        <path d="M38 140 V80 L110 34 L182 80 V140 Z" fill="#e6f1ea" opacity="0.72" />
        <path d="M38 140 V80 L110 34 L182 80 V140" fill="none" stroke="#5f7a52" strokeWidth="3.5" strokeLinejoin="round" />
        {/* panes */}
        <g stroke="#5f7a52" strokeWidth="1.8" opacity="0.85">
          <path d="M74 140 V57 M110 140 V34 M146 140 V57 M38 110 H182 M38 80 H182" />
        </g>
        {/* reflections */}
        <path d="M48 88 L64 78 M120 46 L134 55 M156 92 L170 84" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        {/* plants inside */}
        <ellipse cx="62" cy="130" rx="18" ry="12" fill="#7d9b62" opacity="0.8" />
        <ellipse cx="104" cy="126" rx="22" ry="16" fill="#6d8c58" opacity="0.75" />
        <ellipse cx="152" cy="130" rx="20" ry="13" fill="#86a36a" opacity="0.8" />
        <circle cx="96" cy="118" r="4" fill="#e9afab" />
        <circle cx="112" cy="122" r="3.5" fill="#f2b8a0" />
        <circle cx="148" cy="124" r="3.5" fill="#e9afab" />
        <circle cx="58" cy="124" r="3" fill="#f6e3b0" />
        {/* door */}
        <path d="M98 140 V112 Q110 102 122 112 V140" fill="#f4ead9" opacity="0.85" stroke="#5f7a52" strokeWidth="2" />
        <circle cx="117" cy="127" r="1.8" fill="#5f7a52" />
      </g>
      {/* wildflowers around the base */}
      <g>
        <Tuft x={30} y={162} /><Tuft x={190} y={160} s={1.1} /><Tuft x={80} y={168} s={0.8} />
        <Bloom x={24} y={152} r={4.5} petal="#f2b8a0" />
        <Bloom x={44} y={163} r={3.5} />
        <Bloom x={176} y={156} r={4.5} petal="#e9afab" />
        <Bloom x={198} y={166} r={3.5} />
        <Bloom x={140} y={168} r={3} petal="#f2b8a0" />
      </g>
    </svg>
  );
}

export function Cottage({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 220 190" className={className} aria-hidden="true" focusable="false">
      <g filter="url(#paint)">
        <ellipse cx="110" cy="176" rx="100" ry="12" fill="#8fa66f" opacity="0.6" />
        {/* chimney */}
        <path d="M150 40 H166 V78 H150 Z" fill="#c98f7a" />
        {/* walls */}
        <path d="M42 96 H178 V168 H42 Z" fill="#f4e6d1" />
        <path d="M42 96 H178" stroke="#d8c3a4" strokeWidth="2" />
        {/* thatched roof */}
        <path d="M24 102 Q60 42 110 34 Q160 42 196 102 Q110 112 24 102 Z" fill="#e3a08c" />
        <path d="M40 92 Q110 70 182 92 M52 74 Q110 54 168 74 M70 56 Q110 42 150 56" stroke="#c97d6c" strokeWidth="2" fill="none" opacity="0.7" />
        {/* door */}
        <path d="M98 168 V130 Q110 118 122 130 V168 Z" fill="#5f7a52" />
        <circle cx="117" cy="150" r="2" fill="#e3bf73" />
      </g>
      {/* windows with warm glow on hover */}
      <g>
        <rect x="56" y="118" width="26" height="24" rx="3" fill="#f6dfa3" />
        <rect className="glow" x="56" y="118" width="26" height="24" rx="3" fill="#ffcf6b" />
        <rect x="138" y="118" width="26" height="24" rx="3" fill="#f6dfa3" />
        <rect className="glow" x="138" y="118" width="26" height="24" rx="3" fill="#ffcf6b" />
        <path d="M69 118 V142 M56 130 H82 M151 118 V142 M138 130 H164" stroke="#8a6a52" strokeWidth="2" />
        <rect x="56" y="118" width="26" height="24" rx="3" fill="none" stroke="#8a6a52" strokeWidth="2.5" />
        <rect x="138" y="118" width="26" height="24" rx="3" fill="none" stroke="#8a6a52" strokeWidth="2.5" />
        {/* flower boxes */}
        <rect x="52" y="142" width="34" height="6" rx="2" fill="#b8806a" />
        <rect x="134" y="142" width="34" height="6" rx="2" fill="#b8806a" />
        {[58, 66, 74, 82].map((x) => <circle key={x} cx={x} cy={140} r="3.2" fill={x % 16 ? "#e9afab" : "#f2b8a0"} />)}
        {[140, 148, 156, 164].map((x) => <circle key={x} cx={x} cy={140} r="3.2" fill={x % 16 ? "#f2b8a0" : "#e9afab"} />)}
      </g>
      <g>
        <Tuft x={30} y={174} /><Tuft x={196} y={172} s={1.1} />
        <Bloom x={34} y={164} r={4.5} petal="#e9afab" />
        <Bloom x={186} y={166} r={4.5} petal="#f2b8a0" />
        <Bloom x={14} y={176} r={3.5} />
        <Bloom x={206} y={180} r={3.5} />
      </g>
    </svg>
  );
}

export function PuppyCorner({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 220 160" className={className} aria-hidden="true" focusable="false">
      <g filter="url(#paint)">
        <ellipse cx="110" cy="142" rx="104" ry="16" fill="#93ab78" opacity="0.7" />
        {/* doghouse */}
        <path d="M60 136 V82 H142 V136 Z" fill="#d8a27f" />
        <path d="M48 86 L101 42 L154 86 Z" fill="#9b6a56" />
        <path d="M48 86 L101 42 L154 86" fill="none" stroke="#7d5444" strokeWidth="3" strokeLinejoin="round" />
        <path d="M84 136 V110 Q101 92 118 110 V136 Z" fill="#4c3a33" />
        <path d="M66 98 H136 M66 116 H80 M122 116 H136" stroke="#c48d6b" strokeWidth="1.6" />
        {/* bowl */}
        <path d="M152 130 Q170 146 188 130 Z" fill="#8fa9b8" />
        <ellipse cx="170" cy="130" rx="18" ry="4.5" fill="#b9cfda" />
        <ellipse cx="170" cy="129" rx="13" ry="3" fill="#c79a62" />
        {/* ball */}
        <circle cx="30" cy="132" r="9" fill="#e9afab" />
        <path d="M22 128 Q30 134 38 128" stroke="#fbf3ea" strokeWidth="2" fill="none" />
      </g>
      {/* paw-print stepping stones */}
      <g fill="#7d9468" opacity="0.55">
        {[[18, 150], [40, 154]].map(([x, y]) => (
          <g key={x} transform={`translate(${x} ${y})`}>
            <ellipse rx="4" ry="3" /><circle cx="-4" cy="-5" r="1.6" /><circle cx="0" cy="-6.5" r="1.6" /><circle cx="4" cy="-5" r="1.6" />
          </g>
        ))}
      </g>
      <g>
        <Tuft x={56} y={140} /><Tuft x={146} y={140} s={0.9} /><Tuft x={204} y={146} />
        <Bloom x={200} y={136} r={4} />
        <Bloom x={14} y={142} r={3.5} petal="#f6e3b0" />
      </g>
    </svg>
  );
}

export function Fountain({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 220 200" className={className} aria-hidden="true" focusable="false">
      <ellipse className="glow" cx="110" cy="80" rx="70" ry="60" fill="#dff1f2" />
      <g filter="url(#paint)">
        <ellipse cx="110" cy="184" rx="96" ry="12" fill="#93ab78" opacity="0.7" />
        {/* lower basin */}
        <path d="M30 150 Q110 196 190 150 V162 Q110 206 30 162 Z" fill="#d9d0c1" />
        <ellipse cx="110" cy="150" rx="80" ry="18" fill="#ebe4d6" />
        <ellipse cx="110" cy="151" rx="68" ry="13" fill="#b6d8db" />
        {/* stem */}
        <path d="M100 150 V96 H120 V150 Z" fill="#e3dbcc" />
        {/* upper bowl */}
        <path d="M66 92 Q110 120 154 92 Z" fill="#d9d0c1" />
        <ellipse cx="110" cy="92" rx="44" ry="9" fill="#ebe4d6" />
        <ellipse cx="110" cy="92" rx="36" ry="6" fill="#b6d8db" />
        {/* spout + falling water */}
        <path d="M106 92 V66 Q110 58 114 66 V92" fill="#e3dbcc" />
        <path d="M110 60 Q80 56 72 92 M110 60 Q140 56 148 92" stroke="#bfe0e4" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M68 94 Q60 120 56 146 M152 94 Q160 120 164 146" stroke="#c7e4e7" strokeWidth="2.5" fill="none" opacity="0.85" />
      </g>
      {/* rising bubbles */}
      <g fill="none" stroke="#fffaf2" strokeWidth="1.8">
        {[
          [90, 140, 5, 0], [124, 138, 4, 1.1], [104, 84, 3.5, 2.3], [140, 146, 6, 0.6],
          [78, 146, 3.5, 1.8], [118, 82, 4.5, 3.1], [160, 142, 3, 2.7],
        ].map(([x, y, r, d]) => (
          <circle key={`${x}-${y}`} className="bubble" cx={x} cy={y} r={r} style={{ animationDelay: `${d}s` }} fill="#e8f6f7" fillOpacity="0.35" />
        ))}
      </g>
      <g>
        <Tuft x={24} y={180} /><Tuft x={198} y={178} />
        <Bloom x={36} y={176} r={3.5} petal="#c9b8d8" />
        <Bloom x={186} y={182} r={3.5} />
      </g>
    </svg>
  );
}

export function Windmill({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 200 290" className={className} aria-hidden="true" focusable="false">
      <g filter="url(#paint)">
        <ellipse cx="100" cy="276" rx="80" ry="12" fill="#93ab78" opacity="0.7" />
        {/* tower */}
        <path d="M70 274 L80 120 H120 L130 274 Z" fill="#f1e6d4" />
        <path d="M76 200 H124 M73 240 H127" stroke="#dccab0" strokeWidth="2" />
        <path d="M92 274 V246 Q100 236 108 246 V274 Z" fill="#7d6152" />
        <rect x="94" y="168" width="12" height="16" rx="2" fill="#b6d0d3" stroke="#8a6a52" strokeWidth="1.5" />
        {/* cap */}
        <path d="M74 122 Q100 84 126 122 Z" fill="#c5786f" />
      </g>
      {/* sails, rotating about the hub */}
      <g className="blades">
        <g filter="url(#paint)" fill="#fbf5ea" stroke="#8a6a52" strokeWidth="1.8">
          {[0, 90, 180, 270].map((a) => (
            <g key={a} transform={`rotate(${a} 100 104)`}>
              <path d="M97 104 V20 H103 V104 Z" fill="#8a6a52" />
              <path d="M103 30 H128 V96 H103 Z" opacity="0.92" />
              <path d="M103 52 H128 M103 74 H128" fill="none" />
            </g>
          ))}
        </g>
      </g>
      <circle cx="100" cy="104" r="6" fill="#8a6a52" />
      {/* airflow hint, echoing the hair-dryer theme */}
      <g className="glow" stroke="#ffffff" strokeWidth="2.2" fill="none" strokeLinecap="round">
        <path d="M150 140 Q170 132 186 140" />
        <path d="M146 156 Q168 148 192 158" />
        <path d="M154 172 Q170 166 182 172" />
      </g>
      <g>
        <Tuft x={60} y={274} /><Tuft x={142} y={272} />
        <Bloom x={50} y={268} r={3.5} />
        <Bloom x={150} y={266} r={3.5} petal="#f6e3b0" />
      </g>
    </svg>
  );
}

export function VisitedBloom({ className }: ArtProps) {
  return (
    <svg viewBox="-12 -12 24 24" className={className} aria-hidden="true" focusable="false">
      <g className="bloom">
        <Bloom x={0} y={0} r={6} petal="#fff7ef" eye="#e3a94f" />
      </g>
    </svg>
  );
}

export const objectArt: Record<GardenLocationId, (p: ArtProps) => React.JSX.Element> = {
  greenhouse: Greenhouse,
  cottage: Cottage,
  "puppy-corner": PuppyCorner,
  fountain: Fountain,
  windmill: Windmill,
};
