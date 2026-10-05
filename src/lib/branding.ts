// Workspace logo: stored as a small data URL (no Storage bucket yet). Only PNG, JPEG
// and WebP are accepted — never SVG, which can carry script. The same pattern and
// length cap are enforced by the workspace_settings.brand_logo CHECK (migration 24).
export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const LOGO_MAX_BYTES = 200 * 1024;
export const LOGO_MAX_CHARS = 280_000;
const LOGO_PATTERN = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

export function isSafeLogo(value: unknown): value is string {
  return typeof value === "string" && value.length <= LOGO_MAX_CHARS && LOGO_PATTERN.test(value);
}

export const DEFAULT_BRAND_NAME = "PulseBoard";

// Reads an uploaded file as a data URL after checking its type and size.
// Returns an error key for the UI instead of throwing.
export function readLogo(file: File): Promise<{ url: string } | { error: "branding.logoType" | "branding.logoSize" | "branding.logoRead" }> {
  if (!(LOGO_TYPES as readonly string[]).includes(file.type)) return Promise.resolve({ error: "branding.logoType" });
  if (file.size > LOGO_MAX_BYTES) return Promise.resolve({ error: "branding.logoSize" });
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(isSafeLogo(r.result) ? { url: r.result } : { error: "branding.logoRead" });
    r.onerror = () => resolve({ error: "branding.logoRead" });
    r.readAsDataURL(file);
  });
}
