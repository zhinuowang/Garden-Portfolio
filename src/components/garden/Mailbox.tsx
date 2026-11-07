// The garden mailbox (scripts/paint-landing.mjs --mailbox): one painting in stacked layers, so the arched
// front door can tip open, the flag lift and a little envelope slide out. The Landing shows it small in
// the landscape; the Contact page shows the same mailbox larger, standing in its own patch of flowers
// (`garden`). It is pure artwork: whatever holds it (".mailbox-host") owns the hover, focus and open state.

const SRC = "/assets/garden/mailbox/mailbox-";
const LAYER = { width: 800, height: 1040, alt: "", draggable: false } as const;

export default function Mailbox({ garden = false, className = "" }: { garden?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={`mailbox ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- painted mailbox layers */}
      <img src={`${SRC}body.webp`} {...LAYER} className="mailbox__body" />
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- the letter inside */}
      <img src={`${SRC}envelope.webp`} {...LAYER} className="mailbox__envelope" />
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- the flag */}
      <img src={`${SRC}flag.webp`} {...LAYER} className="mailbox__flag" />
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- the door */}
      <img src={`${SRC}door.webp`} {...LAYER} className="mailbox__door" />
      {garden && (
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- the flowers at its foot
        <img src={`${SRC}garden.webp`} {...LAYER} className="mailbox__garden" />
      )}
    </span>
  );
}
