import { createMiddleware } from 'hono/factory'

// TODO: enforce subscription plan limits and feature flags server-side
export const planMiddleware = createMiddleware(async (c, next) => {
  await next()
})
