import { z } from 'zod'

const serverSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be ≥32 chars'),
  TRUSTED_ORIGINS: z.string().min(1).optional(),
  SUPER_ADMIN_EMAIL: z.string().email().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  EMAIL_PASS: z.string().optional(),
  NEXT_PUBLIC_EMAIL_USER: z.string().email().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL').optional(),
})

function validateEnv() {
  const serverResult = serverSchema.safeParse(process.env)
  const clientResult = clientSchema.safeParse(process.env)

  const errors: string[] = []
  if (!serverResult.success) {
    serverResult.error.issues.forEach((i) => errors.push(`  ${i.path.join('.')}: ${i.message}`))
  }
  if (!clientResult.success) {
    clientResult.error.issues.forEach((i) => errors.push(`  ${i.path.join('.')}: ${i.message}`))
  }

  if (errors.length > 0) {
    throw new Error(`Next.js env validation failed:\n${errors.join('\n')}`)
  }

  return { ...serverResult.data!, ...clientResult.data! }
}

// Validates once at module load — fails fast on startup if required vars are missing.
export const env = validateEnv()
