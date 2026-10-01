import type { Metadata } from "next";
import PricingView from "@/components/pricing/PricingView";

export const metadata: Metadata = {
  title: "Pricing — PulseBoard",
  description: "Basic, Pro and Enterprise plans for PulseBoard, with the real build status of every feature.",
};

// Public page: outside the (app) group, so it opens without signing in
export default function PricingPage() {
  return <PricingView />;
}
