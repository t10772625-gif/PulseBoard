import type { NextConfig } from "next";

// Baseline security headers (CLAUDE.md §13). A full Content-Security-Policy is
// not set yet: it needs testing against Supabase, fonts and Next's inline scripts
// before production.
const common = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Everything except the embeddable roadmap may not be framed by other sites
      { source: "/((?!embed/).*)", headers: [...common, { key: "X-Frame-Options", value: "DENY" }, { key: "Content-Security-Policy", value: "frame-ancestors 'none'" }] },
      // /embed/[id] is meant to be placed in an <iframe> on other sites
      { source: "/embed/:path*", headers: common },
    ];
  },
};

export default nextConfig;
