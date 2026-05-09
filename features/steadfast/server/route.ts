import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import {
  createSteadfastOrder,
  getSteadfastStatusByInvoice,
  getSteadfastBalance,
} from "@/lib/steadfast";
import prisma from "@/lib/prisma";
import type { OrderStatus } from "@/generated/prisma";

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
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
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
      })
    ),
    async (c) => {
      const user = c.get("user");
      if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { orderId, recipient_phone, note } = c.req.valid("json");

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: { select: { name: true } } },
      });

      if (!order) return c.json({ error: "Order not found" }, 404);

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

        await prisma.order.update({
          where: { id: orderId },
          data: {
            trackingNumber: result.consignment?.tracking_code ?? null,
            status: "PROCESSING",
          },
        });

        await prisma.orderTimelineEvent.create({
          data: {
            orderId,
            status: "PROCESSING",
            message: `Booked with Steadfast Courier. Tracking: ${result.consignment?.tracking_code}. Consignment ID: ${result.consignment?.consignment_id}.`,
          },
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
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const orderId = c.req.param("orderId");
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return c.json({ error: "Order not found" }, 404);
    if (!order.trackingNumber) return c.json({ error: "No tracking number" }, 400);

    try {
      const data = await getSteadfastStatusByInvoice(order.orderNumber);
      const mapped = mapSteadfastStatus(data.delivery_status);

      if (mapped && mapped !== order.status) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: mapped },
        });
        await prisma.orderTimelineEvent.create({
          data: {
            orderId,
            status: mapped,
            message: `Status synced from Steadfast: ${data.delivery_status}`,
          },
        });
      }

      return c.json({ delivery_status: data.delivery_status, mapped, updated: mapped !== order.status });
    } catch (err) {
      console.error("Steadfast sync error:", err);
      return c.json({ error: "Failed to sync status" }, 500);
    }
  });

export default app;
