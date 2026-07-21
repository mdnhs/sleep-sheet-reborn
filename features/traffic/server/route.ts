import { Hono } from "hono";
import { db } from "@/db";
import { trafficEvents } from "@/db/schema";
import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { desc, gte, sql } from "drizzle-orm";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

import { parseUserAgent } from "@/lib/user-agent-parser";

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

      // Extract customer headers
      const rawIp =
        c.req.header("cf-connecting-ip") ||
        c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
        c.req.header("x-real-ip") ||
        "127.0.0.1";

      const userAgent = c.req.header("user-agent") || "";
      const country =
        c.req.header("cf-ipcountry") ||
        c.req.header("x-vercel-ip-country") ||
        null;
      const city = c.req.header("x-vercel-ip-city") || null;

      const { browser, device } = parseUserAgent(userAgent);

      await db.insert(trafficEvents).values({
        id,
        type: body.type,
        path: body.path,
        label: body.label ?? null,
        meta: body.meta ?? null,
        ip: rawIp,
        userAgent: userAgent || null,
        browser: browser || null,
        device: device || null,
        country: country || null,
        city: city || null,
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
    // Wipes the entire traffic history — irreversible, so this needs more
    // than the read-only VIEW_ANALYTICS permission that gates the GET above.
    const user = c.get("user");
    if (!user || user.role !== "ADMIN") {
      return c.json({ success: false, error: "Unauthorized" }, 403);
    }

    await db.delete(trafficEvents);
    return c.json({ success: true });
  });

export default app;
