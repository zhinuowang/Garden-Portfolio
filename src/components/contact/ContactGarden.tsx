"use client";

import Image from "next/image";
import { useRef } from "react";
import { contact } from "@/data/site";

// The last stop in the garden: three hand-painted contact icons (scripts/paint-landing.mjs --icons)
// over the painted meadow (--contact). Email and LinkedIn are plain links; WeChat opens a small
// panel. Every icon has a written label, so the pictures are never the only cue.

const ICON = { width: 360, height: 360 };

function Icon({ kind }: { kind: "email" | "linkedin" | "wechat" }) {
  return (
    <span className="contact-icon" aria-hidden="true">
      <Image src={`/assets/garden/contact/icon-${kind}.webp`} alt="" {...ICON} sizes="128px" className="h-auto w-full" />
    </span>
  );
}

function Label({ title, sub }: { title: string; sub: React.ReactNode }) {
  return (
    <>
      <span className="mt-3 font-serif text-[1.2rem] leading-tight font-medium text-ink sm:text-[1.45rem]">{title}</span>
      <span className="mt-1 text-[0.8rem] leading-snug text-ink-soft sm:text-sm">{sub}</span>
    </>
  );
}

const card =
  "contact-card group flex min-h-11 w-full flex-col items-center rounded-3xl px-1 pt-4 pb-5 text-center sm:px-3 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-moss";

export default function ContactGarden() {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <div className="nightable relative isolate flex min-h-[100svh] items-center overflow-x-clip px-4 pt-28 pb-20 sm:px-6">
      <div aria-hidden="true" className="journal-backdrop journal-backdrop--contact" />

      <section aria-labelledby="contact-title" className="garden-mist garden-mist--soft relative mx-auto w-full max-w-4xl text-center">
        <p className="font-hand text-2xl text-moss">the last stop in the garden</p>
        <h1 id="contact-title" className="mt-1 font-serif text-[clamp(2.5rem,6vw,4.2rem)] leading-[1.04] font-medium text-ink">
          Let&rsquo;s stay in touch.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">For opportunities, collaborations, or a friendly hello.</p>

        <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-1 sm:mt-12 sm:gap-8">
          <li style={{ ["--tilt" as string]: "-3deg" }}>
            <a href={`mailto:${contact.email}`} className={card}>
              <Icon kind="email" />
              <Label title="Email" sub={<><span className="sm:hidden">Send a note</span><span className="hidden break-all sm:inline">{contact.email}</span></>} />
            </a>
          </li>
          <li style={{ ["--tilt" as string]: "2deg" }}>
            <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className={card}>
              <Icon kind="linkedin" />
              <Label title="LinkedIn" sub="View my profile ↗" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
          <li style={{ ["--tilt" as string]: "-2deg" }}>
            <button type="button" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()} className={`${card} cursor-pointer`}>
              <Icon kind="wechat" />
              <Label title="WeChat" sub="Scan my QR code" />
            </button>
          </li>
        </ul>
      </section>

      {/* WeChat: a small panel; Esc, the close button or a click outside it closes it */}
      <dialog
        ref={dialog}
        aria-labelledby="wechat-title"
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        className="wechat-panel m-auto w-[min(22rem,calc(100vw-2rem))] rounded-3xl bg-paper p-0 text-ink"
      >
        <div className="px-6 pt-6 pb-6 text-center">
          <h2 id="wechat-title" className="font-serif text-2xl font-medium text-ink">WeChat</h2>
          {contact.wechatQr ? (
            <>
              <Image
                src={contact.wechatQr.src}
                alt="Zhinuo Wang's WeChat QR code (WeChat name 小诺., Toronto, Canada)"
                width={contact.wechatQr.width}
                height={contact.wechatQr.height}
                unoptimized
                className="mx-auto mt-4 h-auto w-60 rounded-xl"
              />
              <p className="mt-3 text-sm text-ink-soft">Scan with WeChat to add me.</p>
            </>
          ) : (
            <>
              <div role="img" aria-label="Placeholder: WeChat QR code not added yet" className="mx-auto mt-4 flex aspect-square w-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-moss/45 px-4">
                <span className="font-hand text-2xl text-moss">QR code</span>
                <span className="mt-1 text-xs font-semibold tracking-[0.14em] text-ink-soft uppercase">coming soon</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                My WeChat QR code will be here soon. Until then, email is the quickest way to reach me:
                <a href={`mailto:${contact.email}`} className="mt-1 block font-medium break-all text-forest underline underline-offset-4">{contact.email}</a>
              </p>
            </>
          )}
          <button
            type="button"
            autoFocus
            onClick={() => dialog.current?.close()}
            className="mt-5 inline-flex min-h-11 items-center rounded-full border border-moss/40 px-6 font-medium text-forest transition-colors hover:bg-moss/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-moss"
          >
            Close
          </button>
        </div>
      </dialog>
    </div>
  );
}
