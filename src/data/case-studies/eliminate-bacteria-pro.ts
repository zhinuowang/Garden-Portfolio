// Eliminate Bacteria Pro — the full case study, reproduced from Zhinuo's original
// English portfolio deck: Desktop/Portofolio/[wang2764].Y1-portfolio.[zhinuo].[wang].pdf,
// pages 36–63. Chapters follow the deck's tab order; headings and text are the
// deck's own words (only line breaks joined, and three misspellings in headings
// corrected: "Overivew", "Architcture", "Bussiness"). Images are the original
// files from Desktop/Portofolio where they exist, otherwise the image embedded in
// the PDF at its native resolution. See docs/EBP-SOURCE-MAP.md.
//
// Inline **double asterisks** mark the phrases the deck highlights in colour.

export type CsImage = { src: string; width: number; height: number; alt: string; source: string };

export type CsBlock =
  | { type: "p"; text: string }
  | { type: "bullets"; items: string[]; tone?: "accent" }
  | { type: "numbered"; items: { title: string; text?: string }[] }
  | { type: "figure"; image: CsImage; caption?: string; size?: "sm" | "md" | "lg" }
  | { type: "figures"; items: { image: CsImage; caption?: string }[] }
  | { type: "steps"; items: { text: string; image: CsImage }[] }
  | { type: "details"; items: { title: string; text: string; image: CsImage }[] }
  | { type: "cards"; items: { title: string; text: string }[] }
  | { type: "refs"; items: { text: string; url: string }[] }
  | { type: "missing"; text: string };

export type CsSection = { heading: string; blocks: CsBlock[] };
export type CsChapter = { id: string; tab: string; sections: CsSection[] };
export type FullCaseStudy = { subtitle: string; source: string; chapters: CsChapter[] };

const DIR = "/assets/projects/eliminate-bacteria-pro";
const PDF = "Desktop/Portofolio/[wang2764].Y1-portfolio.[zhinuo].[wang].pdf";
const img = (file: string, width: number, height: number, alt: string, source: string): CsImage => ({ src: `${DIR}/${file}`, width, height, alt, source });

