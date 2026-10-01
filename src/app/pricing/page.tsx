import type { Metadata } from "next";
import PricingView from "@/components/pricing/PricingView";

export const metadata: Metadata = {
  title: "Pricing — PulseBoard",
  description: "Free, Pro and Legendary plans for PulseBoard, with the real build status of every feature.",
};

// Public page: outside the (app) group, so it opens without signing in
export default function PricingPage() {
  return <PricingView />;
}
