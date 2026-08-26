import { Hono } from "hono";
import { db } from "@/db";
import { orders, orderItems, payments, orderTimelineEvents, users, products } from "@/db/schema";
import { eq, and, or, ilike, inArray, desc, asc, gte, lte, sql } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import { can } from "@/lib/permissions";
import { setActivityMeta, summarizeNames, titleCase, type ActivityChange } from "@/features/activity/server/log-activity";

const app = new Hono()

.get("/", sessionMiddleware, async (c) => {
  const user = c.get("user");
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !can(user, "orders", "read"))) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { search, from, to } = c.req.query();

  try {
    let matchingOrderIds: string[] = [];
    let hasSearched = false;

    if (search) {
      hasSearched = true;
      const matching = await db.select({ id: orders.id })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(or(
          ilike(orders.orderNumber, `%${search}%`),
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`)
        ));
      matchingOrderIds = matching.map(o => o.id);
    }

    const conditions = [];
    if (hasSearched) conditions.push(inArray(orders.id, matchingOrderIds));
    let fromDate: Date | null = null;
    if (from) {
      const d = new Date(from);
      if (!isNaN(d.getTime())) {
        if (!from.includes("T")) d.setHours(0, 0, 0, 0);
        fromDate = d;
      }
    }
    let toDate: Date | null = null;
    if (to) {
      const d = new Date(to);
      if (!isNaN(d.getTime())) {
        if (!to.includes("T") || d.getHours() === 0) d.setHours(23, 59, 59, 999);
        toDate = d;
      }
    }
    if (fromDate) conditions.push(gte(orders.createdAt, fromDate));
    if (toDate) conditions.push(lte(orders.createdAt, toDate));

    const ordersList = (!hasSearched || matchingOrderIds.length > 0)
      ? await db.query.orders.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          with: {
            user: {
              columns: { id: true, name: true, email: true, phone: true }
            },
            items: {
              // Only the product fields the orders dashboard actually renders.
              // Pulling whole product rows dragged description, tags, features,
              // care instructions and every variant/add-on blob along for every
              // line item of every order — a large payload to scan, serialize
              // and transfer on each dashboard load.
              with: {
                product: {
                  columns: { id: true, name: true, images: true, price: true, sku: true }
                }
              }
            },
            shippingMethod: true,
            payment: true
          },
          orderBy: (fields, { desc }) => [desc(fields.createdAt)]
        })
      : [];

    return c.json({ orders: ordersList });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return c.json({ error: "Failed to fetch orders" }, 500);
  }
})

.patch("/:id", sessionMiddleware, zValidator("json", z.object({
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
  paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]).optional(),
  shippingCost: z.number().min(0).optional(),
  totalAmount: z.number().min(0).optional(),
  items: z.array(z.object({
    id: z.string(),
    costPrice: z.number().min(0)
  })).optional()
})), async (c) => {
  const user = c.get("user");
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !can(user, "orders", "write"))) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const { status, paymentStatus, shippingCost, totalAmount, items } = c.req.valid("json");

  // Changing money (shipping, total, item cost) needs the refund/amounts perm.
  const changesAmounts =
    shippingCost !== undefined || totalAmount !== undefined || (items?.length ?? 0) > 0;
  if (
    changesAmounts &&
    user.role !== "ADMIN" &&
    user.role !== "MODERATOR" &&
    !can(user, "orders", "refund")
  ) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const statusMessages: Record<string, string> = {
    PENDING: "Order placed and pending confirmation.",
    PROCESSING: "Order is being processed.",
    SHIPPED: "Order has been shipped.",
    DELIVERED: "Order delivered to customer.",
    CANCELLED: "Order was cancelled by the user or admin.",
  };

  try {
    const currentOrder = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });
    
    if (!currentOrder) {
      return c.json({ error: "Order not found" }, 404);
    }

    const updateFields: any = {};
    if (status !== undefined) updateFields.status = status;
    if (paymentStatus !== undefined) updateFields.paymentStatus = paymentStatus;
    
    if (shippingCost !== undefined) {
      updateFields.shippingCost = shippingCost;
      updateFields.totalAmount = currentOrder.subtotal + shippingCost;
    }
    if (totalAmount !== undefined) updateFields.totalAmount = totalAmount;

    await db.update(orders)
      .set(updateFields)
      .where(eq(orders.id, id));

    if (items && items.length > 0) {
      await Promise.all(items.map(item =>
        db.update(orderItems)
          .set({ costPrice: item.costPrice })
          .where(eq(orderItems.id, item.id))
      ));
    }

    if (status !== undefined || paymentStatus !== undefined) {
      const newStatus = status ?? currentOrder.status;
      const newPaymentStatus = paymentStatus ?? currentOrder.paymentStatus;
      await db.insert(orderTimelineEvents).values({
        orderId: id,
        status: newStatus,
        message: `${statusMessages[newStatus] || `Status changed to ${newStatus}`}, payment status is now ${newPaymentStatus.toLowerCase()}.`
      });
    }

    const updatedOrder = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        user: true,
        items: true
      }
    });

    const changes: ActivityChange[] = [];
    if (status !== undefined && status !== currentOrder.status) {
      changes.push({ label: "Status", from: titleCase(currentOrder.status), to: titleCase(status) });
    }
    if (paymentStatus !== undefined && paymentStatus !== currentOrder.paymentStatus) {
      changes.push({ label: "Payment status", from: titleCase(currentOrder.paymentStatus), to: titleCase(paymentStatus) });
    }
    if (shippingCost !== undefined && shippingCost !== currentOrder.shippingCost) {
      changes.push({ label: "Shipping cost", from: currentOrder.shippingCost, to: shippingCost });
    }
    if (totalAmount !== undefined && totalAmount !== currentOrder.totalAmount) {
      changes.push({ label: "Total amount", from: currentOrder.totalAmount, to: totalAmount });
    }
    setActivityMeta(c, { name: `#${currentOrder.orderNumber}`, changes });

    return c.json(updatedOrder);
  } catch (error) {
    console.error("Failed to update order:", error);
    return c.json({ error: "Failed to update order" }, 500);
  }
})

.post("/:id/cancel", sessionMiddleware, zValidator("json", z.object({
  reason: z.string().max(500).optional(),
  restock: z.boolean().optional().default(true),
})), async (c) => {
  const user = c.get("user");
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !can(user, "orders", "cancel"))) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const { reason, restock } = c.req.valid("json");

  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    });

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }
    // Guard against re-cancelling, which would restock the same order twice.
    if (order.status === "CANCELLED") {
      return c.json({ error: "Order is already cancelled" }, 400);
    }

    await db.update(orders)
      .set({
        status: "CANCELLED",
        cancellationReason: reason ?? order.cancellationReason ?? null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));

    // Return the reserved goods to inventory.
    if (restock) {
      await Promise.all(
        order.items
          .filter((item) => item.productId)
          .map((item) =>
            db.update(products)
              .set({ stock: sql`${products.stock} + ${item.quantity}` })
              .where(eq(products.id, item.productId as string)),
          ),
      );
    }

    await db.insert(orderTimelineEvents).values({
      orderId: id,
      status: "CANCELLED",
      message:
        `Order cancelled` +
        (reason ? ` — ${reason}` : "") +
        (restock ? ". Items restocked." : "."),
    });

    const updatedOrder = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { user: true, items: true },
    });

    setActivityMeta(c, {
      name: `#${order.orderNumber}`,
      changes: [
        { label: "Status", from: titleCase(order.status), to: "Cancelled" },
        ...(reason ? [{ label: "Reason", to: reason } as ActivityChange] : []),
      ],
    });

    return c.json(updatedOrder);
  } catch (error) {
    console.error("Failed to cancel order:", error);
    return c.json({ error: "Failed to cancel order" }, 500);
  }
})

