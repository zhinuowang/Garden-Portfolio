import type { CsImage, FullCaseStudy } from "./types";

// Little Moments — a self-initiated Vibe Coding project, built through
// AI-assisted development with Claude Code and ChatGPT. The Overview is
// Zhinuo's own text, and so are "From Inspiration to Action", the three Vibe
// Coding subsections and the Reflection (supplied 2026-11-06, verbatim). The
// opening Core Experience paragraphs describe her screenshot, and "Inside the
// App" describes only what was confirmed in the live app on 2026-11-06 (as a
// guest, without saving anything). The Time comes from the little-moments
// repository's commit history (21–27 October 2026).

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
    { label: "Time", value: "2026.10" }, // the little-moments repo's commits run 21–27 October 2026
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
        { type: "h3", text: "From Inspiration to Action" },
        { type: "p", text: "The experience is designed around a simple idea: finding something enjoyable to do should feel exciting rather than overwhelming." },
        { type: "p", text: "Instead of presenting users with an endless list of activities, Little Moments introduces a playful way to discover possibilities. Users can explore ideas through themed categories such as “Slow down,” “Go outside,” “Try something new,” and “Stay cozy,” depending on the kind of experience they are looking for." },
        { type: "p", text: "At the center of the experience is the “Draw a little idea” interaction. Inspired by a capsule or claw machine, it transforms an ordinary selection process into a moment of anticipation and surprise." },
        { type: "p", text: "A small cat companion adds personality to the experience, while the option to skip the animation gives users a more direct route to the result." },
        { type: "p", text: "By combining themed browsing with an interactive drawing mechanism, Little Moments aims to make choosing an activity feel less like another decision to make and more like a small moment of discovery." },
        { type: "h3", text: "Inside the App" },
        { type: "p", text: "The home screen leads into the draw in three gentle steps — Feeling, Choose, Draw. Momo, the cat, first asks how you are feeling (a step that can be skipped), then what you would like to do: slow down, go outside, try something new, stay cozy, just rest, or write today’s page." },
        { type: "p", text: "Once an idea is drawn, it appears as a card with its category, a short description, and how long it takes, where it happens and what it costs. From there you can see how it goes, choose “Let’s do it”, try another, or save it for later. The rest of the drawn handful is listed below, with the option to draw again or to take a new handful without the animation." },
      ],
    },
    {
      id: "vibe-coding",
      heading: "Vibe Coding Process",
      blocks: [
        { type: "h3", n: 1, text: "From a Personal Observation to a Product Concept" },
        { type: "p", text: "Little Moments began with a small frustration from my everyday life: I often wanted to go out and make the most of my weekends, but I didn't always know what to do." },
        { type: "p", text: "Rather than approaching this as a traditional activity-planning problem, I wanted to explore a more playful and approachable way of discovering ideas." },
        { type: "p", text: "The product concept gradually developed around three priorities: keeping the experience simple, offering different kinds of activities, and making the discovery process itself enjoyable." },
        { type: "p", text: "The resulting interface brings these ideas together through themed activity categories, a capsule-machine-inspired interaction, and a gentle visual personality." },
        { type: "h3", n: 2, text: "Exploring AI-Assisted Product Development" },
        { type: "p", text: "Little Moments is a personal Vibe Coding project developed with the assistance of Claude Code and ChatGPT." },
        { type: "p", text: "I used AI-assisted development as a way to explore how a product idea could be translated into a working interactive experience." },
        { type: "p", text: "The project also gave me an opportunity to think beyond static screens and consider how interface design, interaction behavior, visual details, and implementation fit together." },
        { type: "p", text: "For me, Vibe Coding was not simply about generating code. It was an opportunity to explore a different workflow for bringing a personal design concept to life." },
        { type: "h3", n: 3, text: "Designing Through Iteration" },
        { type: "p", text: "An important part of this project was treating the application as an evolving experience rather than a single finished design." },
        { type: "p", text: "The process highlighted the relationship between how a feature looks, how it behaves, and how users understand it." },
        { type: "p", text: "The capsule-machine interaction is a useful example of this relationship: its visual design creates a playful atmosphere, while the interaction needs to remain understandable and accessible." },
        { type: "p", text: "The project encouraged me to consider the balance between visual personality and functional clarity." },
        { type: "p", text: "It also reinforced the importance of reviewing an interactive product as a complete experience, rather than evaluating individual screens in isolation." },
      ],
    },
    {
      id: "reflection",
      heading: "Reflection",
      blocks: [
        { type: "h3", text: "What I Learned" },
        { type: "p", text: "Little Moments showed me how a small personal observation can become the starting point for a digital product." },
        { type: "p", text: "What began as a simple question about how to spend my weekends gradually evolved into an exploration of activity discovery, interaction design, and AI-assisted development." },
        { type: "p", text: "One of the most valuable lessons from the project was the importance of making everyday digital experiences feel approachable and enjoyable." },
        { type: "p", text: "A product does not always need to address a complex problem to create value. Sometimes, thoughtful design can help reduce small moments of hesitation and make ordinary decisions feel a little easier." },
        { type: "p", text: "The project also expanded my perspective on the relationship between design and implementation. Working with Claude Code and ChatGPT allowed me to explore how AI-assisted development can support the creation of interactive experiences." },
        { type: "h3", text: "Looking Forward" },
        { type: "p", text: "If I continue developing Little Moments, I would like to explore how activity suggestions could become more relevant to different users and situations." },
        { type: "p", text: "Potential directions include:" },
        {
          type: "bullets",
          items: [
            "More personalized activity discovery",
            "Better ways to filter ideas based on available time and preferences",
            "Additional interactions that make the experience more engaging",
            "Usability testing to understand how people navigate and interpret the app",
            "Refining the balance between playful animation and efficient interaction",
          ],
        },
      ],
    },
  ],
};
