import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Server-only encryption for integration secrets (Slack / Discord webhook URLs,
// Google refresh tokens). AES-256-GCM with the key in INTEGRATION_ENCRYPTION_KEY
// (32 random bytes, base64). The database only ever holds the ciphertext.
// Format: v1.<iv>.<auth tag>.<ciphertext>, each part base64url.

function key(): Buffer | null {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!raw) return null;
  const k = Buffer.from(raw, "base64");
  return k.length === 32 ? k : null;
}

export const encryptionConfigured = () => key() !== null;

export function encryptSecret(plain: string): string {
  const k = key();
  if (!k) throw new Error("INTEGRATION_ENCRYPTION_KEY missing or not 32 bytes");
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", k, iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
}

// Returns null for anything that wasn't made by encryptSecret with this key
export function decryptSecret(token: string): string | null {
  const k = key();
  const parts = token.split(".");
  if (!k || parts.length !== 4 || parts[0] !== "v1") return null;
  try {
    const d = createDecipheriv("aes-256-gcm", k, Buffer.from(parts[1], "base64url"));
    d.setAuthTag(Buffer.from(parts[2], "base64url"));
    return Buffer.concat([d.update(Buffer.from(parts[3], "base64url")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

// HMAC-SHA256 signature for outgoing webhooks ("sha256=<hex>"), like GitHub's
export function signBody(body: string, secret: string): string {
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
