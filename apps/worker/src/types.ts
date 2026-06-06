import type { Database, Organization } from '@repo/database'
import type { OrgRole } from '@repo/permissions'
import type { D1Database, R2Bucket } from '@cloudflare/workers-types'

export type User = {
  id: string
  email: string
  name: string
  role: string         // legacy single-user role (storefront routes); org roles use orgRole
  phone: string | null
  address: string | null
}

// Hono Env type used by all routes and middleware
export type HonoEnv = {
  Bindings: {
    DB: D1Database
    BUCKET: R2Bucket
    WEB_URL: string
    BETTER_AUTH_SECRET: string
    TRUSTED_ORIGINS: string       // comma-separated, e.g. "http://localhost:3000,https://app.example.com"
    SUPER_ADMIN_EMAIL: string
    CLOUDINARY_CLOUD_NAME: string
    CLOUDINARY_API_KEY: string
    CLOUDINARY_API_SECRET: string
    STEADFAST_API_KEY: string
    STEADFAST_SECRET_KEY: string
    EMAIL_PASS: string
    NEXT_PUBLIC_EMAIL_USER: string
    // Payment gateways (optional; per-environment). When unset, checkout uses the sandbox flow.
    PAYMENT_WEBHOOK_SECRET?: string
    PAYMENT_GATEWAY_MODE?: string  // 'sandbox' | 'live'
    SSLCOMMERZ_STORE_ID?: string
    SSLCOMMERZ_STORE_PASSWORD?: string
    BKASH_APP_KEY?: string
    BKASH_APP_SECRET?: string
    BKASH_USERNAME?: string
    BKASH_PASSWORD?: string
  }
  Variables: {
    db: Database
    user: User | null
    tenant: Organization | null
    orgRole: OrgRole | null    // resolved member role for (tenant, user); null if no membership
  }
}
