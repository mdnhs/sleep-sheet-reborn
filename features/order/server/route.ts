import { Hono } from "hono";
import { db } from "@/db";
import { orders, orderItems, payments, orderTimelineEvents, users, products, blockedIps } from "@/db/schema";
import { eq, and, or, ilike, inArray, desc, gte, lte, sql, count } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import { isAllowed } from "@/lib/permissions";
import { setActivityMeta, summarizeNames, titleCase, type ActivityChange } from "@/features/activity/server/log-activity";
import {
  isPendingSql,
  isConfirmedSql,
  isDeliveredSql,
  isCancelledSql,
  isReturnedSql,
  isTodaySqlFor,
  todayRange,
  bucketFor,
} from "./status-buckets";

const app = new Hono()

.get("/", sessionMiddleware, async (c) => {
  const user = c.get("user");
  if (!isAllowed(user, "orders", "read", ["MODERATOR"])) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { search, from, to, limit, offset, status, tzOffset } = c.req.query();

  try {
    // Status buckets and the viewer's "today" window are defined in
    // ./status-buckets, where they are covered by tests against a real
    // Postgres — the NULL handling and the deliberate bucket overlap are the
    // kind of thing a comment cannot keep honest.
    const { from: todayFrom, to: todayTo } = todayRange(tzOffset);
    const isTodaySql = isTodaySqlFor({ from: todayFrom, to: todayTo });

    // Search and date range narrow what the whole screen is about; the status
    // bucket then picks one slice of that. They are kept apart because the
    // filter tabs count every bucket within the current search, so those
    // counts must not themselves be filtered down to one bucket.
    const baseConditions = [];

    if (search) {
      // Matching a customer's name or email needs the users join, which the
      // relational query below cannot express in its own where clause. As a
      // subquery it resolves inside the same statement, rather than the round
      // trip that fetching every matching id up front used to cost.
      baseConditions.push(inArray(
        orders.id,
        db.select({ id: orders.id })
          .from(orders)
          .leftJoin(users, eq(orders.userId, users.id))
          .where(or(
            ilike(orders.orderNumber, `%${search}%`),
            ilike(users.name, `%${search}%`),
            ilike(users.email, `%${search}%`)
          )),
      ));
    }

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
    if (fromDate) baseConditions.push(gte(orders.createdAt, fromDate));
    if (toDate) baseConditions.push(lte(orders.createdAt, toDate));

    const bucket = bucketFor(status, isTodaySql);

    const baseWhere = baseConditions.length > 0 ? and(...baseConditions) : undefined;
    const where = bucket ? and(...baseConditions, bucket) : baseWhere;

    // Every bucket counted in one pass over the search/date scope. These feed
    // the filter tabs, which have to keep showing "Confirmed (194)" while you
    // are looking at the pending ones — and the count for the bucket in view
    // doubles as the row total the pager needs, so this replaces rather than
    // adds to the queries a page load already made.
    const [counts] = await db
      .select({
        all: count(),
        today: sql<number>`count(*) FILTER (WHERE ${isTodaySql})`.mapWith(Number),
        pending: sql<number>`count(*) FILTER (WHERE ${isPendingSql})`.mapWith(Number),
        confirmed: sql<number>`count(*) FILTER (WHERE ${isConfirmedSql})`.mapWith(Number),
        delivered: sql<number>`count(*) FILTER (WHERE ${isDeliveredSql})`.mapWith(Number),
        cancelled: sql<number>`count(*) FILTER (WHERE ${isCancelledSql})`.mapWith(Number),
        returned: sql<number>`count(*) FILTER (WHERE ${isReturnedSql})`.mapWith(Number),
      })
      .from(orders)
      .where(baseWhere);

    const total =
      status === "PENDING" ? counts.pending
      : status === "CONFIRMED" ? counts.confirmed
      : status === "DELIVERED" ? counts.delivered
      : status === "CANCELLED" ? counts.cancelled
      : status === "RETURNED" ? counts.returned
      : status === "TODAY" ? counts.today
      : counts.all;

    // A page is only taken when the caller asks for one. The Telegram lookup
    // bot and the dashboard both do; anything else still gets the full set.
    const take = limit ? Math.min(Math.max(parseInt(limit, 10) || 0, 1), 200) : undefined;
    const skip = offset ? Math.max(parseInt(offset, 10) || 0, 0) : 0;

    // Two phases, because LIMIT/OFFSET on the joined query is not the cheap
    // thing it looks like. The user/items joins live in the select list, so
    // Postgres runs them for every row OFFSET then throws away: measured on
    // production, page 1 costs 170 buffers while OFFSET 175 costs 1,298 —
    // about what fetching all 203 orders unpaginated cost. Paging the ids
    // first touches a narrow 34-byte row instead of a 1,264-byte one, and the
    // second query joins exactly the rows being returned, so the cost is flat
    // at any depth: the same OFFSET 175 comes to 186 buffers.
    //
    // Only worth it when a page was actually asked for. Without a limit the id
    // pass would select every id and buy nothing, so that case queries directly.
    const pageIds =
      take === undefined
        ? null
        : (
            await db
              .select({ id: orders.id })
              .from(orders)
              .where(where)
              .orderBy(desc(orders.createdAt), desc(orders.id))
              .limit(take)
              .offset(skip)
          ).map((r) => r.id);

    const ordersList = pageIds?.length === 0 ? [] : await db.query.orders.findMany({
      where: pageIds ? inArray(orders.id, pageIds) : where,
      with: {
        user: {
          columns: { id: true, name: true, email: true, phone: true }
        },
        items: {
          // Only the product fields the orders dashboard actually renders.
          // Pulling whole product rows dragged description, tags, features,
          // care instructions and variants along for every line item of
          // every order — a large payload to scan, serialize and transfer
          // on each dashboard load. addOns is kept: its costPrice drives
          // the add-on bought-price fields in the order cost dialogs.
          with: {
            product: {
              columns: { id: true, name: true, images: true, price: true, sku: true, addOns: true }
            }
          }
        },
        shippingMethod: true,
        payment: true
      },
      // Same key as the id pass above, id included: createdAt alone is not
      // unique, and two rows sharing a millisecond could otherwise land on two
      // pages or on none.
      orderBy: (fields, { desc }) => [desc(fields.createdAt), desc(fields.id)]
    });

    return c.json({ orders: ordersList, total, counts });
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
  if (!isAllowed(user, "orders", "write", ["MODERATOR"])) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const { status, paymentStatus, shippingCost, totalAmount, items } = c.req.valid("json");

  // Changing money (shipping, total, item cost) needs the refund/amounts perm.
  const changesAmounts =
    shippingCost !== undefined || totalAmount !== undefined || (items?.length ?? 0) > 0;
  if (changesAmounts && !isAllowed(user, "orders", "refund", ["MODERATOR"])) {
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

    const updateFields: Partial<typeof orders.$inferInsert> = {};
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
  if (!isAllowed(user, "orders", "cancel", ["MODERATOR"])) {
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
  if (!isAllowed(user, "orders", "refund", ["MODERATOR"])) {
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

    const updateFields: Partial<typeof orders.$inferInsert> = {
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
  if (!isAllowed(user, "orders", "delete", ["MODERATOR"])) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");

  try {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, id),
        columns: { orderNumber: true },
      });

      // blockedIps.orderId has no ON DELETE cascade, so a block record tied to
      // this order would otherwise leave a dangling FK and fail the delete
      // below with a constraint violation. Detach it instead of deleting it —
      // the block itself (and its audit trail) should outlive the order.
      await db.update(blockedIps).set({ orderId: null }).where(eq(blockedIps.orderId, id));
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
  if (!isAllowed(user, "orders", "delete", ["MODERATOR"])) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { ids } = c.req.valid("json");

  try {
    if (ids.length > 0) {
      const targetOrders = await db.query.orders.findMany({
        where: inArray(orders.id, ids),
        columns: { orderNumber: true },
      });

      // See the single-order delete route above for why this is needed.
      await db.update(blockedIps).set({ orderId: null }).where(inArray(blockedIps.orderId, ids));
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

.get("/by-phone", sessionMiddleware, async (c) => {
  const user = c.get("user");
  if (!isAllowed(user, "orders", "read", ["MODERATOR"])) {
    return c.json({ error: "Unauthorized" }, 401);
  }

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

// Reachable without a session on purpose: the order-success page fetches it
// straight after checkout, when a guest has no account and nothing to
// authenticate with. The order id (a cuid) is the capability.
//
// What that cannot justify is the rest of the row. This used to return the
// order wholesale, including the fraud metadata captured at checkout —
// ipAddress, userAgent, deviceOs, browserName — plus the linked account's
// email and the internal timeline. None of it is shown to the customer, and
// order ids leak in ways the order itself does not: a Referer header, a
// support screenshot, a link pasted into a chat. A staff-only field should
// not ride along on a link a customer can forward.
//
// So the row is filtered by what the caller is allowed to see. Staff with
// orders:read get everything; anyone else gets the fields the success page
// and the invoice actually render.
.get("/:id", sessionMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const isStaff = isAllowed(user, "orders", "read", ["MODERATOR"]);

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

    if (isStaff) {
      return c.json({ order });
    }

    // Blanked rather than deleted, so the response keeps one shape whoever
    // asks for it — the RPC client types off this handler, and a union of
    // two shapes would push `order.user?` checks onto the dashboard, which
    // always has the real values anyway.
    return c.json({
      order: {
        ...order,
        ipAddress: null,
        userAgent: null,
        deviceOs: null,
        browserName: null,
        fbc: null,
        idempotencyKey: null,
        user: null,
        OrderTimelineEvent: [],
      },
    });
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return c.json({ error: "Failed to fetch order" }, 500);
  }
});

export default app;