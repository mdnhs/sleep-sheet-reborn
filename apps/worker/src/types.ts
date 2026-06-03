import type { Database, Organization } from '@repo/database'

export type User = {
  id: string
  email: string
  name: string
  role: string
  phone: string | null
  address: string | null
}

// Hono Env type used by all routes and middleware
export type HonoEnv = {
  Bindings: {
    DB: D1Database
    WEB_URL: string
    BETTER_AUTH_SECRET: string
    JWT_SECRET: string
    CLOUDINARY_CLOUD_NAME: string
    CLOUDINARY_API_KEY: string
    CLOUDINARY_API_SECRET: string
    STEADFAST_API_KEY: string
    STEADFAST_SECRET_KEY: string
    EMAIL_PASS: string
    NEXT_PUBLIC_EMAIL_USER: string
  }
  Variables: {
    db: Database
    user: User | null
    tenant: Organization | null
  }
}
