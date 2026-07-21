import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import { db } from "@/db";
import { expenseCategories, expenses } from "@/db/schema";
import { eq, and, gte, lte, desc, sum, count, sql, type SQL } from "drizzle-orm";
import cuid from "cuid";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { setActivityMeta } from "@/features/activity/server/log-activity";

const canManageExpenses = (
  user: { role?: string; permissions?: string[] } | null | undefined
) =>
  !!user &&
  (user.role === "ADMIN" ||
    user.role === "MODERATOR" ||
    hasPermission(user, PERMISSIONS.VIEW_ANALYTICS) ||
    hasPermission(user, PERMISSIONS.MANAGE_SETTINGS));

const app = new Hono()
  .get("/categories", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!canManageExpenses(user)) {
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
      if (!canManageExpenses(user)) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      try {
        const { name } = c.req.valid("json");
        const trimmed = name.trim();

        const [existing] = await db
          .select({ id: expenseCategories.id })
          .from(expenseCategories)
          .where(sql`LOWER(${expenseCategories.name}) = LOWER(${trimmed})`)
          .limit(1);
        if (existing) {
          return c.json({ error: "A category with this name already exists" }, 409);
        }

        const [category] = await db
          .insert(expenseCategories)
          .values({ id: cuid(), name: trimmed })
          .returning();
        return c.json({ data: category });
      } catch (err) {
        console.error(err);
        return c.json({ error: "Failed to create category" }, 500);
      }
    }
  )
  .get(
    "/",
    sessionMiddleware,
    zValidator(
      "query",
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        categoryId: z.string().optional(),
      })
    ),
    async (c) => {
      const user = c.get("user");
      if (!canManageExpenses(user)) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      try {
        const { from, to, categoryId } = c.req.valid("query");

        const conditions: SQL[] = [];
        if (from) {
          const d = new Date(from);
          if (!isNaN(d.getTime())) {
            conditions.push(gte(expenses.date, d));
          }
        }
        if (to) {
          const d = new Date(to);
          if (!isNaN(d.getTime())) {
            conditions.push(lte(expenses.date, d));
          }
        }
        if (categoryId) {
          conditions.push(eq(expenses.categoryId, categoryId));
        }
        const where = conditions.length ? and(...conditions) : undefined;

        const [rows, totals] = await Promise.all([
          db.query.expenses.findMany({
            where,
            with: { category: true },
            orderBy: [desc(expenses.date), desc(expenses.createdAt)],
            limit: 500,
          }),
          db.select({ total: sum(expenses.amount), count: count() })
            .from(expenses)
            .where(where),
        ]);

        return c.json({
          data: rows,
          total: Number(totals[0]?.total || 0),
          count: Number(totals[0]?.count || 0),
        });
      } catch (err) {
        console.error(err);
        return c.json({ error: "Failed to fetch expenses" }, 500);
      }
    }
  )
  .get("/summary", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!canManageExpenses(user)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [allTime, thisMonth, topCategory] = await Promise.all([
        db.select({ total: sum(expenses.amount), count: count() }).from(expenses),
        db.select({ total: sum(expenses.amount), count: count() })
          .from(expenses)
          .where(gte(expenses.date, startOfMonth)),
        db.select({
            name: expenseCategories.name,
            total: sum(expenses.amount),
          })
          .from(expenses)
          .innerJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
          .where(gte(expenses.date, startOfMonth))
          .groupBy(expenseCategories.name)
          .orderBy(desc(sum(expenses.amount)))
          .limit(1),
      ]);

      return c.json({
        allTimeTotal: Number(allTime[0]?.total || 0),
        allTimeCount: Number(allTime[0]?.count || 0),
        monthTotal: Number(thisMonth[0]?.total || 0),
        monthCount: Number(thisMonth[0]?.count || 0),
        topCategory: topCategory[0]
          ? { name: topCategory[0].name, total: Number(topCategory[0].total || 0) }
          : null,
      });
    } catch (err) {
      console.error(err);
      return c.json({ error: "Failed to fetch expense summary" }, 500);
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
      if (!canManageExpenses(user)) {
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

        const category = await db.query.expenseCategories.findFirst({
          where: eq(expenseCategories.id, categoryId),
          columns: { name: true },
        });
        setActivityMeta(c, { name: `${amount} — ${category?.name ?? "Uncategorized"}${note ? ` (${note})` : ""}` });

        return c.json({ data: expense });
      } catch (err) {
        console.error(err);
        return c.json({ error: "Failed to create expense" }, 500);
      }
    }
  )
  .delete("/:id", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!canManageExpenses(user)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const id = c.req.param("id");
      const existing = await db.query.expenses.findFirst({
        where: eq(expenses.id, id),
        with: { category: { columns: { name: true } } },
      });
      const deleted = await db.delete(expenses).where(eq(expenses.id, id)).returning({ id: expenses.id });
      if (deleted.length === 0) {
        return c.json({ error: "Expense not found" }, 404);
      }
      if (existing) {
        setActivityMeta(c, {
          name: `${existing.amount} — ${existing.category?.name ?? "Uncategorized"}${existing.note ? ` (${existing.note})` : ""}`,
        });
      }
      return c.json({ success: true });
    } catch (err) {
      console.error(err);
      return c.json({ error: "Failed to delete expense" }, 500);
    }
  });

export default app;
