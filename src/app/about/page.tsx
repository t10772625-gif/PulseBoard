import type { Metadata } from "next";
import AboutView from "@/components/site/AboutView";

export const metadata: Metadata = {
  title: "About — PulseBoard",
  description: "What PulseBoard is, how it is built, and how honest status labels work.",
};

export default function AboutPage() {
  return <AboutView />;
}
