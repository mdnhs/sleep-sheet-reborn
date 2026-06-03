import { createMiddleware } from "hono/factory";

/**
 * Guards admin-only routes. Must run after `sessionMiddleware` so that
 * `c.get("user")` is populated. Responds 403 when the caller is not an admin.
 */
export const requireAdmin = createMiddleware(async (c, next) => {
  const user = c.get("user");
  if (!user || user.role !== "ADMIN") {
    return c.json({ success: false, error: "Unauthorized" }, 403);
  }
  await next();
});

/** Guards a route to any of the given roles. Run after `sessionMiddleware`. */
export const requireRole = (...roles: string[]) =>
  createMiddleware(async (c, next) => {
    const user = c.get("user");
    if (!user || !roles.includes(user.role)) {
      return c.json({ error: "Unauthorized" }, 403);
    }
    await next();
  });
