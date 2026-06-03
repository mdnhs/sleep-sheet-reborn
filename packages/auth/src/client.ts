import { createAuthClient } from 'better-auth/client'
import { organizationClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787',
  plugins: [
    organizationClient(),
  ],
})

export type Session = typeof authClient.$Infer.Session
export type ActiveOrganization = typeof authClient.$Infer.ActiveOrganization
