import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Outgoing requests to URLs that users typed (automation-rule webhooks) are an
// SSRF risk: they could point at this server's own network. A URL is only used
// when it is https, has no username / password, uses the default port, and every
// address its host resolves to is public. Known limit: DNS can change between this
// check and the request (rebinding); requests also don't follow redirects.

function privateV4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local, cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast / reserved
  );
}

function privateV6(ip: string): boolean {
  const x = ip.toLowerCase();
  if (x === "::" || x === "::1") return true;
  if (x.startsWith("::ffff:")) return privateV4(x.slice(7));
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(x.replace(/^\[/, ""));
}

export function isPrivateAddress(ip: string): boolean {
  const v = isIP(ip);
  return v === 4 ? privateV4(ip) : v === 6 ? privateV6(ip) : true;
}

export async function checkOutboundUrl(raw: string): Promise<URL | null> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return null;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null;
  if (isIP(host)) return isPrivateAddress(host) ? null : url;
  try {
    const addrs = await lookup(host, { all: true, verbatim: true });
    if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) return null;
  } catch {
    return null;
  }
  return url;
}

// Incoming-webhook URLs for the two chat apps we post to. Exact hosts only, so a
// saved "Slack" webhook can never be an arbitrary URL.
export const SLACK_WEBHOOK = /^https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9]+\/[A-Za-z0-9]+\/[A-Za-z0-9]+$/;
export const DISCORD_WEBHOOK = /^https:\/\/(?:discord|discordapp)\.com\/api\/webhooks\/\d{5,25}\/[A-Za-z0-9_-]{20,100}$/;

// "hooks.slack.com/…/ab12" — enough to recognise a webhook without revealing it
export function webhookHint(url: string): string {
  const u = new URL(url);
  return `${u.hostname}/…/${u.pathname.slice(-4)}`;
}

// Slack mrkdwn: & < > are control characters
export const slackEscape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
