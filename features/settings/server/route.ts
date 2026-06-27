import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";

const app = new Hono()

  .get("/", async (c) => {
    const settings = await db.select().from(siteSettings);
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return c.json(map);
  })

  .patch(
    "/",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        shipping_inside_dhaka: z.coerce.number().min(0).optional(),
        shipping_outside_dhaka: z.coerce.number().min(0).optional(),
        currency: z.string().min(1).max(10).optional(),
        payment_method_card: z.enum(["true", "false"]).optional(),
        payment_method_cod: z.enum(["true", "false"]).optional(),
        meta_pixel_enabled: z.enum(["true", "false"]).optional(),
        meta_pixel_default_id: z.string().optional(),
        meta_pixel_debug: z.enum(["true", "false"]).optional(),
        meta_pixel_mappings: z.string().optional(),
      })
    ),
    async (c) => {
      const user = c.get("user");
      if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const body = c.req.valid("json");
      const updates = Object.entries(body).filter(([, v]) => v !== undefined) as [string, any][];

      await Promise.all(
        updates.map(([key, value]) =>
          db.insert(siteSettings)
            .values({ key, value: String(value) })
            .onConflictDoUpdate({
              target: siteSettings.key,
              set: { value: String(value), updatedAt: new Date() },
            })
        )
      );

      return c.json({ success: true });
    }
  );

export default app;
