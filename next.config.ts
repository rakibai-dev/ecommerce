import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Docker image builds set STANDALONE=1 to produce .next/standalone.
  // Never build standalone for local `next start` (it cannot serve it).
  ...(process.env.STANDALONE === "1" ? { output: "standalone" } : {}),
  images: {
    // Permissive on purpose: product images are external URLs entered by the
    // admin. Tighten to specific hostnames if/when the store goes live.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
