import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import { appendOrdersToSheet, type SheetOrderRow } from "@/lib/google-sheets";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { can } from "@/lib/permissions";
import { setActivityMeta, summarizeNames } from "@/features/activity/server/log-activity";

function toSheetRow(
  order: NonNullable<Awaited<ReturnType<typeof loadOrderForSheet>>>
): SheetOrderRow {
  const address = [
    order.shippingAddress,
    order.shippingCity,
    order.shippingState,
    order.shippingPostalCode,
    order.shippingCountry,
  ]
    .filter(Boolean)
    .join(", ");

  const quantity = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const boughtCost = order.items.reduce(
    (sum, i) => sum + (i.costPrice ?? 0) * i.quantity,
    0,
  );

  return {
    date: order.createdAt.toISOString().slice(0, 10),
    orderNumber: order.orderNumber,
    customerName: order.user?.name ?? order.guestName ?? "Guest",
    phone: order.user?.phone ?? order.guestPhone ?? "",
    address,
    quantity,
    totalAmount: order.totalAmount,
    boughtCost,
    shippingCost: order.shippingCost,
    profit: order.totalAmount - boughtCost - order.shippingCost,
  };
}

function loadOrderForSheet(id: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      user: true,
      items: { with: { product: true } },
    },
  });
}

const app = new Hono()

  .post(
    "/book",
    sessionMiddleware,
    zValidator("json", z.object({ orderId: z.string() })),
    async (c) => {
      const user = c.get("user");
      if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !can(user, "orders", "write"))) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { orderId } = c.req.valid("json");
      const order = await loadOrderForSheet(orderId);
      if (!order) return c.json({ error: "Order not found" }, 404);

      try {
        await appendOrdersToSheet([toSheetRow(order)]);
        await db.update(orders)
          .set({ sheetBookedAt: new Date() })
          .where(eq(orders.id, orderId));

        setActivityMeta(c, { name: `#${order.orderNumber}` });
        return c.json({ success: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to book to Google Sheet";
        console.error("Google Sheets book error:", err);
        return c.json({ error: msg }, 500);
      }
    }
  )

  .post(
    "/bulk-book",
    sessionMiddleware,
    zValidator("json", z.object({ orderIds: z.array(z.string()).min(1).max(200) })),
    async (c) => {
      const user = c.get("user");
      if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !can(user, "orders", "write"))) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { orderIds } = c.req.valid("json");

      const targetOrders = await db.query.orders.findMany({
        where: inArray(orders.id, orderIds),
        with: {
          user: true,
          items: { with: { product: true } },
        },
      });

      if (targetOrders.length === 0) {
        return c.json({ error: "No orders found" }, 404);
      }

      try {
        await appendOrdersToSheet(targetOrders.map(toSheetRow));
        await db.update(orders)
          .set({ sheetBookedAt: new Date() })
          .where(inArray(orders.id, targetOrders.map((o) => o.id)));

        setActivityMeta(c, {
          name: `${targetOrders.length} orders: ${summarizeNames(targetOrders.map((o) => `#${o.orderNumber}`))}`,
        });
        return c.json({ success: true, booked: targetOrders.length });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to book to Google Sheet";
        console.error("Google Sheets bulk book error:", err);
        return c.json({ error: msg }, 500);
      }
    }
  );

export default app;
