import { NextResponse } from "next/server";
import { isResponse, requireUser } from "@/lib/server/guard";
import { encryptionConfigured } from "@/lib/server/crypto";
import { geminiConfigured } from "@/lib/server/gemini";
import { googleConfigured } from "@/lib/server/google";
import { pushConfigured } from "@/lib/server/push";

// Which integrations the server is set up for (true / false only — never a key or
// a variable value). Signed-in users only, so visitors learn nothing about setup.
export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (isResponse(auth)) return auth;
  return NextResponse.json({
    ai: geminiConfigured(),
    google: googleConfigured() && encryptionConfigured(),
    chatWebhooks: encryptionConfigured(),
    ruleWebhooks: !!process.env.WEBHOOK_SIGNING_SECRET,
    push: pushConfigured(),
    email: !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
  });
}
