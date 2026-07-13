import { Hono } from "hono";
import { db } from "@/db";
import { trafficEvents } from "@/db/schema";
import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { desc, gte, sql } from "drizzle-orm";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

const app = new Hono()
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        type: z.string(),
        path: z.string(),
        label: z.string().optional(),
        meta: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
          .optional(),
      })
    ),
    async (c) => {
      const body = c.req.valid("json");
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      await db.insert(trafficEvents).values({
        id,
        type: body.type,
        path: body.path,
        label: body.label ?? null,
        meta: body.meta ?? null,
      });

      return c.json({ success: true });
    }
  )
  .get("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!hasPermission(user, PERMISSIONS.VIEW_ANALYTICS)) {
      return c.json({ success: false, error: "Unauthorized" }, 403);
    }

    const { hours } = c.req.query();
    let whereClause;

    if (hours) {
      const hoursNum = parseInt(hours, 10);
      if (!isNaN(hoursNum) && hoursNum > 0) {
        const cutoff = new Date(Date.now() - hoursNum * 60 * 60 * 1000);
        whereClause = gte(trafficEvents.createdAt, cutoff);
      }
    }

    const query = db
      .select()
      .from(trafficEvents)
      .orderBy(desc(trafficEvents.createdAt))
      .limit(500);

    if (whereClause) {
      query.where(whereClause);
    }

    const events = await query;
    return c.json(events);
  })
  .delete("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!hasPermission(user, PERMISSIONS.VIEW_ANALYTICS)) {
      return c.json({ success: false, error: "Unauthorized" }, 403);
    }

    await db.delete(trafficEvents);
    return c.json({ success: true });
  });

export default app;
