import type { Metadata } from "next";
import MailboxScene from "@/components/contact/MailboxScene";

export const metadata: Metadata = {
  title: "Contact | A Garden of Ideas — Zhinuo Wang",
  description: "Get in touch with Zhinuo Wang by email.",
};

export default function ContactPage() {
  return <MailboxScene />;
}
