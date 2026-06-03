import { createMiddleware } from 'hono/factory'

// TODO: resolve organization_id from subdomain/custom domain
// Sets organizationId in context; cross-tenant resources return 404
export const tenantMiddleware = createMiddleware(async (c, next) => {
  await next()
})
