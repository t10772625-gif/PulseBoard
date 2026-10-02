import type { Metadata } from "next";
import { FeaturesOverview } from "@/components/site/FeaturesView";

export const metadata: Metadata = {
  title: "Features — PulseBoard",
  description: "Every PulseBoard core feature, with what is in the app today, what is a preview and what is planned.",
};

export default function FeaturesPage() {
  return <FeaturesOverview />;
}
