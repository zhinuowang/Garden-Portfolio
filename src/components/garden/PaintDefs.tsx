// Shared SVG filters that give code-drawn shapes soft, uneven painted edges and
// paper grain. Rendered once per page; referenced by id from every garden SVG.
// Category A (decorative) only.

export default function PaintDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" className="absolute">
      <defs>
        {/* Small objects: slight edge wobble + speckled grain. */}
        <filter id="paint" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="4" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="5" xChannelSelector="R" yChannelSelector="G" result="shape" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="9" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.17  0 0 0 0 0.12  0 0 0 0.5 -0.12" result="speck" />
          <feComposite in="speck" in2="shape" operator="in" result="speckOnShape" />
          <feMerge>
            <feMergeNode in="shape" />
            <feMergeNode in="speckOnShape" />
          </feMerge>
        </filter>

        {/* Large land masses: broad watercolor wobble with a soft bleed. */}
        <filter id="wash" x="-5%" y="-10%" width="110%" height="125%">
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.02" numOctaves="3" seed="2" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="22" xChannelSelector="R" yChannelSelector="G" result="shape" />
          <feGaussianBlur in="shape" stdDeviation="1.2" result="soft" />
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.18" numOctaves="3" seed="7" result="strokes" />
          <feColorMatrix in="strokes" type="matrix" values="0 0 0 0 0.15  0 0 0 0 0.22  0 0 0 0 0.12  0 0 0 0.55 -0.2" result="streak" />
          <feComposite in="streak" in2="soft" operator="in" result="streakOnShape" />
          <feMerge>
            <feMergeNode in="soft" />
            <feMergeNode in="streakOnShape" />
          </feMerge>
        </filter>

        {/* Clouds and haze: heavy blur with a ragged edge. */}
        <filter id="cloud" x="-30%" y="-60%" width="160%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="12" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="40" xChannelSelector="R" yChannelSelector="G" result="shape" />
          <feGaussianBlur in="shape" stdDeviation="7" />
        </filter>

        <radialGradient id="warmGlow">
          <stop offset="0%" stopColor="#ffe4a8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffe4a8" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
