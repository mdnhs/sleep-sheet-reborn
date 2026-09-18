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
import { triggerMetaPurchaseOnConfirmation } from "./meta-purchase-trigger";
import { getCapiReadiness } from "@/lib/meta-capi";

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
              columns: { id: true, name: true, images: true, price: true, sku: true, addOns: true, variants: true, sizes: true, stock: true }
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
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  shippingAddress: z.string().optional(),
  items: z.array(z.object({
    id: z.string().optional(),
    productId: z.string(),
    quantity: z.number().int().min(1),
    price: z.number().min(0),
    costPrice: z.number().min(0).nullable().optional(),
    size: z.string().nullable().optional(),
    color: z.string().nullable().optional()
  })).optional()
})), async (c) => {
  const user = c.get("user");
  if (!isAllowed(user, "orders", "write", ["MODERATOR"])) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const { status, paymentStatus, shippingCost, totalAmount, guestName, guestPhone, shippingAddress, items } = c.req.valid("json");

  // Changing money (shipping, total, item cost) or modifying items needs the refund/amounts perm.
  const changesAmounts =
    shippingCost !== undefined || totalAmount !== undefined || items !== undefined;
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
      with: {
        items: true
      }
    });
    
    if (!currentOrder) {
      return c.json({ error: "Order not found" }, 404);
    }

    if (items !== undefined && items.length === 0) {
      return c.json({ error: "Order must have at least one product" }, 400);
    }

    const updateFields: Partial<typeof orders.$inferInsert> = {};
    if (status !== undefined) updateFields.status = status;
    if (paymentStatus !== undefined) updateFields.paymentStatus = paymentStatus;
    if (guestName !== undefined) updateFields.guestName = guestName;
    if (guestPhone !== undefined) updateFields.guestPhone = guestPhone;
    if (shippingAddress !== undefined) updateFields.shippingAddress = shippingAddress;
    
    const effectiveShippingCost = shippingCost !== undefined ? shippingCost : currentOrder.shippingCost;
    if (shippingCost !== undefined) {
      updateFields.shippingCost = shippingCost;
    }

    // Inventory & item adjustments
    if (items !== undefined) {
      const existingItemsMap = new Map(currentOrder.items.map((it) => [it.id, it]));
      const stockDeltas = new Map<string, number>();

      const addDelta = (productId: string | null | undefined, delta: number) => {
        if (!productId || delta === 0) return;
        stockDeltas.set(productId, (stockDeltas.get(productId) ?? 0) + delta);
      };

      const keptItemIds = new Set<string>();

      for (const item of items) {
        if (item.id && existingItemsMap.has(item.id)) {
          keptItemIds.add(item.id);
          const existing = existingItemsMap.get(item.id)!;

          if (existing.productId === item.productId) {
            // Same product: delta = oldQty - newQty (positive restores stock, negative deducts)
            addDelta(item.productId, existing.quantity - item.quantity);
          } else {
            // Product switched: restore old product stock, deduct new product stock
            addDelta(existing.productId, existing.quantity);
            addDelta(item.productId, -item.quantity);
          }

          await db.update(orderItems)
            .set({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              costPrice: item.costPrice !== undefined ? item.costPrice : null,
              size: item.size ?? null,
              color: item.color ?? null,
            })
            .where(eq(orderItems.id, item.id));
        } else {
          // Brand new item in this order
          addDelta(item.productId, -item.quantity);

          await db.insert(orderItems).values({
            orderId: id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            costPrice: item.costPrice !== undefined ? item.costPrice : null,
            size: item.size ?? null,
            color: item.color ?? null,
          });
        }
      }

      // Check for removed items
      for (const existing of currentOrder.items) {
        if (!keptItemIds.has(existing.id)) {
          addDelta(existing.productId, existing.quantity);
          await db.delete(orderItems).where(eq(orderItems.id, existing.id));
        }
      }

      // Apply inventory stock adjustments
      for (const [productId, delta] of stockDeltas.entries()) {
        if (delta !== 0) {
          await db.update(products)
            .set({
              stock: sql`GREATEST(0, ${products.stock} + ${delta})`,
            })
            .where(eq(products.id, productId));
        }
      }

      const newSubtotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
      updateFields.subtotal = newSubtotal;

      if (totalAmount !== undefined) {
        updateFields.totalAmount = totalAmount;
      } else {
        updateFields.totalAmount = newSubtotal + effectiveShippingCost;
      }
    } else {
      if (totalAmount !== undefined) {
        updateFields.totalAmount = totalAmount;
        updateFields.subtotal = Math.max(0, totalAmount - effectiveShippingCost);
      } else if (shippingCost !== undefined) {
        updateFields.totalAmount = currentOrder.subtotal + shippingCost;
      }
    }

    await db.update(orders)
      .set(updateFields)
      .where(eq(orders.id, id));

    // Keep user record in sync if user exists
    if (currentOrder.userId && (guestName !== undefined || guestPhone !== undefined)) {
      const userUpdate: { name?: string; phone?: string } = {};
      if (guestName !== undefined) userUpdate.name = guestName;
      if (guestPhone !== undefined) userUpdate.phone = guestPhone;
      await db.update(users).set(userUpdate).where(eq(users.id, currentOrder.userId));
    }

    if (status !== undefined || paymentStatus !== undefined) {
      const newStatus = status ?? currentOrder.status;
      const newPaymentStatus = paymentStatus ?? currentOrder.paymentStatus;
      await db.insert(orderTimelineEvents).values({
        orderId: id,
        status: newStatus,
        message: `${statusMessages[newStatus] || `Status changed to ${newStatus}`}, payment status is now ${newPaymentStatus.toLowerCase()}.`
      });
    } else if (items !== undefined || guestName !== undefined || guestPhone !== undefined || shippingAddress !== undefined) {
      await db.insert(orderTimelineEvents).values({
        orderId: id,
        status: currentOrder.status,
        message: `Order details updated by admin${items ? ` (${items.length} item${items.length > 1 ? "s" : ""})` : ""}.`
      });
    }

    const updatedOrder = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        user: true,
        items: {
          with: {
            product: {
              columns: { id: true, name: true, images: true, price: true, sku: true, addOns: true, variants: true, sizes: true, stock: true }
            }
          }
        },
        shippingMethod: true,
        payment: true
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
    if (guestName !== undefined && guestName !== currentOrder.guestName) {
      changes.push({ label: "Customer name", from: currentOrder.guestName ?? "None", to: guestName });
    }
    if (guestPhone !== undefined && guestPhone !== currentOrder.guestPhone) {
      changes.push({ label: "Customer phone", from: currentOrder.guestPhone ?? "None", to: guestPhone });
    }
    if (shippingAddress !== undefined && shippingAddress !== currentOrder.shippingAddress) {
      changes.push({ label: "Shipping address", from: currentOrder.shippingAddress, to: shippingAddress });
    }
    if (items !== undefined) {
      changes.push({ label: "Items count", from: currentOrder.items?.length ?? 0, to: items.length });
    }
    setActivityMeta(c, { name: `#${currentOrder.orderNumber}`, changes });

    return c.json(updatedOrder);
  } catch (error) {
    console.error("Failed to update order:", error);
    return c.json({ error: "Failed to update order" }, 500);
  }
})

