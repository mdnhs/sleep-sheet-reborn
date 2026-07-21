import { Hono } from "hono";
import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { and, desc, gte, ilike, or, sql } from "drizzle-orm";
import { sessionMiddleware } from "@/lib/session-middleware";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

const app = new Hono()

  .get("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!hasPermission(user, PERMISSIONS.VIEW_ACTIVITY_LOGS)) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const page = Math.max(parseInt(c.req.query("page") || "1", 10) || 1, 1);
    const limit = Math.min(parseInt(c.req.query("limit") || "20", 10) || 20, 100);
    const search = c.req.query("search")?.trim();
    const errorsOnly = c.req.query("status") === "error";

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(activityLogs.userName, `%${search}%`),
          ilike(activityLogs.userEmail, `%${search}%`),
          ilike(activityLogs.action, `%${search}%`),
          ilike(activityLogs.targetName, `%${search}%`),
          ilike(activityLogs.path, `%${search}%`),
          ilike(activityLogs.ip, `%${search}%`),
        ),
      );
    }
    if (errorsOnly) {
      conditions.push(gte(activityLogs.status, 400));
    }
    const filter = conditions.length > 0 ? and(...conditions) : undefined;

    try {
      const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(activityLogs);
      if (filter) countQuery.where(filter);
      const [countResult] = await countQuery;
      const total = Number(countResult?.count || 0);

      const errorCountQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(activityLogs)
        .where(gte(activityLogs.status, 400));
      const [errorCountResult] = await errorCountQuery;
      const errorTotal = Number(errorCountResult?.count || 0);

      const listQuery = db
        .select()
        .from(activityLogs)
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);
      if (filter) listQuery.where(filter);
      const data = await listQuery;

      return c.json({
        data,
        total,
        errorTotal,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      });
    } catch (error) {
      console.error("Failed to fetch activity logs", error);
      return c.json({ error: "Failed to fetch activity logs" }, 500);
    }
  });

export default app;
