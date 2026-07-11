import { Hono } from "hono";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import bcrypt from "bcryptjs";

const app = new Hono()
  .get("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!hasPermission(user, PERMISSIONS.MANAGE_USERS)) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const allUsers = await db.query.users.findMany({
      orderBy: (users, { desc }) => [desc(users.createdAt)],
      with: { assignedRole: true },
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        roleId: true,
        createdAt: true,
      }
    });

    return c.json(allUsers);
  })
  .post(
    "/",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        roleId: z.string().nullable().optional(),
      })
    ),
    async (c) => {
      const user = c.get("user");
      if (!hasPermission(user, PERMISSIONS.MANAGE_USERS)) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { name, email, password, roleId } = c.req.valid("json");

      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        return c.json({ error: "Email already in use" }, 400);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [newUser] = await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        roleId: roleId || null,
        role: "USER", // Default system role
      }).returning({
        id: users.id,
        name: users.name,
        email: users.email,
        roleId: users.roleId,
      });

      return c.json(newUser);
    }
  )
  .patch(
    "/:id/role",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        roleId: z.string().nullable(),
      })
    ),
    async (c) => {
      const user = c.get("user");
      if (!hasPermission(user, PERMISSIONS.MANAGE_USERS)) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.param("id");
      const { roleId } = c.req.valid("json");

      // Cannot change superadmin
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!targetUser) {
        return c.json({ error: "User not found" }, 404);
      }
      
      if (targetUser.email === process.env.SUPER_ADMIN_EMAIL) {
        return c.json({ error: "Cannot change role of super admin" }, 400);
      }

      const [updated] = await db.update(users).set({
        roleId,
      }).where(eq(users.id, id)).returning({ id: users.id });

      return c.json(updated);
    }
  );

export default app;
