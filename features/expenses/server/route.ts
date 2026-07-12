import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import { db } from "@/db";
import { expenseCategories, expenses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import cuid from "cuid";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

const app = new Hono()
  .get("/categories", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !hasPermission(user, PERMISSIONS.VIEW_ANALYTICS) && !hasPermission(user, PERMISSIONS.MANAGE_SETTINGS))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const categories = await db.query.expenseCategories.findMany({
        orderBy: [desc(expenseCategories.createdAt)],
      });
      return c.json({ data: categories });
    } catch (err) {
      console.error(err);
      return c.json({ error: "Failed to fetch categories" }, 500);
    }
  })
  .post(
    "/categories",
    sessionMiddleware,
    zValidator("json", z.object({ name: z.string().min(1) })),
    async (c) => {
      const user = c.get("user");
      if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !hasPermission(user, PERMISSIONS.VIEW_ANALYTICS) && !hasPermission(user, PERMISSIONS.MANAGE_SETTINGS))) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      try {
        const { name } = c.req.valid("json");
        const [category] = await db
          .insert(expenseCategories)
          .values({ id: cuid(), name })
          .returning();
        return c.json({ data: category });
      } catch (err) {
        console.error(err);
        return c.json({ error: "Failed to create category" }, 500);
      }
    }
  )
  .get("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !hasPermission(user, PERMISSIONS.VIEW_ANALYTICS) && !hasPermission(user, PERMISSIONS.MANAGE_SETTINGS))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const allExpenses = await db.query.expenses.findMany({
        with: { category: true },
        orderBy: [desc(expenses.createdAt)],
      });
      return c.json({ data: allExpenses });
    } catch (err) {
      console.error(err);
      return c.json({ error: "Failed to fetch expenses" }, 500);
    }
  })
  .post(
    "/",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        amount: z.number().min(0.01),
        categoryId: z.string(),
        note: z.string().optional(),
        date: z.string().optional(),
      })
    ),
    async (c) => {
      const user = c.get("user");
      if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !hasPermission(user, PERMISSIONS.VIEW_ANALYTICS) && !hasPermission(user, PERMISSIONS.MANAGE_SETTINGS))) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      try {
        const { amount, categoryId, note, date } = c.req.valid("json");
        const [expense] = await db
          .insert(expenses)
          .values({
            id: cuid(),
            amount,
            categoryId,
            note: note || null,
            date: date ? new Date(date) : new Date(),
          })
          .returning();
        return c.json({ data: expense });
      } catch (err) {
        console.error(err);
        return c.json({ error: "Failed to create expense" }, 500);
      }
    }
  )
  .delete("/:id", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !hasPermission(user, PERMISSIONS.VIEW_ANALYTICS) && !hasPermission(user, PERMISSIONS.MANAGE_SETTINGS))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const id = c.req.param("id");
      await db.delete(expenses).where(eq(expenses.id, id));
      return c.json({ success: true });
    } catch (err) {
      console.error(err);
      return c.json({ error: "Failed to delete expense" }, 500);
    }
  });

export default app;
