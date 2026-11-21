// A tiny hand-off between a page's own media (the AURELLE commercial) and the garden's background music,
// so the two never play over each other. A page announces when its media starts or stops making sound; the
// music (components/GardenMusic.tsx) fades out and pauses, then — only if the visitor still has it on —
// resumes from the same place. The visitor's music setting itself is never changed by this.

export const MEDIA_EVENT = "garden-media";

/** Tell the background music that some media on the page is (or is no longer) playing with sound. */
export function announceMedia(audible: boolean) {
  window.dispatchEvent(new CustomEvent(MEDIA_EVENT, { detail: { audible } }));
}
