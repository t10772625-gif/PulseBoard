import type { Metadata } from "next";
import ContactView from "@/components/site/ContactView";

export const metadata: Metadata = {
  title: "Contact — PulseBoard",
  description: "Questions about PulseBoard, plans, security or partnerships.",
};

export default function ContactPage() {
  return <ContactView />;
}
