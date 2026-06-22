import { Hono } from "hono";
import { db } from "@/db";
import { orders, orderItems, payments, orderTimelineEvents, users } from "@/db/schema";
import { eq, and, or, ilike, inArray, desc, asc } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";

const app = new Hono()

.get("/", async (c) => {
  const { search } = c.req.query();
  
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

    const ordersList = (!hasSearched || matchingOrderIds.length > 0)
      ? await db.query.orders.findMany({
          where: hasSearched ? inArray(orders.id, matchingOrderIds) : undefined,
          with: {
            user: {
              columns: { id: true, name: true, email: true, phone: true }
            },
            items: {
              with: { product: true }
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

.patch("/:id", zValidator("json", z.object({
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED"])
})), async (c) => {
  const id = c.req.param("id");
  const { status, paymentStatus } = await c.req.json();

  const statusMessages: Record<string, string> = {
    PENDING: "Order placed and pending confirmation.",
    PROCESSING: "Order is being processed.",
    SHIPPED: "Order has been shipped.",
    DELIVERED: "Order delivered to customer.",
    CANCELLED: "Order was cancelled by the user or admin.",
  };

  try {
      await db.update(orders)
        .set({ status, paymentStatus })
        .where(eq(orders.id, id));

      await db.insert(orderTimelineEvents).values({
        orderId: id,
        status,
        message: `${statusMessages[status] || `Status changed to ${status}`}, payment status is now ${paymentStatus.toLowerCase()}.`
      });

    const updatedOrder = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        user: true,
        items: true
      }
    });

    return c.json(updatedOrder);
  } catch (error) {
    console.error("Failed to update order:", error);
    return c.json({ error: "Failed to update order" }, 500);
  }
})

.delete("/:id", async (c) => {
  const id = c.req.param("id");

  try {
      await db.delete(orderItems).where(eq(orderItems.orderId, id));
      await db.delete(payments).where(eq(payments.orderId, id));
      await db.delete(orders).where(eq(orders.id, id));

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete order:", error);
    return c.json({ error: "Failed to delete order" }, 500);
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