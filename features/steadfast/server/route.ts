import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import {
  createSteadfastOrder,
  getSteadfastStatusByInvoice,
  getSteadfastBalance,
} from "@/lib/steadfast";
import { db } from "@/db";
import { orders, orderTimelineEvents, orderItems } from "@/db/schema";
import type { OrderStatus } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

function mapSteadfastStatus(s: string): OrderStatus | null {
  switch (s) {
    case "delivered":
    case "partial_delivered":
    case "delivered_approval_pending":
    case "partial_delivered_approval_pending":
      return "DELIVERED";
    case "cancelled":
    case "cancelled_approval_pending":
      return "CANCELLED";
    case "hold":
    case "in_review":
    case "pending":
      return "PROCESSING";
    default:
      return null;
  }
}

const app = new Hono()

  .get("/balance", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !hasPermission(user, PERMISSIONS.MANAGE_ORDERS))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const data = await getSteadfastBalance();
      return c.json(data);
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
        costPrices: z.array(z.object({
          orderItemId: z.string(),
          costPrice: z.number(),
        })).optional(),
      })
    ),
    async (c) => {
      const user = c.get("user");
      if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !hasPermission(user, PERMISSIONS.MANAGE_ORDERS))) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { orderId, recipient_phone, note, costPrices } = c.req.valid("json");

      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: { user: true },
      });

      if (!order) return c.json({ error: "Order not found" }, 404);

      if (costPrices && costPrices.length > 0) {
        for (const item of costPrices) {
          await db.update(orderItems)
            .set({ costPrice: item.costPrice })
            .where(eq(orderItems.id, item.orderItemId));
        }
      }

      const address = [
        order.shippingAddress,
        order.shippingCity,
        order.shippingState,
        order.shippingPostalCode,
        order.shippingCountry,
      ]
        .filter(Boolean)
        .join(", ");

      const payload = {
        invoice: order.orderNumber,
        recipient_name: order.user?.name ?? order.guestName ?? "Guest",
        recipient_phone,
        recipient_address: address,
        cod_amount: order.paymentMethod === "COD" ? order.totalAmount : 0,
        note,
      };
      console.log("[Steadfast] booking payload:", JSON.stringify(payload));

      try {
        const result = await createSteadfastOrder(payload);

        await db.update(orders)
          .set({
            trackingNumber: result.consignment?.tracking_code ?? null,
            status: "PROCESSING",
          })
          .where(eq(orders.id, orderId));

        await db.insert(orderTimelineEvents).values({
          orderId,
          status: "PROCESSING",
          message: `Booked with Steadfast Courier. Tracking: ${result.consignment?.tracking_code}. Consignment ID: ${result.consignment?.consignment_id}.`,
        });

        return c.json({ success: true, consignment: result.consignment });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Booking failed";
        console.error("Steadfast booking error:", err);
        return c.json({ error: msg }, 500);
      }
    }
  )

  .post("/sync/:orderId", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !hasPermission(user, PERMISSIONS.MANAGE_ORDERS))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const orderId = c.req.param("orderId");
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) return c.json({ error: "Order not found" }, 404);
    if (!order.trackingNumber) return c.json({ error: "No tracking number" }, 400);

    try {
      const data = await getSteadfastStatusByInvoice(order.orderNumber);
      const mapped = mapSteadfastStatus(data.delivery_status);

      if (mapped && mapped !== order.status) {
        await db.update(orders)
          .set({ status: mapped })
          .where(eq(orders.id, orderId));
        await db.insert(orderTimelineEvents).values({
          orderId,
          status: mapped,
          message: `Status synced from Steadfast: ${data.delivery_status}`,
        });
      }

      return c.json({ delivery_status: data.delivery_status, mapped, updated: mapped !== order.status });
    } catch (err) {
      console.error("Steadfast sync error:", err);
      return c.json({ error: "Failed to sync status" }, 500);
    }
  });

export default app;
