// Unit cases for the security helpers behind the integrations and task keys:
//   src/lib/server/crypto.ts   (AES-256-GCM secrets, webhook signatures)
//   src/lib/server/outbound.ts (SSRF guard, Slack / Discord URL patterns)
//   src/lib/task-keys.ts       (workspace task prefix, same algorithm as suggest_task_prefix())
// Usage: node --experimental-strip-types scripts/integration-safety-test.mts
// No network: the DNS-based checks use IP literals or names that are refused before any lookup.
import { randomBytes } from "node:crypto";

process.env.INTEGRATION_ENCRYPTION_KEY = randomBytes(32).toString("base64");
const { decryptSecret, encryptSecret, safeEqual, signBody } = await import("../src/lib/server/crypto.ts");
const { checkOutboundUrl, DISCORD_WEBHOOK, isPrivateAddress, SLACK_WEBHOOK, slackEscape, webhookHint } = await import("../src/lib/server/outbound.ts");
const { findByKey, suggestPrefix, taskKey, withDemoNumbers } = await import("../src/lib/task-keys.ts");

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) pass++;
  else {
    fail++;
    console.log("FAIL", name, detail ?? "");
  }
}

// --- crypto ---
const secret = "https://hooks.slack.com/services/T000/B000/XXXXXXXX";
const enc = encryptSecret(secret);
check("ciphertext hides the secret", !enc.includes("hooks.slack.com"), enc);
check("round trip", decryptSecret(enc) === secret);
check("two encryptions differ (random IV)", encryptSecret(secret) !== enc);
const tampered = enc.slice(0, -2) + (enc.endsWith("A") ? "B" : "A") + enc.slice(-1);
check("tampered ciphertext rejected", decryptSecret(tampered) === null);
check("garbage rejected", decryptSecret("v1.abc.def.ghi") === null && decryptSecret("plain") === null);
process.env.INTEGRATION_ENCRYPTION_KEY = randomBytes(32).toString("base64");
check("other key can't decrypt", decryptSecret(enc) === null);
check("signature format", /^sha256=[0-9a-f]{64}$/.test(signBody("{}", "s")));
check("signature is deterministic", signBody("{\"a\":1}", "k") === signBody("{\"a\":1}", "k"));
check("signature depends on secret", signBody("x", "k1") !== signBody("x", "k2"));
check("safeEqual", safeEqual("abc", "abc") && !safeEqual("abc", "abd") && !safeEqual("abc", "ab"));

// --- SSRF guard ---
for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "224.0.0.1"])
  check(`private ${ip}`, isPrivateAddress(ip), ip);
for (const ip of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "2606:4700:4700::1111"]) check(`public ${ip}`, !isPrivateAddress(ip), ip);
const refused = ["http://example.com/hook", "https://user:pw@example.com/", "https://example.com:8443/", "https://localhost/x", "https://127.0.0.1/x", "https://[::1]/x", "https://169.254.169.254/latest", "https://printer.local/", "not a url"];
for (const u of refused) check(`refuse ${u}`, (await checkOutboundUrl(u)) === null, u);
check("allow public IP literal", (await checkOutboundUrl("https://1.1.1.1/hook")) !== null);

// --- chat webhook patterns ---
check("slack ok", SLACK_WEBHOOK.test("https://hooks.slack.com/services/T0123/B0456/abcDEF123"));
check("slack wrong host", !SLACK_WEBHOOK.test("https://hooks.slack.com.evil.com/services/T/B/C"));
check("slack extra path", !SLACK_WEBHOOK.test("https://hooks.slack.com/services/T/B/C/../../x"));
check("discord ok", DISCORD_WEBHOOK.test("https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz_-12"));
check("discord wrong host", !DISCORD_WEBHOOK.test("https://discord.com.evil.io/api/webhooks/123456/abcdefghijklmnopqrstuvwxyz"));
check("hint hides token", webhookHint("https://hooks.slack.com/services/T0123/B0456/abcDEF123") === "hooks.slack.com/…/F123");
check("slack escape", slackEscape("<!channel> & <@U1>") === "&lt;!channel&gt; &amp; &lt;@U1&gt;");

// --- task keys (must match suggest_task_prefix() in 22_task-keys) ---
const cases: [string, string][] = [
  ["PulseBoard", "PUL"],
  ["Pulse Board", "PB"],
  ["Ali Raza workspace", "AR"],
  ["test workspace", "TES"],
  ["Northwind Studio", "NS"],
  ["One Two Three Four Five", "OTTF"],
  ["a", "PB"],
  ["123", "PB"],
  ["", "PB"],
  ["workspace", "WOR"],
];
for (const [name, want] of cases) check(`prefix ${name}`, suggestPrefix(name) === want, suggestPrefix(name));
const tasks = withDemoNumbers([{ id: "a", projectId: "p1" }, { id: "b", projectId: "p2" }, { id: "c", projectId: "p1" }] as never);
check("numbers across the workspace", tasks.map((t) => t.number).join(",") === "1,2,3", tasks.map((t) => t.number));
check("taskKey", taskKey(tasks[2], "PB") === "PB-3" && taskKey(tasks[2], "") === "");
check("findByKey", findByKey("pb-3", tasks, "PB")?.id === "c" && findByKey("2", tasks, "PB")?.id === "b" && !findByKey("XX-3", tasks, "PB") && !findByKey("PB-9", tasks, "PB"));

console.log(`${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
