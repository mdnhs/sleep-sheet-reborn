import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import db from "@/lib/db";

const app = new Hono()

  .get("/", async (c) => {
    const settings = await db.siteSetting.findMany();
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
      })
    ),
    async (c) => {
      const user = c.get("user");
      if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const body = c.req.valid("json");
      const updates = Object.entries(body).filter(([, v]) => v !== undefined) as [string, number][];

      await Promise.all(
        updates.map(([key, value]) =>
          db.siteSetting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
          })
        )
      );

      return c.json({ success: true });
    }
  );

export default app;
