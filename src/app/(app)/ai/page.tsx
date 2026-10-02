import { redirect } from "next/navigation";
import { AI_GROUP, firstPage } from "@/lib/nav-groups";

// The AI assistant is a sidebar group: /ai opens its first sub-page
export default function AiAssistant() {
  redirect(firstPage(AI_GROUP));
}
