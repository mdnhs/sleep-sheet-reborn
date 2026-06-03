// Minimal binding/var types for getCloudflareContext().env.
// Regenerate the full version anytime with: pnpm cf-typegen
// Using declare global so this merges with @opennextjs/cloudflare's global CloudflareEnv.

declare global {
  interface CloudflareEnv {
    // Bindings (wrangler.jsonc)
    DB: D1Database;
    ASSETS: Fetcher;
    BUCKET: R2Bucket;

    // Vars / secrets (.dev.vars locally, `wrangler secret put` in prod)
    BETTER_AUTH_SECRET: string;
    TRUSTED_ORIGINS: string;
    SUPER_ADMIN_EMAIL: string;
    WEB_URL: string;
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_API_URL?: string;
    // Gmail SMTP (via worker-mailer)
    NEXT_PUBLIC_EMAIL_USER?: string;
    EMAIL_PASS?: string;
    CLOUDINARY_CLOUD_NAME?: string;
    CLOUDINARY_API_KEY?: string;
    CLOUDINARY_API_SECRET?: string;
    STEADFAST_API_KEY?: string;
    STEADFAST_SECRET_KEY?: string;
  }
}

export {}
