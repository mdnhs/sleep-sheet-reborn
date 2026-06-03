import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "../middleware/session";
import { isServiceError } from "../utils/service-error";
import * as orders from "../services/order.service";

const app = new Hono()

  .get("/", async (c) => {
    try {
      return c.json(await orders.listOrders(c.req.query("search")));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      return c.json({ error: "Failed to fetch orders" }, 500);
    }
  })

  .patch(
    "/:id",
    zValidator(
      "json",
      z.object({
        status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
        paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED"]),
      }),
    ),
    async (c) => {
      const { status, paymentStatus } = c.req.valid("json");
      try {
        return c.json(await orders.updateOrderStatus(c.req.param("id"), status, paymentStatus));
      } catch (error) {
        console.error("Failed to update order:", error);
        return c.json({ error: "Failed to update order" }, 500);
      }
    },
  )

  .delete("/:id", async (c) => {
    try {
      return c.json(await orders.deleteOrder(c.req.param("id")));
    } catch (error) {
      console.error("Failed to delete order:", error);
      return c.json({ error: "Failed to delete order" }, 500);
    }
  })

  .get("/order", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    try {
      return c.json(await orders.getUserOrders(user.id), 200);
    } catch (error) {
      console.error("Failed to Fetch Order", error);
      return c.json({ error: "Failed to Fetch Order" }, 500);
    }
  })

  .get("/by-phone", async (c) => {
    const phone = c.req.query("phone");
    if (!phone) return c.json({ error: "Phone number is required" }, 400);
    try {
      return c.json(await orders.getOrdersByPhone(phone));
    } catch (error) {
      console.error("Failed to fetch orders by phone:", error);
      return c.json({ error: "Failed to fetch orders" }, 500);
    }
  })

  .get("/:id", async (c) => {
    try {
      return c.json(await orders.getOrderById(c.req.param("id")));
    } catch (error) {
      if (isServiceError(error)) return c.json({ error: error.message }, error.status);
      console.error("Failed to fetch order:", error);
      return c.json({ error: "Failed to fetch order" }, 500);
    }
  });

export default app;
