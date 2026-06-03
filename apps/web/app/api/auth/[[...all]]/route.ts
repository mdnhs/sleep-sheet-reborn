import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createDb } from '@repo/database'
import { createAuth } from '@repo/auth'

async function getAuth() {
  const { env } = await getCloudflareContext({ async: true })
  const db = createDb(env.DB as D1Database)
  return createAuth(db)
}

export async function GET(request: Request) {
  const auth = await getAuth()
  return auth.handler(request)
}

export async function POST(request: Request) {
  const auth = await getAuth()
  return auth.handler(request)
}
