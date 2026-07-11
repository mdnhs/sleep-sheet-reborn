import { Hono } from "hono";
import { db } from "@/db";
import { roles, users } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

const app = new Hono()
  .get("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!hasPermission(user, PERMISSIONS.MANAGE_ROLES)) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const allRoles = await db.query.roles.findMany({
      orderBy: (roles, { desc }) => [desc(roles.createdAt)],
    });

    return c.json(allRoles);
  })
  .post(
    "/",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        name: z.string().min(1),
        permissions: z.array(z.string()),
      })
    ),
    async (c) => {
      const user = c.get("user");
      if (!hasPermission(user, PERMISSIONS.MANAGE_ROLES)) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { name, permissions } = c.req.valid("json");

      const existing = await db.query.roles.findFirst({
        where: eq(roles.name, name),
      });

      if (existing) {
        return c.json({ error: "Role name already exists" }, 400);
      }

      const [newRole] = await db.insert(roles).values({
        name,
        permissions,
      }).returning();

      return c.json(newRole);
    }
  )
  .patch(
    "/:id",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        name: z.string().min(1),
        permissions: z.array(z.string()),
      })
    ),
    async (c) => {
      const user = c.get("user");
      if (!hasPermission(user, PERMISSIONS.MANAGE_ROLES)) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.param("id");
      const { name, permissions } = c.req.valid("json");

      const existing = await db.query.roles.findFirst({
        where: eq(roles.name, name),
      });

      if (existing && existing.id !== id) {
        return c.json({ error: "Role name already exists" }, 400);
      }

      const [updated] = await db.update(roles).set({
        name,
        permissions,
      }).where(eq(roles.id, id)).returning();

      if (!updated) {
        return c.json({ error: "Role not found" }, 404);
      }

      return c.json(updated);
    }
  )
  .delete(
    "/:id",
    sessionMiddleware,
    async (c) => {
      const user = c.get("user");
      if (!hasPermission(user, PERMISSIONS.MANAGE_ROLES)) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.param("id");

      // Check if role is in use
      const [usersWithRole] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.roleId, id));

      if (usersWithRole && usersWithRole.count > 0) {
        return c.json({ error: "Cannot delete role because it is assigned to users" }, 400);
      }

      const [deleted] = await db.delete(roles).where(eq(roles.id, id)).returning();

      if (!deleted) {
        return c.json({ error: "Role not found" }, 404);
      }

      return c.json({ success: true });
    }
  );

export default app;