.post("/:id/refund", sessionMiddleware, zValidator("json", z.object({
  amount: z.number().positive(),
  reason: z.string().max(500).optional(),
  restock: z.boolean().optional().default(true),
})), async (c) => {
  const user = c.get("user");
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !can(user, "orders", "refund"))) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const { amount, reason, restock } = c.req.valid("json");

  // Round to 2dp throughout so float noise never blocks a valid full refund
  // or lets a refund creep a cent over the total.
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const EPS = 0.005;

  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    });

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }
    if (order.status === "CANCELLED") {
      return c.json({ error: "A cancelled order cannot be refunded" }, 400);
    }

    const alreadyRefunded = order.refundedAmount ?? 0;
    const refundable = round2(order.totalAmount - alreadyRefunded);
    if (refundable <= 0) {
      return c.json({ error: "Order is already fully refunded" }, 400);
    }

    const refundAmount = round2(amount);
    if (refundAmount > refundable + EPS) {
      return c.json(
        { error: `Refund exceeds the refundable amount (${refundable})` },
        400,
      );
    }

    const newRefunded = round2(alreadyRefunded + refundAmount);
    const isFull = newRefunded >= order.totalAmount - EPS;
    // True only on the single transition into a fully-refunded state, so we
    // never restock the same order twice across repeated partial refunds.
    const becameFull = isFull && alreadyRefunded < order.totalAmount - EPS;

    const updateFields: any = {
      refundedAmount: newRefunded,
      refundReason: reason ?? order.refundReason ?? null,
      refundedAt: new Date(),
      paymentStatus: isFull ? "REFUNDED" : "PARTIALLY_REFUNDED",
      updatedAt: new Date(),
    };
    // A full refund also moves the order itself to REFUNDED; partial refunds
    // leave the fulfilment status (e.g. DELIVERED) untouched.
    if (isFull) updateFields.status = "REFUNDED";

    await db.update(orders).set(updateFields).where(eq(orders.id, id));

    // Restock the returned goods only when the order becomes fully refunded —
    // an amount-based partial refund doesn't identify which items came back.
    if (restock && becameFull) {
      await Promise.all(
        order.items
          .filter((item) => item.productId)
          .map((item) =>
            db.update(products)
              .set({ stock: sql`${products.stock} + ${item.quantity}` })
              .where(eq(products.id, item.productId as string)),
          ),
      );
    }

    await db.insert(orderTimelineEvents).values({
      orderId: id,
      status: isFull ? "REFUNDED" : order.status,
      message:
        `Refund of ${refundAmount} processed` +
        (reason ? ` — ${reason}` : "") +
        `. Total refunded ${newRefunded} of ${order.totalAmount}` +
        (isFull ? " (fully refunded)." : "."),
    });

    const updatedOrder = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { user: true, items: true },
    });

    setActivityMeta(c, {
      name: `#${order.orderNumber}`,
      changes: [
        { label: "Refunded amount", from: alreadyRefunded, to: newRefunded },
        { label: "Payment status", from: titleCase(order.paymentStatus), to: isFull ? "Refunded" : "Partially Refunded" },
        ...(reason ? [{ label: "Reason", to: reason } as ActivityChange] : []),
      ],
    });

    return c.json(updatedOrder);
  } catch (error) {
    console.error("Failed to refund order:", error);
    return c.json({ error: "Failed to refund order" }, 500);
  }
})

