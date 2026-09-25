import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Optimisation d'image : sur Workers, OpenNext route `next/image` vers le binding
  // Cloudflare Images `IMAGES` (wrangler.toml) — T033, research.md §8.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;

// Expose les bindings Cloudflare (D1, KV, variables) à `next dev` via getCloudflareContext().
initOpenNextCloudflareForDev();
