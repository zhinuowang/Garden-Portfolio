import type { Metadata } from "next";
import AboutContent from "@/components/about/AboutContent";

export const metadata: Metadata = {
  title: "About | A Garden of Ideas — Zhinuo Wang",
  description: "Zhinuo Wang's background: Master of Information (UX Design) at the University of Toronto, design internships and skills.",
};

export default function AboutPage() {
  return <AboutContent />;
}
