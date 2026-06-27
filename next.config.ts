import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  async rewrites() {
    return [
      { source: "/facebook-feed.xml", destination: "/facebook-feed?format=xml" },
      { source: "/facebook-feed.csv", destination: "/facebook-feed?format=csv" },
      { source: "/facebook-feed.json", destination: "/facebook-feed?format=json" },
    ]
  },
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
    ],
  },
};

export default nextConfig;
