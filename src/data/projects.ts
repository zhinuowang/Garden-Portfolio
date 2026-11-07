// Project data. Every field here must be grounded in material Zhinuo supplied.
// Anything not yet supplied stays `null` and renders as a visible placeholder —
// never fill a gap with invented content. Sources are listed per project in
// `sourceAssetReferences` and in docs/ASSET-MANIFEST.md.

export type ProjectCategory = "personal" | "academic";
export type GardenRegionId = "creative-corner" | "growing-grounds";
export type GardenLocationId =
  | "greenhouse"
  | "cottage"
  | "puppy-corner"
  | "fountain"
  | "windmill";

export type ProjectImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Original supplied file this image was exported from. */
  source: string;
};

export type CaseStudySection = {
  id: string;
  heading: string;
  /** Paragraphs translated from the supplied portfolio. Pending owner review. */
  body: string[];
  bullets?: string[];
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  category: ProjectCategory;
  gardenRegion: GardenRegionId;
  gardenLocation: GardenLocationId;
  locationName: string;
  /** One-line project type as stated in the source portfolio. */
  discipline: string | null;
  shortDescription: string | null;
  role: string | null;
  collaboration: string | null;
  courseContext: string | null;
  projectDate: string | null;
  tools: string[] | null;
  heroImage: ProjectImage | null;
  gallery: ProjectImage[];
  caseStudySections: CaseStudySection[];
  sourceAssetReferences: string[];
  /** Notes for the owner on what still needs confirming. Not shown publicly. */
  openQuestions: string[];
};

