import { redirect } from "next/navigation";
import { AUTOMATION_GROUP, firstPage } from "@/lib/nav-groups";

// Automations is a sidebar group: /automations opens its first sub-page
export default function Automations() {
  redirect(firstPage(AUTOMATION_GROUP));
}
