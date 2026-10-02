import { redirect } from "next/navigation";
import { INTEGRATION_GROUP, firstPage } from "@/lib/nav-groups";

// Integrations is a sidebar group: /integrations opens its first sub-page
export default function Integrations() {
  redirect(firstPage(INTEGRATION_GROUP));
}
