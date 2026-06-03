import { z } from 'zod'
import type { HonoEnv } from './types'

const workerEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be ≥32 chars'),
  TRUSTED_ORIGINS: z.string().min(1, 'TRUSTED_ORIGINS must be a comma-separated URL list'),
  SUPER_ADMIN_EMAIL: z.string().email('SUPER_ADMIN_EMAIL must be a valid email'),
  WEB_URL: z.string().url('WEB_URL must be a valid URL'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  STEADFAST_API_KEY: z.string().optional(),
  STEADFAST_SECRET_KEY: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  NEXT_PUBLIC_EMAIL_USER: z.string().email().optional(),
})

export type ValidatedWorkerEnv = z.infer<typeof workerEnvSchema>

let cached: ValidatedWorkerEnv | null = null

/** Call once per request (first request validates, subsequent requests use cache). */
export function validateWorkerEnv(env: HonoEnv['Bindings']): ValidatedWorkerEnv {
  if (cached) return cached
  const result = workerEnvSchema.safeParse(env)
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`Worker env validation failed:\n${issues}`)
  }
  cached = result.data
  return cached
}
