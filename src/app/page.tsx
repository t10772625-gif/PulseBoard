import type { Metadata } from "next";
import LandingView from "@/components/site/LandingView";

export const metadata: Metadata = {
  title: "PulseBoard — project management with a live health score",
  description: "Boards, views, roles, automation and analytics for teams, in English and Urdu. Every feature shows its real build status.",
};

// Public landing page (signed-in visitors get an "Open app" button instead of sign-up)
export default function Home() {
  return <LandingView />;
}
