import type { Metadata } from "next";
import ContactGarden from "@/components/contact/ContactGarden";

export const metadata: Metadata = {
  title: "Contact | A Garden of Ideas — Zhinuo Wang",
  description: "Get in touch with Zhinuo Wang by email, LinkedIn or WeChat.",
};

export default function ContactPage() {
  return <ContactGarden />;
}
