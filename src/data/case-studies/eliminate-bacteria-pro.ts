import type { CsImage, FullCaseStudy } from "./types";

// Eliminate Bacteria Pro, reproduced from Desktop/Wang Nora - Eliminate Bacteria Pro.pdf
// (the only source for this page). Text is verbatim, with the PDF's wrapped lines
// joined. Images are the original files from Desktop/Portofolio, matched to the
// PDF's image slots by position and exact proportions (the PDF export left the
// slots blank, except the hero, matched pixel for pixel).

const DIR = "/assets/projects/eliminate-bacteria-pro";
// images whose own background is transparent: they sit straight on the page
const BARE = new Set(["detail-anti-dropout-bumps.png", "detail-camera.png", "detail-inductive-charging.png", "detail-speakers.png", "experiential-marketing.png", "user-flow-5.png", "user-flow-6.png"]);
const img = (file: string, width: number, height: number, alt: string, source: string): CsImage => ({ src: `${DIR}/${file}`, width, height, alt, source: `Desktop/Portofolio/${source}`, bare: BARE.has(file) });

export const eliminateBacteriaPro: FullCaseStudy = {
  source: "Desktop/Wang Nora - Eliminate Bacteria Pro.pdf",
  facts: [
    { label: "Type", value: "Concept Product Design" },
    { label: "Time", value: "2023.12 - 2024.04" },
    { label: "Tool", value: "Adobe InDesign, Adobe Illustrator" },
  ],
  sections: [
    {
      id: "overview",
      heading: "Overview",
      blocks: [
        {
          type: "aside",
          image: img("hero.png", 1130, 1130, "Eliminate Bacteria Pro: the pink and blue toothbrush under the brand name, with four icons labelled Gamified Brushing, Real-time VR display, Zone-based Guidance and 3-Second Detection.", "ELIMINATE.png"),
          blocks: [
            { type: "p", text: "This project explores how combining VR technology with an electric toothbrush can make toothbrushing both engaging and effective for children. When a child brushes their teeth while wearing VR glasses, the system displays a real-time visualization of their teeth. Cute grey patterns appear on the tooth surface every 4 millimeters. Only when the toothbrush remains on a pattern for 3 seconds does the pattern change from grey to green. By transforming brushing into an interactive “monster-elimination” style game, the design encourages children to brush more carefully and thoroughly while ensuring that no areas are missed." },
          ],
        },
      ],
    },
    {
      id: "components",
      heading: "Product Components and Working Principle",
      blocks: [
        { type: "p", text: "The product consists of two core components:" },
        { type: "components", items: [{ icon: "🥽", name: "VR Glasses" }, { icon: "🪥", name: "Electric Toothbrush" }] },
        { type: "p", text: "The electric toothbrush uses a built-in camera to scan the inside of the mouth, while the VR glasses display a real-time visualization of the teeth. Grey cartoon “bacteria” patterns appear on the tooth surfaces in the image, and children are required to place the toothbrush on the corresponding areas to clean them. When the toothbrush remains on a target pattern for a short period of time, the pattern changes from grey to green, indicating that the area has been cleaned." },
        { type: "p", text: "Through this mechanism, the brushing process is transformed into an interactive cleaning task, allowing children to complete more thorough and careful brushing through a gamified experience." },
      ],
    },
    {
      id: "interaction",
      heading: "Interaction Mechanism: Gamified Cleaning Feedback",
      blocks: [
        {
          type: "bullets",
          items: [
            "Grey “bacteria” patterns appear on the tooth surface every 4 mm in the VR visualization.",
            "The toothbrush cleans a spot when it remains on the pattern for 3 seconds.",
            "The pattern changes from grey to green, indicating that the area has been cleaned.",
            "The system provides audio feedback during the cleaning process.",
            "The VR glasses display the cleaning progress in real time, allowing users to see which areas have been cleaned and which still require attention.",
          ],
        },
      ],
    },
    {
      id: "user-flow",
      heading: "User Flow",
      blocks: [
        { type: "step", n: 1, text: "Press and hold the buttons on both the VR glasses and the electric toothbrush for 5 seconds to pair via Bluetooth. Press and hold again for 5 seconds to turn the devices off.", image: img("user-flow-1.png", 506, 406, "A finger pressing the button on the apple-shaped VR glasses and another on the toothbrush, with a 5 seconds clock and a link icon between them.", "1.png") },
        { type: "step", n: 2, lead: "Capture Tooth Image:", text: "The VR glasses guide the user to scan the mouth using the camera embedded in the toothbrush head. A 360° scan is performed to capture a complete image of the teeth, which is then used for subsequent cleaning feedback and visualization.", image: img("user-flow-2.png", 566, 624, "The brush head's camera, a 360-degree icon, and a scanned image of the teeth inside blue scanning corners.", "2.png") },
        { type: "step", n: 3, text: "Users can select their preferred pattern using the button on the toothbrush handle. During selection, the VR glasses display a “Style Selection” prompt, and the chosen pattern appears on the tooth image.", image: img("user-flow-3.png", 738, 598, "A Style Selection menu listing Bacteria, Lollipop, Hamburger, Orange, Cola, Dots and Fried chicken, beside a finger pressing the handle buttons.", "3.png") },
        { type: "step", n: 4, text: "Lightly press the button, and the electric toothbrush begins to vibrate.", image: img("user-flow-4.png", 328, 508, "A finger pressing the toothbrush button, with vibration lines around the brush head.", "4.png") },
        { type: "step", n: 5, text: "Follow the tooth image displayed in the VR glasses and place the brush head on the area where the grey pattern appears. Hold it there for about 3 seconds until the pattern turns green. The brush head only needs to lightly touch the tooth surface, and cleaning is completed through the toothbrush’s vibration.", image: img("user-flow-5.png", 582, 516, "The brush held against the teeth with a 3 seconds clock, above the teeth image covered in grey bacteria patterns.", "5.png") },
        { type: "step", n: 6, text: "When all patterns turn green, the tooth cleaning process is complete.", image: img("user-flow-6.png", 688, 391, "The teeth image with every pattern turned green and a large green check mark.", "6.png") },
      ],
    },
    {
      id: "product-detail",
      heading: "Product Detail Design",
      blocks: [
        { type: "step", n: 1, title: "Camera Embedded in the Brush Head", text: "When the product is used for the first time, the system scans the mouth using the camera embedded in the brush head to capture the structure of the teeth and generate baseline data. During brushing, the camera continuously scans the areas the toothbrush passes over, helping users clearly see which regions have already been cleaned and which still require attention.", image: img("detail-camera.png", 324, 289, "Close-up of the blue brush head with a small camera among the bristles, linked to an enlarged camera module.", "build-in camera.png") },
        { type: "step", n: 2, title: "Pattern Style Selection", text: "To prevent children from feeling bored after repeated use, the system includes a pattern style selection feature. By changing the patterns displayed on the teeth, the experience remains fresh and engaging, helping maintain children’s interest in brushing over time.", image: img("detail-pattern-selection.png", 296, 381, "The Style Selection menu: Bacteria, Lollipop, Hamburger, Orange, Cola, Dots, Fried chicken.", "pattern selection.png") },
        { type: "step", n: 3, title: "Anti-Slip Bumps", text: "The bumps on the handle increase friction with the hand. Even if toothpaste foam gets on the handle, they help prevent the toothbrush from slipping out of a child’s hand.", image: img("detail-anti-dropout-bumps.png", 447, 515, "The pink handle with an enlarged view of its rounded bumps.", "Anti-dropout bumps .png") },
        { type: "step", n: 4, title: "Speakers Embedded in the VR Glasses Arms", text: "Speakers built into the arms of the VR glasses play a bubble sound effect whenever a grey pattern turns green. This audio feedback creates an interactive experience and makes the brushing process more enjoyable.", image: img("detail-speakers.png", 759, 624, "The bear-shaped VR glasses with an enlarged view of the speaker in the arm.", "speaker.png") },
        { type: "step", n: 5, title: "Inductive Charging", text: "The toothbrush uses a port-free inductive charging design, reducing the risk of battery damage. Even if the toothbrush becomes wet, users do not need to worry about electrical leakage or shock, making it safer and more reliable.", image: img("detail-inductive-charging.png", 1217, 835, "A pale yellow charging pad with a battery charging icon and a USB cable.", "Charger.png") },
      ],
    },
    {
      id: "brand",
      heading: "Brand Visual Design",
      blocks: [
        { type: "h3", text: "Logo and Brand Name" },
        { type: "p", text: "The logo I designed features a tooth character wearing VR glasses and holding a magnifying glass. The brand name, “Eliminate Bacteria Pro,” reflects the product’s effectiveness in oral cleaning while also framing the brushing process as a game of “eliminating bacteria.” This playful concept encourages children to view brushing as an enjoyable activity, motivating them to brush more actively through a fun and engaging experience." },
        { type: "figure", size: "md", image: img("logo-annotated.png", 902, 364, "The Eliminate Bacteria Pro logo, a smiling tooth wearing VR glasses and holding a magnifying glass, annotated: VR Glasses; The magnifying glass represents the ability to “see” bacteria and check for omissions. This corresponds to the function of the product; Brand Name.", "Logo.png") },
        { type: "h3", text: "Business Card Design" },
        { type: "p", text: "The front of the business card features the product’s logo, with a repeating tooth pattern used as the background to strengthen the brand’s visual identity. The reverse side includes multiple contact methods for customer convenience, such as phone number, email, website, and address, making it easy for users to access information and get in touch with the brand." },
        { type: "figure", size: "md", caption: "Front", image: img("business-card-front.png", 1051, 601, "Business card front: the logo on a pale blue background tiled with small teeth.", "bussiness card front.png") },
        { type: "figure", size: "md", caption: "Back", image: img("business-card-back.png", 1051, 601, "Business card back: the logo beside the brand name, the line “Specializing in children’s oral cleaning”, and website, phone, email and address lines.", "Business card back.png") },
      ],
    },
    {
      id: "marketing",
      heading: "Experiential Marketing",
      blocks: [
        { type: "p", text: "I designed an experiential marketing campaign in collaboration with a shopping mall, featuring an interactive screen where children can participate in a “Bacteria Elimination Challenge.” Multiple “bacteria” patterns appear on the screen, and when children tap them with their fingers, the bacteria disappear in a puff of grey smoke. Participants compete to eliminate as many bacteria as possible within one minute, creating a fun and engaging challenge among children." },
        { type: "h3", text: "Rewards" },
        { type: "bullets", items: ["1st place: A free Eliminate Bacteria Pro product", "2nd place: 40% off coupon", "3rd place: $50 cash reward"] },
        { type: "h3", text: "Campaign Goals" },
        {
          type: "bullets",
          items: [
            "Help children experience the concept of gamified toothbrushing through interactive play",
            "Allow parents to better understand the product’s functions in a direct and engaging way",
            "Increase brand exposure in high-traffic public spaces",
            "Observe real user behavior to inform future design improvements",
          ],
        },
        { type: "figure", size: "lg", image: img("experiential-marketing.png", 2196, 1217, "An interactive kiosk screen; an enlarged view shows cartoon bacteria scattered on the screen with a score counter reading Total: 2 and a timer at 00:58.", "Experience Architecture.png") },
      ],
    },
    {
      id: "values",
      heading: "Key Design Values",
      blocks: [
        {
          type: "entries",
          items: [
            { label: "01", title: "Child-Centered Interactive Experience", text: "By introducing gamification, brushing becomes an engaging and interactive activity that encourages children to participate more actively in their daily oral care." },
            { label: "02", title: "Visualized Cleaning Feedback", text: "The system presents the real-time cleaning status of teeth, helping users clearly understand which areas have been cleaned and which still need attention, reducing missed spots." },
            { label: "03", title: "Emotional Experience Design", text: "Friendly visual elements and sound feedback create a relaxed and enjoyable atmosphere, making children more willing to continue using the product." },
            { label: "04", title: "Integrated Brand Experience", text: "The design focuses not only on product functionality but also integrates brand visuals and experiential marketing to create a cohesive and complete brand experience." },
          ],
        },
      ],
    },
    {
      id: "impact",
      heading: "Expected Design Impact",
      blocks: [
        {
          type: "entries",
          items: [
            { label: "01", title: "Longer and More Focused Brushing Time", text: "The gamified mechanism increases children’s engagement, encouraging them to brush for longer and with greater attention." },
            { label: "02", title: "Reduced Risk of Tooth Decay", text: "A more thorough and complete cleaning process helps reduce bacterial buildup, lowering the risk of cavities." },
            { label: "03", title: "Development of Healthy Daily Habits", text: "Through a fun experience with clear feedback, children can gradually build consistent and healthy brushing routines." },
            { label: "04", title: "Enhanced Parent–Child Interaction", text: "The interactive nature of the product encourages parents to participate in their children’s brushing process, promoting more parent–child communication." },
            { label: "05", title: "Increased Brand Trust", text: "By delivering an enjoyable yet effective product experience, the design strengthens users’ confidence and trust in the brand." },
          ],
        },
      ],
    },
  ],
};
