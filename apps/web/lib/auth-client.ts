'use client'

import { createAuthClient } from 'better-auth/client'
import { organizationClient } from 'better-auth/client/plugins'

// No baseURL — uses window.location.origin → calls /api/auth/* on this Next.js app.
// Cookie domain matches; do NOT use the worker-pointing client from @repo/auth for dashboard flows.
export const authClient = createAuthClient({
  plugins: [organizationClient()],
})

export type Session = typeof authClient.$Infer.Session
export type ActiveOrganization = typeof authClient.$Infer.ActiveOrganization
