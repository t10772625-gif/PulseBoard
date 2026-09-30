import type { MetadataRoute } from "next";

// Installable web app (MOB-02). Offline caching needs a service worker, not added yet.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PulseBoard",
    short_name: "PulseBoard",
    description: "Project management for teams",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#07111b",
    theme_color: "#12b5a0",
    icons: [
      { src: "/pulseboard-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
  };
}