export const eliminateBacteriaPro: FullCaseStudy = {
  subtitle: "VR-integrated toothbrush",
  source: `${PDF}, pages 36–63`,
  chapters: [
    {
      id: "project-overview",
      tab: "Project Overview",
      sections: [
        {
          heading: "What problems am I solving?",
          blocks: [
            { type: "p", text: "Many children view brushing their teeth as a tedious chore, often rushing through it and even developing cavities as a result." },
            { type: "p", text: "While parents want their children to brush thoroughly, they face challenges:" },
            { type: "bullets", items: ["It's difficult to monitor whether each brushing session is effective.", "Children lack self-management awareness."] },
            { type: "p", text: "Therefore, this project aims to **use technology combined with gamification to encourage children to proactively and joyfully complete oral hygiene routines**, rather than passively fulfilling a task." },
          ],
        },
        {
          heading: "Project Objectives",
          blocks: [
            { type: "p", text: "This project aims to:" },
            { type: "bullets", items: ["Make brushing fun", "Visualize cleaning coverage", "Build consistent brushing habits", "Reduce oral hygiene issues"] },
            { type: "p", text: "**The core concept is:** transforming brushing into a “bacteria-busting game” experience" },
          ],
        },
        {
          heading: "About the product",
          blocks: [
            { type: "p", text: "This project aims to make brushing both engaging and effective by combining VR technology with an electric toothbrush." },
            { type: "p", text: "When the child brushes their teeth while wearing the VR glasses, a real-time image of their teeth is displayed, with cute grey patterns appearing every 4 millimeters on the image. Only when the toothbrush stays on the pattern for 3 seconds will the pattern color change from grey to green." },
            { type: "p", text: "This transforms brushing into a playful “monster-elimination” game, encouraging children to brush more carefully while ensuring that no areas are missed." },
            { type: "figure", size: "sm", image: img("about-the-product.png", 1122, 1245, "Illustration of a pink bathroom sink and mirror, with the blue and pink toothbrush standing at the side and the bear-shaped VR glasses on the counter.", `${PDF}, page 39 (embedded image)`) },
          ],
        },
      ],
    },
    {
      id: "product-concept",
      tab: "Product Concept and Functional Design",
      sections: [
        {
          heading: "Product Form",
          blocks: [
            { type: "p", text: "This product consists of two components:" },
            { type: "numbered", items: [{ title: "VR Glasses" }, { title: "Electric Toothbrush" }] },
            { type: "p", text: "The electric toothbrush scans the mouth via its camera, while the VR glasses display real-time images of the teeth. Gray cartoon “bacteria” patterns appear on the tooth surfaces, and children must complete cleaning tasks by holding the toothbrush in place over these areas." },
          ],
        },
        {
          heading: "Interaction Mechanism — Gamified Cleaning Feedback",
          blocks: [
            { type: "bullets", items: ["Generate a grey “bacteria” pattern every 4mm;", "Hold the brush head in place for 3 seconds;", "Pattern turns green = Cleaning complete;", "Audio feedback;", "Real-time visualization of teeth."] },
            { type: "figure", size: "md", image: img("interaction-mechanism.png", 582, 271, "Pink gums with rows of teeth covered in small grey cartoon bacteria, framed by blue scanning corners.", "Desktop/Portofolio/5.png (lower part, cropped as shown on deck page 41)") },
          ],
        },
        {
          heading: "User Flow",
          blocks: [
            {
              type: "steps",
              items: [
                { text: "Press the button and hold the button on the VR glasses and toothbrush for 5 seconds at the same time to make a Bluetooth connection, and turn it off as well.", image: img("user-flow-1.png", 506, 406, "A finger pressing the button on the apple-shaped VR glasses and another on the toothbrush, with a 5 seconds clock and a link icon between them.", "Desktop/Portofolio/1.png") },
                { text: "Get the image: The VR glasses instruct the user to take a 360-degree photo of their mouth using the camera on the head of the toothbrush.", image: img("user-flow-2.png", 566, 624, "The brush head's camera, a 360-degree icon, and a scanned image of the teeth inside blue scanning corners.", "Desktop/Portofolio/2.png") },
                { text: "Choose a favorite pattern with the buttons on the toothbrush handle. (“Style Selection” will be displayed in the VR glasses, and the pattern will appear in the tooth image of the VR glasses.)", image: img("user-flow-3.png", 738, 598, "A Style Selection menu listing Bacteria, Lollipop, Hamburger, Orange, Cola, Dots and Fried chicken, beside a finger pressing the handle buttons.", "Desktop/Portofolio/3.png") },
                { text: "Lightly press the button, the electric toothbrush starts to vibrate.", image: img("user-flow-4.png", 328, 508, "A finger pressing the toothbrush button, with vibration lines around the brush head.", "Desktop/Portofolio/4.png") },
                { text: "Follow the image displayed by the VR glasses and place the brush head on the tooth position where the grey pattern is located and hold it for 3 seconds until the pattern turns green. (Place the brush head lightly on the teeth and clean by vibration.)", image: img("user-flow-5.png", 582, 516, "The brush held against the teeth with a 3 seconds clock, above the teeth image covered in grey bacteria patterns.", "Desktop/Portofolio/5.png") },
                { text: "Until all patterns turn green - cleaning is completed.", image: img("user-flow-6.png", 688, 391, "The teeth image with every pattern turned green and a large green check mark.", "Desktop/Portofolio/6.png") },
              ],
            },
          ],
        },
        {
          heading: "Product Detail Design",
          blocks: [
            {
              type: "details",
              items: [
                { title: "Camera embedded in the brush head", text: "At the start of using the product, the mouth is first scanned using the camera, which generates information about the structure of the teeth within the system. While brushing, the camera scans in real time where the head of the toothbrush passes over the teeth, helping the user to get a clearer view of where is being cleaned and where is not.", image: img("detail-camera.png", 324, 289, "Close-up of the blue brush head with a small camera among the bristles, linked to an enlarged camera module.", "Desktop/Portofolio/build-in camera.png") },
                { title: "Pattern style selection", text: "A function to change the pattern style has been added to prevent children from getting bored after many uses. When the pattern on the teeth changes, the child will feel new.", image: img("detail-pattern-selection.png", 296, 381, "The Style Selection menu: Bacteria, Lollipop, Hamburger, Orange, Cola, Dots, Fried chicken.", "Desktop/Portofolio/pattern selection.png") },
                { title: "Anti-dropout bumps", text: "The bumps on the handle increase friction with the hand and prevent the toothbrush from slipping out of the child’s hand when it gets covered in toothpaste foam.", image: img("detail-anti-dropout-bumps.png", 447, 515, "The pink handle with an enlarged view of its rounded bumps.", "Desktop/Portofolio/Anti-dropout bumps .png") },
                { title: "Speakers in the legs of the VR glasses", text: "The speakers implanted in the legs of the VR glasses emit a bubble sound effect every time a pattern changes from grey to green. Interacting with the user makes the whole process of using the product more interesting.", image: img("detail-speakers.png", 759, 624, "The bear-shaped VR glasses with an enlarged view of the speaker in the leg.", "Desktop/Portofolio/speaker.png") },
                { title: "Inductive charging", text: "There is no charging port on the toothbrush, so the user doesn’t need to worry about battery damage anymore. Even if the child makes the toothbrush wet, there is no need to worry about the safety hazard of electric shock.", image: img("detail-inductive-charging.png", 1217, 835, "A pale yellow charging pad with a battery charging icon and a USB cable.", "Desktop/Portofolio/Charger.png") },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "design-research",
      tab: "Design Research",
      sections: [
        {
          heading: "VR Technology",
          blocks: [
            { type: "p", text: "VR technology can track human motion through optical systems that use cameras and infrared light to detect and interpret the shape and position of objects (Preim, 2013). These cameras are typically fixed in place and rely on computer vision to determine precise object locations (William, 2007)." },
            { type: "p", text: "**In this product, the same optical tracking principle is applied: the infrared camera embedded in the toothbrush scans the user’s teeth to create an image and then continuously tracks the brush head’s movement in real time, allowing the system to identify which areas have been cleaned and which have not.**" },
            {
              type: "refs",
              items: [
                { text: "William R. Sherman. (2007, September 2). Interface to the virtual world - input. Understanding Virtual Reality.", url: "https://www.sciencedirect.com/science/article/pii/B9781558603530500045?via%3Dihub" },
                { text: "Preim, B. (2013, November 15). Image-guided surgery and augmented reality. Visual Computing for Medicine (Second Edition).", url: "https://www.sciencedirect.com/science/article/pii/B9780124158733000183" },
              ],
            },
          ],
        },
        {
          heading: "Vibration Frequency",
          blocks: [
            { type: "p", text: "Craig (2022) reviews several children’s electric toothbrushes and notes that models vibrating at around 21,000 times per minute receive particularly positive feedback. This frequency is considered effective for cleaning while still being gentle enough not to cause discomfort or harm to children’s teeth (Craig, 2022)." },
            { type: "refs", items: [{ text: "Craig, R. (2022, September 29). Best Electric Toothbrush for kids: My top 7 choices and a detailed guide. Oral Care Home.", url: "https://www.oralcarehome.com/best-electric-toothbrush-kids/" }] },
          ],
        },
        {
          heading: "Bristles material - Nylon",
          blocks: [
            { type: "p", text: "Soft-bristled toothbrushes are recommended for children because they are gentler on the teeth and gums while still effectively removing plaque and food debris. Nylon is the most commonly used material for these soft bristles, as it provides durability, resilience, safety, and good cleaning performance, along with water resistance and environmental benefits (JingSourcing, 2023)." },
            { type: "refs", items: [{ text: "Top 9 toothbrush bristle types: Materials explained. jingsourcing. (2023, August 2).", url: "https://jingsourcing.com/p/b46-tooth-brush-bristles-material/" }] },
          ],
        },
      ],
    },
    {
      id: "metadesign",
      tab: "Metadesign",
      sections: [
        {
          heading: "Metadesign-Tangible",
          blocks: [
            { type: "p", text: "**Logo and brand name**" },
            { type: "p", text: "The Logo I designed is a tooth holding a magnifying glass and wearing VR glasses. The name of my brand is “Eliminate Bacteria Pro”, which not only means that the product is effective in cleaning the mouth, but I also want children to think of using the product as playing a game of eliminating bacteria." },
            { type: "figure", size: "md", image: img("logo-annotated.png", 902, 364, "The Eliminate Bacteria Pro logo, a smiling tooth wearing VR glasses and holding a magnifying glass, annotated: VR Glasses; The magnifying glass represents the ability to “see” bacteria and check for omissions. This corresponds to the function of the product; Brand Name.", "Desktop/Portofolio/Logo.png") },
            { type: "p", text: "**Business card**" },
            { type: "p", text: "On the front of the business card is the product’s logo, along with a flat-laid tooth pattern as the background. On the reverse side, there will be multiple contact methods for customer convenience, such as telephone, email, website, address, etc." },
            {
              type: "figures",
              items: [
                { caption: "Front", image: img("business-card-front.png", 1051, 601, "Business card front: the logo on a pale blue background tiled with small teeth.", "Desktop/Portofolio/bussiness card front.png") },
                { caption: "Back", image: img("business-card-back.png", 1051, 601, "Business card back: the logo beside the brand name, the line “Specializing in children’s oral cleaning”, and website, phone, email and address lines.", "Desktop/Portofolio/Business card back.png") },
              ],
            },
          ],
        },
        {
          heading: "Metadesign-Intangible",
          blocks: [
            {
              type: "cards",
              items: [
                { title: "Staff’s personality", text: "The aim of the product is to enable every child to brush their teeth seriously, to enjoy the process of brushing, and to make the user feel that we care about their oral health. The tone of the staff should be natural and clear, soft and friendly, to make customers feel that they are taken seriously." },
                { title: "Brand image and attributes", text: "My brand image is Care About Children. Both the purpose of the product and every detail of the product design is centered on the children’s experience of using the product, in the hope that they will maximize the benefits of brushing their teeth." },
                { title: "Model of service", text: "Continuously follow up on customer feedback and make improvements based on their suggestions. Additionally, if the product is damaged within a year, we can arrange for a repair technician to fix it free of charge. We will do our best to increase user satisfaction and user stickiness." },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "experience-architecture",
      tab: "Experience Architecture",
      sections: [
        {
          heading: "Experiential Marketing",
          blocks: [
            { type: "p", text: "I designed an experiential marketing campaign in collaboration with shopping malls, where an interactive screen is installed for children to participate in a “Bacteria-Elimination Competition.” A lot of bacteria patterns will appear on the screen at the same time, when the finger points to the “bacteria”, “bacteria” will be eliminated into a grey gas. Children need to compete to see who can eliminate the most “bacteria” in one minute." },
            { type: "p", text: "Prize include:" },
            { type: "bullets", items: ["1st place: Free Eliminate Bacteria Pro", "2nd place: 60% discount coupon", "3rd place: $50 in cash"] },
            { type: "p", text: "**Objectives of the campaign:**" },
            { type: "bullets", tone: "accent", items: ["Allow children to experience the playful brushing concept", "Help parents better understand the product", "Increase brand exposure in high-traffic locations", "Observe real user behavior for design improvement"] },
            { type: "figure", size: "lg", image: img("experiential-marketing.png", 2196, 1217, "An interactive kiosk screen; an enlarged view shows cartoon bacteria scattered on the screen with a score counter reading Total: 2 and a timer at 00:58.", "Desktop/Portofolio/Experience Architecture.png") },
          ],
        },
      ],
    },
    {
      id: "design-value-impact",
      tab: "Design Value & Impact",
      sections: [
        {
          heading: "Key Design Value",
          blocks: [
            {
              type: "numbered",
              items: [
                { title: "Child-Centered Interaction", text: "Brushing teeth becomes a gamified experience that motivates children to participate actively." },
                { title: "Visualized Cleaning Feedback", text: "Real-time visualization reduces the chance of missing cleaning areas." },
                { title: "Emotionally Supportive Experience", text: "Friendly visuals and audio feedback create a positive atmosphere." },
                { title: "Holistic Brand Experience", text: "The design integrates product, branding, and experiential marketing." },
              ],
            },
            { type: "figure", size: "sm", image: img("key-design-value.png", 799, 778, "Illustration of three cheerful children holding colourful balloons.", `${PDF}, page 58 (vector illustration, rendered at 3×)`) },
          ],
        },
        {
          heading: "Expect Design Impact",
          blocks: [
            {
              type: "numbered",
              items: [
                { title: "Longer and more focused brushing time" },
                { title: "Reduced risk of tooth decay" },
                { title: "Development of healthy daily habits" },
                { title: "Increased parent–child engagement" },
                { title: "Stronger trust in the brand" },
              ],
            },
            { type: "figure", size: "sm", image: img("design-impact.png", 1600, 1200, "A gauge running from red through yellow to green, with the needle pointing high.", `${PDF}, page 59 (embedded image)`) },
          ],
        },
      ],
    },
    {
      id: "final-deliverables",
      tab: "Final Deliverables",
      sections: [
        {
          heading: "01 Product Overview",
          blocks: [{ type: "figure", size: "lg", image: img("deliverable-01-product-overview.png", 1438, 986, "Product overview: the bear-shaped VR glasses, the teeth image covered in bacteria patterns, and the pink and blue electric toothbrush.", `${PDF}, page 60 (embedded image)`) }],
        },
        {
          heading: "02 Product Details",
          blocks: [{ type: "figure", size: "lg", image: img("deliverable-02-product-details.png", 1588, 1224, "Pink “Specification of product” board describing the brush-head camera, anti-dropout bumps, speakers in the legs of the VR glasses, pattern style selection and inductive charging.", `${PDF}, page 60 (embedded image)`) }],
        },
        {
          heading: "03 User Journey",
          blocks: [{ type: "figure", size: "lg", image: img("deliverable-03-user-journey.png", 1584, 1226, "Pink board showing the six user-flow steps with their illustrations, from Bluetooth pairing to all patterns turning green.", `${PDF}, page 61 (embedded image)`) }],
        },
        {
          heading: "04 Brand Identity Design",
          blocks: [
            { type: "figure", size: "sm", image: img("deliverable-04-brand-logo.png", 775, 775, "The Eliminate Bacteria Pro logo: a smiling tooth wearing VR glasses and holding a magnifying glass, ringed by the brand name.", `${PDF}, page 61 (embedded image)`) },
            {
              type: "figures",
              items: [
                { image: img("business-card-front.png", 1051, 601, "Business card front with the logo on a tiled teeth pattern.", "Desktop/Portofolio/bussiness card front.png (same image as page 61)") },
                { image: img("business-card-back.png", 1051, 601, "Business card back with the brand name and contact lines.", "Desktop/Portofolio/Business card back.png (same image as page 61)") },
              ],
            },
          ],
        },
        {
          heading: "05 Commercial Video",
          blocks: [
            { type: "figure", size: "lg", image: img("deliverable-05-commercial-video.png", 2534, 1894, "Opening frame of the commercial video: “Still struggling with kids not wanting to brush their teeth”, with a red question mark and a worried little girl beside a toothbrush cup.", `${PDF}, page 62 (embedded image)`) },
            { type: "p", text: "The full commercial animation video is available via the Google Drive link provided." },
            { type: "missing", text: "Video link to be provided." },
          ],
        },
        {
          heading: "06 Go-to-Market",
          blocks: [{ type: "figure", size: "lg", image: img("deliverable-06-go-to-market.png", 1588, 1226, "Pink “Experience Architecture” board describing the shopping-mall bacteria-elimination campaign, with the interactive screen illustration.", `${PDF}, page 63 (embedded image)`) }],
        },
      ],
    },
  ],
};

export const fullCaseStudies: Record<string, FullCaseStudy> = {
  "eliminate-bacteria-pro": eliminateBacteriaPro,
};
