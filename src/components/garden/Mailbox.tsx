// The garden mailbox (scripts/paint-landing.mjs --mailbox): one painting in three stacked layers, so
// the arched front door can tip open and the little flag can lift. It is pure artwork; the link or
// button around it (".mailbox-host") owns the hover and focus that open it.

const SRC = "/assets/garden/mailbox/mailbox-";

export default function Mailbox({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`mailbox ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- painted mailbox layers */}
      <img src={`${SRC}body.webp`} alt="" width={400} height={520} draggable={false} className="mailbox__body" />
      {/* eslint-disable-next-line @next/next/no-img-element -- the flag */}
      <img src={`${SRC}flag.webp`} alt="" width={400} height={520} draggable={false} className="mailbox__flag" />
      {/* eslint-disable-next-line @next/next/no-img-element -- the door */}
      <img src={`${SRC}door.webp`} alt="" width={400} height={520} draggable={false} className="mailbox__door" />
    </span>
  );
}
