import type { CsImage, FullCaseStudy } from "./types";

// Little Moments — a self-initiated Vibe Coding project, built through
// AI-assisted development with Claude Code and ChatGPT. The Overview is
// Zhinuo's own text. The Core Experience describes only what her supplied
// screenshot shows. Anything not yet supplied (the timeline, her workflow,
// her reflection) is a visible placeholder, never invented.

const DIR = "/assets/projects/little-moments";
const img = (file: string, width: number, height: number, alt: string, source: string): CsImage => ({ src: `${DIR}/${file}`, width, height, alt, source });

const screenshot = img(
  "draw-a-little-idea.png",
  1152,
  1580,
  "Little Moments screenshot: the heading “Little ideas — Small, gentle things to do with your time.”, category tabs Everything, Slow down, Go outside, Try something new and Stay cozy, a Filters button, and a black-and-white capsule machine with a claw over a pile of capsules. A small cat beside it holds a heart sign and says “Ready? I’ve been practising.” Below: “42 ideas inside”, a “Draw a little idea” button and “Skip the animation”.",
  "Screenshot supplied by Zhinuo in chat (2026-11-05)",
);

export const littleMoments: FullCaseStudy = {
  source: "Zhinuo's own project description and screenshot, supplied in chat on 2026-11-05",
  subtitle: "A playful app for discovering little things to do.",
  facts: [
    { label: "Type", value: "Vibe Coding / Product Design" },
    { label: "Time", value: "To be added", pending: true },
    { label: "Tool", value: "Claude Code, ChatGPT" },
  ],
  sections: [
    {
      id: "overview",
      heading: "Overview",
      blocks: [
        {
          type: "aside",
          image: screenshot,
          blocks: [
            { type: "p", text: "Little Moments began with a simple personal frustration: I often wanted to go out and make the most of my weekends, but didn't always know what to do. This inspired me to explore how a digital experience could turn everyday indecision into small, approachable activity ideas." },
            { type: "p", text: "The project evolved into a playful activity-discovery app where users can explore ideas through themed categories and a “Draw a little idea” interaction. Rather than overwhelming users with too many choices, Little Moments offers a gentle and engaging way to discover something to do." },
            { type: "p", text: "As a self-initiated Vibe Coding project, Little Moments also allowed me to explore how AI-assisted development tools such as Claude Code and ChatGPT can support the process of turning a personal product concept into an interactive digital experience." },
            { type: "link", href: "https://little-moments-eta.vercel.app/", label: "Try the Live App ↗" },
          ],
        },
      ],
    },
    {
      id: "core-experience",
      heading: "Core Experience",
      blocks: [
        { type: "p", text: "The “Little ideas” screen, shown above, gathers the app’s activity ideas under the line “Small, gentle things to do with your time.” Ideas can be browsed by theme — Everything, Slow down, Go outside, Try something new and Stay cozy — and narrowed further with Filters." },
        { type: "p", text: "Instead of a list, the ideas sit inside a capsule machine, and a “Draw a little idea” button draws one out. A small cat companion keeps the visitor company (“Ready? I’ve been practising.”), and “Skip the animation” is there for anyone who would rather go straight to the result." },
        { type: "placeholder", text: "Describe what happens after an idea is drawn, and any other parts of the app you want to show (with screenshots)." },
      ],
    },
    {
      id: "vibe-coding",
      heading: "Vibe Coding Process",
      blocks: [
        { type: "p", text: "Little Moments is a Vibe Coding project: it was built through AI-assisted development, with Claude Code and ChatGPT as the tools that helped turn the original idea into a working, interactive app. The idea itself came from my own experience, and the product and design decisions were mine; the AI tools supported the implementation." },
        { type: "placeholder", text: "What I designed myself: the concept, the categories, the capsule-machine interaction, the visual style…" },
        { type: "placeholder", text: "How I worked with Claude Code and ChatGPT: what I asked them for, and how I described what I wanted." },
        { type: "placeholder", text: "How I evaluated, tested and refined what they produced, with an example of a decision I changed along the way." },
      ],
    },
    {
      id: "reflection",
      heading: "Reflection",
      blocks: [{ type: "placeholder", text: "What I learned from building Little Moments, and what I would explore next." }],
    },
  ],
};
