// Shape of a full case study reproduced from an original portfolio PDF.
// Text is the source's own words; images are original files from
// Desktop/Portofolio matched against the PDF (see docs/CASE-STUDY-SOURCE-MAP.md).

export type CsImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  source: string;
  /** The image's own background is transparent, so it sits on the page with no shadow. */
  bare?: boolean;
};

export type CsBlock =
  | { type: "p"; text: string; lead?: string }
  | { type: "h3"; text: string; n?: number }
  | { type: "bullets"; items: string[] }
  /** labelled entries, e.g. "01 Visualized Cleaning Feedback" + its explanation */
  | { type: "entries"; items: { label: string; title: string; text: string }[] }
  /** the two product components, shown with the emoji the source uses */
  | { type: "components"; items: { icon: string; name: string }[] }
  | { type: "figure"; image: CsImage; caption?: string; size?: "sm" | "md" | "lg" }
  /** a numbered step or feature: optional title, optional lead line, text, image below */
  | { type: "step"; n: number; title?: string; lead?: string; text: string; image: CsImage }
  /** text with an image beside it on wide screens (the source places them side by side) */
  | { type: "aside"; blocks: CsBlock[]; image: CsImage };

export type CsSection = { id: string; heading: string; blocks: CsBlock[] };

export type FullCaseStudy = {
  /** The PDF this page reproduces. */
  source: string;
  subtitle?: string;
  facts: { label: string; value: string }[];
  sections: CsSection[];
};
