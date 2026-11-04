// Site-wide copy and verified personal details.
// Sources: 个人作品集.pdf (pages 1–2) and Desktop/Resume.pdf (copied to public/resume/).

export const site = {
  name: "A Garden of Ideas",
  designer: "Zhinuo Wang",
  descriptor: "UX/UI & Product Design Portfolio",
  title: "A Garden of Ideas | Zhinuo Wang — Design Portfolio",
  description:
    "Explore the UX/UI and product design portfolio of Zhinuo Wang, where personal explorations and academic projects grow together in an interactive illustrated garden.",
};

// Landing copy: three scenes down one tall painting. Provisional — edit freely here.
export const landingScenes = {
  // Scene 1 — the only hero text
  title: "A Garden of Ideas",
  // Scene 2 — my thoughts
  thoughts: [
    "Every idea starts as a little seed.",
    "I find inspiration in the little things.",
    "Design is how I turn observations into experiences.",
  ],
  // Scene 3 — enter my work
  invitation: "Come see what I've been growing.",
  cta: "Explore My Work",
};

export const about = {
  intro: "I am a designer interested in creating thoughtful and intuitive experiences.",
  // Translated from the statement on page 1 of 个人作品集.pdf — pending owner review.
  statement: [
    "To me, design is about building an order people can understand in a complicated world. I care not only about interfaces and features, but about how people feel while using them — whether it's clear, reassuring, and free of unnecessary effort.",
    "Studying abroad made me more sensitive to cultural differences and ways of expressing things, and taught me to think about the relationship between people and products in different contexts. Through design, I hope to make experiences feel more natural, trustworthy, and close to real life.",
  ],
  education: [
    {
      school: "University of Toronto",
      degree: "Master of Information — User Experience Design",
      dates: "September 2025 – Present",
    },
    {
      school: "University of Toronto",
      degree: "Bachelor of Arts — Double Major in Economics and Communication, Information and Technology",
      dates: "September 2021 – June 2025",
    },
  ],
  // Bullets copied from Resume.pdf.
  experience: [
    {
      role: "Visual Design Intern",
      company: "ICkey Internet and Technology Co., Ltd.",
      place: "Shanghai, China",
      dates: "April 2026 – July 2026",
      bullets: [
        "Designed promotional posters and campaign visuals for mobile and desktop platforms using Adobe Photoshop and Adobe Illustrator, supporting marketing and branding initiatives.",
        "Assisted in website page design using Figma and independently created web UI components, including pop-ups, floating widgets, banners, and promotional modules.",
        "Utilized AI design tools such as GPT Image-2, Seedance, and Lovart to accelerate content production and improve design workflow efficiency.",
      ],
    },
    {
      role: "Product Design Intern",
      company: "ChuZhou Bettyma Baby Carrier Co., Ltd.",
      place: "ChuZhou, China",
      dates: "June 2024 – August 2024",
      bullets: [
        "Supported the design and illustration of baby carrier products using Adobe Photoshop, offering creative ideas and artwork to elevate product appeal.",
        "Produced graphics and visual content for marketing materials, boosting brand visibility and promotional efforts.",
        "Partnered with the design team to conceptualize and execute innovative ideas for new products and campaigns.",
      ],
    },
  ],
  skills: {
    software: ["Adobe InDesign", "Adobe Illustrator", "Adobe Photoshop", "Adobe Premiere", "Figma", "MS Office"],
    professional: [
      "Content creation",
      "Market Analysis",
      "Business Intelligence",
      "Business Analysis and Visualization",
      "User Experience Analysis",
      "Customer Portrait Analysis",
      "Video Editing",
    ],
    interpersonal: ["Leadership in small to medium-scale projects", "Teamwork", "Time Management"],
  },
  resume: { href: "/resume/Zhinuo-Wang-Resume.pdf", source: "Desktop/Resume.pdf" },
  portrait: {
    src: "/assets/about/portrait.jpg",
    alt: "Zhinuo Wang standing at a ship's railing by the sea, wearing a soft camel coat.",
    width: 960,
    height: 1282,
    source: "Desktop/Portofolio/Photo.jpg",
  },
};

export const contact = {
  email: "zhinuowang0601@gmail.com",
  // Listed on Resume.pdf. This is the previous portfolio, so remove it if it shouldn't be public.
  links: [{ label: "Previous portfolio (Adobe Portfolio)", href: "https://wangzhinuo601.myportfolio.com" }],
};
