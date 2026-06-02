import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Exposes Cloudflare bindings (DB, BUCKET) via getCloudflareContext()
// during `next dev`, using the config in wrangler.jsonc.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["worker-mailer"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "luxstore.lenishmagar.me",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
