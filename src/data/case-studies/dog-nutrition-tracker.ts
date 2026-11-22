import type { CsImage, FullCaseStudy } from "./types";

// Dog Nutrition Tracking App, reproduced from Desktop/Wang Nora - Dog Nutrition Tracking App.pdf
// (the only source for this page). Text is verbatim, with the PDF's wrapped lines
// joined. Images are the original files from Desktop/Portofolio: the hero and the
// two research charts matched pixel for pixel against the PDF, the rest matched to
// the PDF's (blank) image slots by position and exact proportions.

const DIR = "/assets/projects/dog-nutrition";
// images whose own background is transparent: they sit straight on the page
const BARE = new Set(["hero.png"]);
const img = (file: string, width: number, height: number, alt: string, source: string): CsImage => ({ src: `${DIR}/${file}`, width, height, alt, source: `Desktop/Portofolio/${source}`, bare: BARE.has(file) });

export const dogNutritionTracker: FullCaseStudy = {
  source: "Desktop/Wang Nora - Dog Nutrition Tracking App.pdf",
  subtitle: "A user-centric dog food tracking app",
  facts: [
    { label: "Type", value: "UX Design" },
    { label: "Time", value: "2025.09 - 2025.12" },
    { label: "Tool", value: "Figma" },
  ],
  sections: [
    {
      id: "overview",
      heading: "Overview",
      blocks: [
        {
          type: "aside",
          image: img("hero.png", 2403, 2406, "Two phone mockups of the app in warm orange and cream: Today's Progress with a donut chart and predicted nutrition bars, and Today's Log with an Add Food form.", "mockup.png"),
          blocks: [
            { type: "p", text: "This project focuses on the lack of systematic management and nutritional insights in daily dog feeding. Most existing apps primarily support simple logging, while overlooking treat calories, portion accuracy, and coordination among multiple caregivers, which can easily lead to duplicate feeding and nutritional imbalance. To address the needs of multi-caregiver households, high-frequency trainers, and owners who feel uncertain about portion control, this project proposes a mobile app concept centered on visualizing nutritional progress and synchronizing feeding records across caregivers. Through a consistent and simple logging system, clear data feedback, and goal-setting support, the design reduces user burden and helps owners manage their dogs’ diets in a more scientific, sustainable, and collaborative way." },
          ],
        },
      ],
    },
    {
      id: "research",
      heading: "Study and Research",
      blocks: [
        { type: "h3", n: 1, text: "Secondary Research" },
        { type: "p", text: "Through an analysis of existing pet feeding apps and relevant academic research, we found that most products only support basic event logging and lack key features such as portion guidance, visual representation of treat calories, and multi-caregiver collaboration mechanisms. Additionally, research indicates that treats are often given frequently as emotional rewards, making them the most easily overlooked source of “hidden calories.” This further exacerbates the uncertainty of feeding management and poses long-term health risks." },
        { type: "h3", n: 2, text: "Primary Research" },
        {
          type: "aside",
          image: img("primary-research-feeding-schedule.png", 1121, 387, "Interview chart “Will the feeding schedule be adjusted?”: a donut split 50% will be adjusted and 50% will not be adjusted, beside the main reasons for adjusting: 50% growth stage, 25% health reasons, 25% behavioral observation.", "未命名的设计.png"),
          blocks: [
            { type: "p", text: "Through interviews with dog owners, we identified several distinct behavioral patterns:" },
            {
              type: "bullets",
              items: [
                "Snack intake is often not recorded;",
                "Feeding decisions are based more on intuition than on structured management;",
                "Multiple caregivers often lead to double-feeding;",
                "Many first-time owners lack a clear understanding of appropriate portion sizes.",
              ],
            },
          ],
        },
        { type: "figure", size: "lg", image: img("primary-research-behavioral-strategies.png", 1892, 438, "Behavioral Strategies chart: three cards — pre-portioned snacks, take notes, and fridge notes or sending a message — each with the number of people and a purpose.", "RESEARCH 2.png") },
      ],
    },
    {
      id: "persona",
      heading: "Persona",
      blocks: [{ type: "figure", size: "md", image: img("persona.png", 948, 1068, "Two persona sheets, Owner-007 and Owner-004, each with a portrait and the persona’s notes.", "Personas.png") }],
    },
    {
      id: "journey",
      heading: "User Journey Map",
      blocks: [{ type: "figure", size: "md", image: img("user-journey-map.png", 942, 1196, "User journey maps for Owner-004 and Owner-007, each a table of stages with an emotion curve.", "User Journey Map.png") }],
    },
    {
      id: "storyboard",
      heading: "Story Board",
      blocks: [{ type: "figure", size: "lg", image: img("storyboard.png", 1114, 692, "A six-panel sketched storyboard of a dog owner and the app.", "Storyboard.png") }],
    },
    {
      id: "task-flow",
      heading: "User Task-Flow Diagram",
      blocks: [{ type: "figure", size: "md", image: img("user-task-flow.png", 948, 1380, "User task-flow diagram: a flowchart of steps and decision points.", "User Task-Flow Diagram.png") }],
    },
    {
      id: "initial-wireframes",
      heading: "Initial Wireframes",
      blocks: [
        { type: "p", text: "Before moving into high-fidelity visual design, we first used low-fidelity wireframes to organize the overall information architecture and core interaction logic. This stage focused on validating page layout, information hierarchy, and key user flows. It allowed us to quickly iterate on different structural approaches at a low cost and clarify what users need to see first and what actions they should prioritize on each screen." },
        { type: "p", text: "The initial wireframes were built around key usage scenarios, including:" },
        {
          type: "bullets",
          items: [
            "A unified dashboard that provides an at-a-glance overview of each pet’s daily status;",
            "Quick-access logging for meals and treats;",
            "A multi-caregiver coordination page designed to prevent duplicate feeding;",
            "Tracking and reminder modules that display daily intake progress and feeding schedules;",
            "Simple profile and settings pages that allow easy access to core functions.",
          ],
        },
        { type: "p", text: "The overall design emphasized clarity, intuitiveness, and low cognitive load." },
        { type: "figure", size: "lg", image: img("initial-wireframes.png", 1332, 1442, "The initial low-fidelity grey wireframes of the app’s screens, including a FEEDO start screen.", "Original Wireframe.png") },
      ],
    },
    {
      id: "prototype-testing",
      heading: "Interactive Prototype Design and Usability Testing",
      blocks: [
        { type: "p", text: "After completing the wireframes, we transformed them into an interactive prototype to simulate the full end-to-end user experience. The prototype included key workflows such as switching between pets on the dashboard, logging meals and treats, checking daily nutrition progress, setting reminders, and coordinating feeding among multiple caregivers. Building the prototype allowed us to evaluate how well these functions worked together and ensured that the system provided a coherent and consistent experience in realistic usage scenarios." },
        { type: "p", text: "Our first round of usability testing took place in class. Participants were asked to complete core tasks such as logging a meal and checking progress. Although the prototype was functionally usable, users showed clear confusion in several areas:" },
        {
          type: "bullets",
          items: [
            "The button structure on the Tracking page was unclear. Participants were unsure where to begin and how to use the logging features.",
            "The progress bar on the right side of the page lacked clear explanation, making it difficult for users to understand what the data represented.",
            "Some participants asked how to set a feeding goal, which revealed that the system did not yet include a dedicated interface for goal setting.",
          ],
        },
        { type: "p", text: "Based on this feedback, we simplified and reorganized several core screens:" },
        {
          type: "bullets",
          items: [
            "Redesigned the Tracking page to make the primary actions clearer;",
            "Improved the Progress view to make nutritional data easier to interpret;",
            "Added a dedicated Set Goal page to clarify the goal-setting process;",
            "Removed the Reminder feature to reduce system complexity and cognitive load.",
          ],
        },
        { type: "p", text: "After these changes, the discoverability of key features improved significantly, and the overall user flow became more intuitive and natural." },
        { type: "figure", size: "lg", image: img("wireframes-after-first-test.png", 1572, 680, "A row of revised low-fidelity wireframes.", "Wireframe changed.png") },
      ],
    },
    {
      id: "second-test",
      heading: "Second Round of Usability Testing",
      blocks: [
        { type: "p", text: "In the second round of testing, we invited dog owners outside the class and conducted remote usability sessions via Microsoft Teams. Participants were asked to complete two core tasks: logging a feeding entry and checking the updated progress indicators." },
        { type: "p", text: "This round of testing revealed several new insights. First, many users had difficulty locating the Tracking feature and often spent a significant amount of time searching for where to log a meal. Several participants suggested adding a more prominent logging button on the Dashboard to make the entry point easier to find. Second, some users did not clearly realize that their log had been successfully submitted, which led them to enter the same information multiple times. This indicated that the system’s feedback mechanism needed to be strengthened. On a positive note, most participants were able to clearly recognize the changes in the progress indicators, suggesting that the improvements made to the progress visualization in the previous iteration were effective." },
        { type: "p", text: "The second round of testing further highlighted key issues related to feature discoverability and action feedback, and clarified the priorities for subsequent design improvements. Based on these insights, I continued refining and restructuring the interface during the individual stage of the project." },
      ],
    },
    {
      id: "final-wireframes",
      heading: "Final Wireframe Design",
      blocks: [
        { type: "p", text: "The final interface integrates key insights from the second round of user testing and focuses on improving the discoverability, clarity, and efficiency of core actions. To address the navigation and feedback issues identified during testing, several refinements were implemented:" },
        {
          type: "bullets",
          items: [
            "A prominent Tracking shortcut was added to the Dashboard, allowing users to quickly locate the logging function and directly addressing one of the most common points of confusion identified in testing.",
            "A Success Toast notification now appears at the top of the screen after a log is submitted, clearly confirming that the entry has been recorded and preventing duplicate logging.",
            "The original two circular progress indicators were redesigned as donut charts, enabling users to quickly understand the proportion of meals and treats consumed each day and improving the clarity of data visualization.",
          ],
        },
        { type: "figure", size: "lg", image: img("final-wireframes.png", 1246, 890, "Final wireframes with changes outlined in red, including a “Food added to Today's Log” message and a donut-chart progress view.", "Revised Wireframe.png") },
      ],
    },
    {
      id: "final-ui",
      heading: "Final UI Design",
      blocks: [
        { type: "figure", size: "lg", image: img("final-ui.png", 1230, 1220, "The final app screens in warm orange and cream, arranged in a cluster.", "Final UI.png") },
        { type: "p", text: "The final outcome is an application design grounded in user research and refined through multiple rounds of iteration. The design streamlines the daily feeding logging process, makes nutritional progress easier to understand, and provides a smoother and clearer recording experience. The system also supports collaboration among multiple caregivers, helping prevent common issues such as duplicate feeding. From the Dashboard’s quick logging shortcut, to the donut-chart progress visualization, and the clear success feedback after each entry, every key feature was shaped through ongoing usability testing and validated by real user needs. Together, these design decisions resulted in a feeding management tool that is clear, intuitive, and trustworthy, offering dog owners more reliable and sustainable support for daily feeding routines." },
      ],
    },
  ],
};
