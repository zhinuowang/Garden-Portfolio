// AURELLE — a personal AI-generated skincare serum commercial by Zhinuo.
// Every field here comes from what Zhinuo supplied (2026-11-20): the finished film
// (Desktop/AURELLE AD.mp4) and the project name, subtitle, category, discipline and
// one-sentence overview in her brief. Nothing else is known yet, so nothing else is shown.
//
// THE FILM: public/video/aurelle-commercial.mp4 is the original master remuxed without
// re-encoding (AVFoundation passthrough, "optimise for network use"): the H.264 / AAC
// streams are byte-for-byte the master's; only the MP4 index moved to the front, so a
// browser can start playing before the whole file arrives. 1920 × 1080, 0:59.9, 85.2 MB,
// H.264 High@4.0 ~11.2 Mbps, AAC stereo ~187 kbps. The master itself stays untouched.
// THE POSTER: a real frame of the film (59.0 s, the closing product shot), not a new image.

export type AurelleProcessSection = {
  id: "concept" | "visual-direction" | "storyboard" | "keyframes" | "consistency" | "image-to-video" | "editing";
  heading: string;
  /** Paragraphs in Zhinuo's words. */
  body: string[];
  /** Only real project files Zhinuo supplies (frames, boards, screenshots). */
  images?: { src: string; alt: string; width: number; height: number; source: string }[];
};

export const aurelle = {
  slug: "aurelle",
  title: "AURELLE",
  subtitle: "AI Skincare Commercial",
  discipline: "AI Creative Production",
  video: {
    src: "/video/aurelle-commercial.mp4",
    type: 'video/mp4; codecs="avc1.640028, mp4a.40.2"',
    width: 1920,
    height: 1080,
    poster: { src: "/video/aurelle-poster-1920.webp", small: "/video/aurelle-poster-1280.webp" },
    source: "Desktop/AURELLE AD.mp4",
  },
  overview:
    "AURELLE is a personal AI-generated skincare serum commercial exploring the use of generative AI in beauty advertising and visual storytelling.",
  /**
   * The creative process, in order. Each section appears on the page only once it is added
   * here with Zhinuo's own text and files; until then the page shows the film and overview only.
   * Planned: concept, visual direction, storyboard and shot planning, AI-generated keyframes,
   * character and product consistency, image-to-video production, editing and the final cut.
   */
  process: [] as AurelleProcessSection[],
};
