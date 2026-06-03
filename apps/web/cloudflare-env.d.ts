// Minimal binding/var types for getCloudflareContext().env.
// Regenerate the full version anytime with: pnpm cf-typegen
import type { D1Database } from "@cloudflare/workers-types";

interface CloudflareEnv {
  // Bindings (wrangler.jsonc)
  DB: D1Database;
  ASSETS: Fetcher;

  // Vars / secrets (.dev.vars locally, `wrangler secret put` in prod)
  JWT_SECRET: string;
  NEXT_PUBLIC_APP_URL: string;
  // Gmail SMTP (via worker-mailer)
  NEXT_PUBLIC_EMAIL_USER: string;
  EMAIL_PASS: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  STEADFAST_API_KEY?: string;
  STEADFAST_SECRET_KEY?: string;
}
