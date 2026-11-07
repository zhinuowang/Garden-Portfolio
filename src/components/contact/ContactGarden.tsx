"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { contact } from "@/data/site";
import Mailbox from "@/components/garden/Mailbox";

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

// each method reads from its left edge, in line with the title above
const card =
  "contact-card group flex min-h-11 w-full flex-col items-start rounded-3xl pt-2 pb-3 text-left focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-moss";

export default function ContactGarden() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [note, setNote] = useState(false);
  // the thank-you note tucks itself away again after a few seconds
  useEffect(() => {
    if (!note) return;
    const t = window.setTimeout(() => setNote(false), 5000);
    return () => window.clearTimeout(t);
  }, [note]);

  return (
    <div className="nightable relative isolate flex min-h-[100svh] items-center overflow-x-clip px-4 pt-28 pb-20 sm:px-6">
      <div aria-hidden="true" className="journal-backdrop journal-backdrop--contact" />

      {/* one composition: a left-aligned block — the title and the three ways to reach me — and, on the
          right, the garden mailbox in its flowers as the page's visual anchor */}
      <section aria-labelledby="contact-title" className="garden-mist garden-mist--soft relative mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-12 lg:pr-[3vw] xl:pr-[4vw]">
        {/* the whole content group sits a little in from the left (≈5% of the window), leaving room to breathe
            before the mailbox */}
        <div className="lg:pb-6 lg:pl-[4vw] xl:pl-[5vw]">
          <h1 id="contact-title" className="font-serif text-[clamp(2.6rem,5.6vw,4.6rem)] leading-[1.04] font-medium text-ink">
            Let&rsquo;s stay in touch.
          </h1>

          <ul className="mt-10 grid max-w-2xl grid-cols-3 gap-3 sm:mt-12 sm:gap-10">
            <li style={{ ["--tilt" as string]: "-3deg" }}>
              <a href={`mailto:${contact.email}`} className={card}>
                <Icon kind="email" />
                <Label title="Email" sub={<><span className="xl:hidden">Send a note</span><span className="hidden whitespace-nowrap xl:inline">{contact.email}</span></>} />
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
        </div>

          {/* the Landing's mailbox, larger, in its own patch of flowers: it opens on hover; a click opens it
              and leaves a small thank-you note (this page is already where it leads) */}
          <div className="relative mr-2 ml-auto w-44 sm:w-56 lg:mr-0 lg:w-full">
            <button
              type="button"
              aria-expanded={note}
              aria-controls="mailbox-note"
              data-open={note}
              onClick={() => setNote((n) => !n)}
              className="mailbox-host contact-mailbox block w-full cursor-pointer rounded-3xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-moss"
            >
              <span className="sr-only">{note ? "Close the mailbox" : "Open the mailbox"}</span>
              <Mailbox garden />
            </button>
            <p id="mailbox-note" role="status" className={`mailbox-note ${note ? "mailbox-note--shown" : ""}`}>
              {note ? "Thanks for stopping by my garden!" : ""}
            </p>
          </div>
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
