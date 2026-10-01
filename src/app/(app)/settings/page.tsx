import { redirect } from "next/navigation";
import { SETTINGS_HOME } from "@/lib/settings-nav";

// Settings has no page of its own: the sidebar's Settings group lists the
// sub-pages, and links to /settings (user menu, command palette) open the first.
export default function Settings() {
  redirect(SETTINGS_HOME);
}