export const projects: Project[] = [
  {
    id: "little-moments",
    slug: "little-moments",
    title: "Little Moments",
    category: "personal",
    gardenRegion: "creative-corner",
    gardenLocation: "windmill",
    locationName: "The Windmill",
    discipline: "Vibe Coding / Product Design",
    shortDescription: "A playful app for discovering little things to do, built as a self-initiated Vibe Coding project with Claude Code and ChatGPT.",
    role: null,
    collaboration: null,
    courseContext: null,
    projectDate: "Oct 2026",
    tools: ["Claude Code", "ChatGPT"],
    heroImage: {
      src: "/assets/projects/little-moments/draw-a-little-idea.png",
      alt: "Little Moments: the “Little ideas” screen with category tabs, a capsule machine, a small cat and a “Draw a little idea” button.",
      width: 1152,
      height: 1580,
      source: "Screenshot supplied by Zhinuo in chat (2026-11-05)",
    },
    gallery: [],
    // The page is the full case study in src/data/case-studies/little-moments.ts.
    caseStudySections: [],
    sourceAssetReferences: ["Overview text, metadata and screenshot supplied by Zhinuo in chat (2026-11-05)", "Live app: https://little-moments-eta.vercel.app/"],
    openQuestions: [
      "Case study copy complete (supplied 2026-11-06). Screenshots of the result card or other screens could be added.",
    ],
  },
  {
    id: "nomi-pudding",
    slug: "nomi-and-pudding",
    title: "Nomi & Pudding",
    category: "personal",
    gardenRegion: "creative-corner",
    gardenLocation: "cottage",
    locationName: "The Little Cottage",
    discipline: "Character IP design · AIGC design",
    shortDescription:
      "An original character IP — Nomi and her cat, Pudding — developed into a character profile, three-view turnaround, sticker set, pose and outfit extensions.",
    role: null,
    collaboration: null,
    courseContext: null,
    projectDate: "2026",
    tools: null,
    heroImage: {
      src: "/assets/projects/nomi-pudding/cover.jpg",
      alt: "Nomi and Pudding cover: the character Nomi waving beside her orange cat Pudding on a yellow gingham background.",
      width: 1600,
      height: 900,
      source: "Desktop/Portofolio/Page 1.png",
    },
    gallery: [],
    caseStudySections: [],
    sourceAssetReferences: [
      "Desktop/Portofolio/Page 1.png",
      "Desktop/Portofolio/个人作品集.pdf (page 3)",
    ],
    openQuestions: [
      "Confirm role wording and which tools/AI models were used.",
      "Confirm the English IP story text before it goes on the case study.",
    ],
  },
  {
    id: "dog-nutrition",
    slug: "dog-nutrition-tracker",
    title: "Dog Nutrition Tracker",
    category: "academic",
    gardenRegion: "growing-grounds",
    gardenLocation: "puppy-corner",
    locationName: "The Puppy Corner",
    discipline: "UX design · mobile app concept",
    shortDescription:
      "A user-centred mobile app concept for dog feeding: visual nutrition progress, quick meal and treat logging, and shared records so multiple caregivers don't double-feed.",
    role:
      "Wireframes and interactive prototypes in Figma, user interviews and usability testing; individually refined the final screens after the second test round.",
    collaboration: "Team project",
    courseContext: "User Experience (UX) Design Studio — Toronto",
    projectDate: "Sep – Dec 2025",
    tools: ["Figma"],
    heroImage: {
      src: "/assets/projects/dog-nutrition/cover.jpg",
      alt: "Five phone mockups of the Dog Nutrition Tracker app showing profile setup, Today's Progress donut chart, and Today's Log screens in warm orange.",
      width: 1600,
      height: 1179,
      source: "Desktop/Portofolio/软件封面.JPG",
    },
    gallery: [],
    // The page is the full case study in src/data/case-studies/ (from the PDF below).
    caseStudySections: [],
    sourceAssetReferences: ["Desktop/Wang Nora - Dog Nutrition Tracking App.pdf (the case study source)", "Desktop/Portofolio (original image files)"],
    openQuestions: ["Team size.", "Should the app's name, FEEDO (from the resume), appear on the site?"],
  },
  {
    id: "eliminate-bacteria-pro",
    slug: "eliminate-bacteria-pro",
    title: "Eliminate Bacteria Pro",
    category: "academic",
    gardenRegion: "growing-grounds",
    gardenLocation: "fountain",
    locationName: "The Bubble Fountain",
    discipline: "Concept product design",
    shortDescription:
      "A concept that pairs a children's electric toothbrush with VR glasses, turning brushing into a game: grey “bacteria” on a live view of the teeth turn green once each spot is brushed.",
    role: "Led the product concept and design; designed the logo and promotional materials; proposed the marketing approach for children and parents.",
    collaboration: null,
    courseContext: "Design Thinking II — Mississauga",
    projectDate: "Dec 2023 – Apr 2024",
    tools: ["Adobe InDesign", "Adobe Illustrator"],
    heroImage: {
      src: "/assets/projects/eliminate-bacteria-pro/cover.jpg",
      alt: "Eliminate Bacteria Pro cover: a pink and blue toothbrush with three labels — gamified toothbrushing, real-time teeth view in VR, guided brushing zones.",
      width: 970,
      height: 600,
      source: "Desktop/Portofolio/COVER PAGE.png",
    },
    gallery: [],
    // The page is the full case study in src/data/case-studies/ (from the PDF below).
    caseStudySections: [],
    sourceAssetReferences: ["Desktop/Wang Nora - Eliminate Bacteria Pro.pdf (the case study source)", "Desktop/Portofolio (original image files)"],
    openQuestions: [
      "Individual or team work? The resume says you collaborated on brand development.",
      "The 3D toothbrush render: confirm how it was produced so it can be credited correctly.",
    ],
  },
  {
    id: "dyson-brochure",
    slug: "dyson-interactive-brochure",
    title: "Dyson Interactive Brochure",
    category: "academic",
    gardenRegion: "growing-grounds",
    gardenLocation: "windmill",
    locationName: "The Windmill",
    discipline: "Interaction design",
    shortDescription:
      "An interactive digital brochure for the Dyson Supersonic hair dryer — colour switching, accessory hover details and video, in a minimal black-and-white layout with Dyson's purple accents.",
    role: "Designed the brochure's structure, visual style and interactions in Adobe InDesign: colour hover states, detail buttons, a Z-pattern layout and an accessible table of contents.",
    collaboration: null,
    courseContext: "Design and Implementation of Multimedia Documents — Mississauga",
    projectDate: "Dec 2023 – Apr 2024",
    tools: ["Adobe InDesign"],
    heroImage: {
      src: "/assets/projects/dyson-brochure/cover.jpg",
      alt: "Dyson brochure cover page: Dyson Supersonic Hair Dryer title, the accessories and storage case on the left, the pink dryer on the right, with a video play button.",
      width: 1600,
      height: 900,
      source: "Desktop/Portofolio/Dyson cover.png",
    },
    gallery: [],
    caseStudySections: [
      {
        id: "overview",
        heading: "Overview",
        body: [
          "An interactive digital brochure for the Dyson Supersonic hair dryer that combines product information, visuals and interaction in a web-like format, aimed at young, higher-spending customers and people who care about hair health.",
          "The brochure moves through a home page, contents page, colour showcase, accessories, product range comparison, and a video and contact page.",
        ],
      },
      {
        id: "interaction",
        heading: "Interaction design",
        body: ["Hover and button feedback turn a traditional brochure into something to explore:"],
        bullets: [
          "Hovering a colour swatch changes the dryer's colour in real time.",
          "Hovering an accessory shows its function and an example image.",
          "The “See Details” button changes colour on click as immediate feedback.",
        ],
      },
    ],
    sourceAssetReferences: [
      "Desktop/Portofolio/Dyson cover.png",
      "Desktop/Portofolio/Dyson .MOV",
      "Desktop/Portofolio/个人作品集.pdf (page 6)",
      "Desktop/Portofolio/Nora Wang - 戴森吹风机宣传手册 - 交互设计.pdf",
    ],
    openQuestions: [
      "Individual or team work?",
      "Product photography in the brochure is Dyson's — confirm how you'd like it credited.",
    ],
  },
];

export const regions: Record<
  GardenRegionId,
  { name: string; subtitle: string; blurb: string }
> = {
  "creative-corner": {
    name: "The Creative Corner",
    subtitle: "Personal Projects",
    blurb: "Self-initiated ideas that grew from my own interests.",
  },
  "growing-grounds": {
    name: "The Growing Grounds",
    subtitle: "Academic Projects",
    blurb: "Research, coursework and experiments in method.",
  },
};

export const selectedWorkSlugs = ["little-moments", "dog-nutrition-tracker"];

/** The projects shown on the Work page for now, in the order the garden presents them. */
export const workSlugs = ["dog-nutrition-tracker", "eliminate-bacteria-pro", "little-moments"];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export function projectsInRegion(region: GardenRegionId) {
  return projects.filter((p) => p.gardenRegion === region);
}

/** The next project to suggest: the following Work-page project (other pages lead back into that set). */
export function nextProject(slug: string) {
  const i = workSlugs.indexOf(slug);
  return getProject(workSlugs[(i + 1) % workSlugs.length])!;
}
