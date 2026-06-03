import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createDb } from '@repo/database'
import { createAuth } from '@repo/auth'
import { env } from '@/env'

async function getAuth() {
  const { env: cfEnv } = await getCloudflareContext({ async: true })
  const db = createDb(cfEnv.DB as D1Database)
  return createAuth(db, {
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: env.TRUSTED_ORIGINS?.split(',').map((s) => s.trim()),
  })
}

export async function GET(request: Request) {
  const auth = await getAuth()
  return auth.handler(request)
}

export async function POST(request: Request) {
  const auth = await getAuth()
  return auth.handler(request)
}