.post("/:id/confirm-purchase", sessionMiddleware, async (c) => {
  const user = c.get("user");
  // "write", not "update": lib/permissions.ts only knows read/write plus a
  // module's named extras, and orders has no "update". expandPermissions()
  // therefore never produced `orders:update` for anyone, so this guard passed
  // ADMIN (who bypasses every check) and MODERATOR (explicit bypass) only —
  // a role holding orders:write, such as the store's own Owner role, got a 401.
  if (!isAllowed(user, "orders", "write", ["MODERATOR"])) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");

  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    if (order.metaPurchaseEventSentAt) {
      return c.json({
        error: "Meta Purchase event has already been sent for this order",
        alreadySent: true,
        metaPurchaseEventSentAt: order.metaPurchaseEventSentAt,
      }, 400);
    }

    if (order.saleType === "POS") {
      return c.json({
        error: "POS orders cannot be confirmed for Meta Purchase",
      }, 400);
    }

    if (order.status === "CANCELLED" || order.status === "REFUNDED") {
      return c.json({
        error: "Cannot confirm a cancelled or refunded order",
      }, 400);
    }

    // Say what is wrong instead of failing later with a message that fits every
    // cause. This path used to return one generic 500 for "CAPI is switched
    // off", "no Pixel ID", "no token" and "Meta rejected the event" alike,
    // which cost real time to untangle when CAPI turned out to be disabled.
    const readiness = await getCapiReadiness();
    if (!readiness.ready) {
      return c.json({ error: readiness.message, code: "capi_not_ready", reason: readiness.reason }, 400);
    }

    const sent = await triggerMetaPurchaseOnConfirmation(id, { sourceUrl: `${new URL(c.req.url).origin}/` });
    if (!sent) {
      // Eligibility was checked above and CAPI is configured, so what is left
      // is Meta refusing the event or the request failing. The cause is in the
      // server log ([MetaCAPI] Purchase failed ...).
      return c.json({
        error: "Meta did not accept the Purchase event. Check the Pixel ID and access token under Settings > Meta CAPI (and Test Events in Events Manager if a test code is set).",
        code: "capi_rejected",
      }, 502);
    }

    await db.insert(orderTimelineEvents).values({
      orderId: id,
      status: order.status,
      message: `Meta Purchase event triggered manually by ${user?.name || user?.email || "staff"}.`,
    });

    return c.json({
      success: true,
      sent: true,
      message: `Purchase event dispatched to Meta for #${order.orderNumber || order.id}`,
    });
  } catch (error) {
    console.error("Failed to confirm order for Meta Purchase:", error);
    return c.json({ error: "Failed to confirm purchase event" }, 500);
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