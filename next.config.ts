import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/facebook-feed.xml", destination: "/facebook-feed?format=xml" },
      { source: "/facebook-feed.csv", destination: "/facebook-feed?format=csv" },
      { source: "/facebook-feed.json", destination: "/facebook-feed?format=json" },
    ]
  },
  // CORS for /api/** (the Hono catch-all) is handled per-request in
  // app/api/[[...route]]/route.ts against a trusted-origin allowlist. This
  // used to also set `Access-Control-Allow-Origin: *` with
  // `-Allow-Credentials: true` here — a wildcard origin combined with
  // credentials is a real hole (any site could read a logged-in visitor's
  // cookie-authenticated API responses in their browser), not just spec-
  // invalid; browsers actually reject that exact combination, so it was
  // silently doing nothing anyway. /api/mcp isn't browser-called (MCP
  // clients are server-to-server), so it doesn't need CORS headers either.
  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
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
