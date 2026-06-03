import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import fs from "node:fs";
import path from "node:path";

// Exposes Cloudflare bindings (DB, BUCKET) via getCloudflareContext()
// during `next dev`, using the config in wrangler.jsonc.
initOpenNextCloudflareForDev();

// Next.js doesn't read .dev.vars (that's wrangler's format).
// Inject all vars from .dev.vars into process.env for local dev so
// env.ts validation + getCloudflareContext work consistently.
if (process.env.NODE_ENV !== "production") {
  const devVarsPath = path.resolve(__dirname, "../../.dev.vars");
  if (fs.existsSync(devVarsPath)) {
    const lines = fs.readFileSync(devVarsPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !(key in process.env)) process.env[key] = val;
    }
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [
    "worker-mailer",
    "better-auth",
    "@better-auth/core",
    "@better-auth/utils",
    "@better-auth/kysely-adapter",
    "kysely",
  ],
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
