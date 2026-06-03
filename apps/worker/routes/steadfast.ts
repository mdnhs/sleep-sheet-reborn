import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "../middleware/session";
import { isServiceError } from "../utils/service-error";
import { getBalance, bookOrder, syncOrder } from "../services/steadfast.service";

const isStaff = (user: { role: string } | null) =>
  !!user && (user.role === "ADMIN" || user.role === "MODERATOR");

const app = new Hono()

  .get("/balance", sessionMiddleware, async (c) => {
    if (!isStaff(c.get("user"))) return c.json({ error: "Unauthorized" }, 401);
    try {
      return c.json(await getBalance());
    } catch (err) {
      console.error("Steadfast balance error:", err);
      return c.json({ error: "Failed to fetch balance" }, 500);
    }
  })

  .post(
    "/book",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        orderId: z.string(),
        recipient_phone: z.string().min(11).max(11),
        note: z.string().optional(),
      }),
    ),
    async (c) => {
      if (!isStaff(c.get("user"))) return c.json({ error: "Unauthorized" }, 401);
      try {
        return c.json(await bookOrder(c.req.valid("json")));
      } catch (err) {
        if (isServiceError(err)) return c.json({ error: err.message }, err.status);
        console.error("Steadfast booking error:", err);
        return c.json({ error: err instanceof Error ? err.message : "Booking failed" }, 500);
      }
    },
  )

  .post("/sync/:orderId", sessionMiddleware, async (c) => {
    if (!isStaff(c.get("user"))) return c.json({ error: "Unauthorized" }, 401);
    try {
      return c.json(await syncOrder(c.req.param("orderId")));
    } catch (err) {
      if (isServiceError(err)) return c.json({ error: err.message }, err.status);
      console.error("Steadfast sync error:", err);
      return c.json({ error: "Failed to sync status" }, 500);
    }
  });

export default app;
