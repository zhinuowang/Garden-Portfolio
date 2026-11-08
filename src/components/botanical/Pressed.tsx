// Pressed-flower ornaments for the journal pages (Category A, decorative).

type P = { className?: string };

export function PressedDaisy({ className }: P) {
  return (
    <svg viewBox="0 0 120 220" className={`garden-ornament ${className ?? ""}`} aria-hidden="true" focusable="false">
      <g filter="url(#paint)">
        <path d="M60 218 C 58 170, 66 130, 60 70" stroke="#7d9468" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M61 160 C 40 150, 26 156, 18 168 C 34 172, 48 168, 61 160 Z" fill="#9db27f" opacity="0.85" />
        <path d="M62 128 C 84 116, 98 122, 106 134 C 90 140, 74 136, 62 128 Z" fill="#a9bc8b" opacity="0.85" />
        <g transform="translate(60 62)">
          {Array.from({ length: 12 }, (_, i) => i * 30).map((a) => (
            <ellipse key={a} cx="0" cy="-20" rx="6.5" ry="17" fill="#fbf4ea" stroke="#e8d8c4" strokeWidth="1" transform={`rotate(${a})`} />
          ))}
          <circle r="10" fill="#e6b45e" />
          <circle r="10" fill="#d99a3e" opacity="0.35" />
        </g>
      </g>
    </svg>
  );
}

export function PressedSprig({ className }: P) {
  return (
    <svg viewBox="0 0 120 240" className={`garden-ornament ${className ?? ""}`} aria-hidden="true" focusable="false">
      <g filter="url(#paint)">
        <path d="M58 236 C 60 180, 52 110, 66 20" stroke="#7d9468" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {[40, 70, 100, 130, 160, 190].map((y, i) => (
          <g key={y}>
            <ellipse cx={i % 2 ? 76 : 44} cy={y} rx="16" ry="7" fill={i % 2 ? "#a9bc8b" : "#93ab78"} transform={`rotate(${i % 2 ? -30 : 30} ${i % 2 ? 76 : 44} ${y})`} opacity="0.9" />
          </g>
        ))}
        {[[66, 22], [72, 34], [60, 30]].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="6" fill="#e9afab" opacity="0.9" />
        ))}
      </g>
    </svg>
  );
}

export function PressedBlossom({ className }: P) {
  return (
    <svg viewBox="0 0 140 140" className={`garden-ornament ${className ?? ""}`} aria-hidden="true" focusable="false">
      <g filter="url(#paint)" transform="translate(70 70)">
        {[0, 72, 144, 216, 288].map((a) => (
          <path key={a} d="M0 0 C -18 -20, -16 -48, 0 -54 C 16 -48, 18 -20, 0 0 Z" fill="#f2b8a0" opacity="0.85" transform={`rotate(${a})`} />
        ))}
        {[36, 108, 180, 252, 324].map((a) => (
          <path key={a} d="M0 0 C -6 -10, -6 -24, 0 -30" stroke="#d98f7f" strokeWidth="1.5" fill="none" transform={`rotate(${a})`} />
        ))}
        <circle r="9" fill="#e3bf73" />
      </g>
    </svg>
  );
}

/** A strip of washi tape holding a photo or note in place. */
export function Tape({ className, color = "#e9afab" }: P & { color?: string }) {
  return (
    <svg viewBox="0 0 120 34" className={className} aria-hidden="true" focusable="false">
      <path d="M4 6 L116 2 L114 30 L2 32 Z" fill={color} opacity="0.6" filter="url(#paint)" />
    </svg>
  );
}