.delete("/:id", sessionMiddleware, async (c) => {
  const user = c.get("user");
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !can(user, "orders", "delete"))) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");

  try {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, id),
        columns: { orderNumber: true },
      });

      await db.delete(orderItems).where(eq(orderItems.orderId, id));
      await db.delete(payments).where(eq(payments.orderId, id));
      await db.delete(orderTimelineEvents).where(eq(orderTimelineEvents.orderId, id));
      await db.delete(orders).where(eq(orders.id, id));

      if (order) setActivityMeta(c, { name: `#${order.orderNumber}` });

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete order:", error);
    return c.json({ error: "Failed to delete order" }, 500);
  }
})

.post("/bulk-delete", sessionMiddleware, zValidator("json", z.object({ ids: z.array(z.string()) })), async (c) => {
  const user = c.get("user");
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !can(user, "orders", "delete"))) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { ids } = c.req.valid("json");

  try {
    if (ids.length > 0) {
      const targetOrders = await db.query.orders.findMany({
        where: inArray(orders.id, ids),
        columns: { orderNumber: true },
      });

      await db.delete(orderItems).where(inArray(orderItems.orderId, ids));
      await db.delete(payments).where(inArray(payments.orderId, ids));
      await db.delete(orderTimelineEvents).where(inArray(orderTimelineEvents.orderId, ids));
      await db.delete(orders).where(inArray(orders.id, ids));

      setActivityMeta(c, {
        name: `${targetOrders.length} orders: ${summarizeNames(targetOrders.map((o) => `#${o.orderNumber}`))}`,
      });
    }
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to bulk delete orders:", error);
    return c.json({ error: "Failed to bulk delete orders" }, 500);
  }
})

.get("/order", sessionMiddleware, async(c)=>{
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try{
    const order = await db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      with: {
        items: {
          with: {
            product: true
          }
        }
      }
    });
    return c.json({order}, 200);
  }
  catch(error){
    console.error("Failed to Fetch Order",error)
    return c.json({error: "Failed to Fetch Order"},500)
  }
})

.get("/by-phone", async (c) => {
  const { phone } = c.req.query();

  if (!phone) {
    return c.json({ error: "Phone number is required" }, 400);
  }

  try {
    const ordersList = await db.query.orders.findMany({
      where: eq(orders.guestPhone, phone),
      with: {
        items: {
          with: {
            product: true
          }
        },
      },
      orderBy: (fields, { desc }) => [desc(fields.createdAt)],
    });

    return c.json({ orders: ordersList });
  } catch (error) {
    console.error("Failed to fetch orders by phone:", error);
    return c.json({ error: "Failed to fetch orders" }, 500);
  }
})

.get("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        user: {
          columns: { id: true, name: true, email: true, phone: true }
        },
        items: {
          with: { product: true }
        },
        shippingMethod: true,
        payment: true,
        OrderTimelineEvent: {
          orderBy: (fields, { asc }) => [asc(fields.createdAt)]
        },
      },
    });

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    return c.json({ order });
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return c.json({ error: "Failed to fetch order" }, 500);
  }
});

export default app;