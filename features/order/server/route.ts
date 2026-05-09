import { Hono } from "hono";
import prisma from "@/lib/prisma";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";

const app = new Hono()

.get("/", async (c) => {
  const { search } = c.req.query();
  
  try {
    const orders = await prisma.order.findMany({
      where: search ? {
        OR: [
          { orderNumber: { contains: search, mode: "insensitive" } },
          { user: { 
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } }
            ]
          } }
        ]
      } : {},
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: true } },
        shippingMethod: true,
        payment: true
      },
      orderBy: { createdAt: "desc" }
    });

    return c.json({ orders });
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
    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: { status, paymentStatus },
        include: { user: true, items: true }
      }),
      prisma.orderTimelineEvent.create({
        data: {
          orderId: id,
          status,
          message: `${statusMessages[status] || `Status changed to ${status}`}, payment status is now ${paymentStatus.toLowerCase()}.`
        }
      })
    ]);

    return c.json(updatedOrder);
  } catch (error) {
    console.error("Failed to update order:", error);
    return c.json({ error: "Failed to update order" }, 500);
  }
})

.delete("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId: id } }),
      prisma.payment.deleteMany({ where: { orderId: id } }),
      prisma.order.delete({ where: { id } })
    ]);

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete order:", error);
    return c.json({ error: "Failed to delete order" }, 500);
  }
})
.get("/order",sessionMiddleware, async(c)=>{
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try{
   const order = await prisma.order.findMany({
      where: { userId: user.id },
      include:{
        items:{include:{
          product:true
        }}
      }
    })
    return c.json({order},200);
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
    const orders = await prisma.order.findMany({
      where: { guestPhone: phone },
      include: {
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ orders });
  } catch (error) {
    console.error("Failed to fetch orders by phone:", error);
    return c.json({ error: "Failed to fetch orders" }, 500);
  }
})

.get("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: true } },
        shippingMethod: true,
        payment: true,
        OrderTimelineEvent: {
          orderBy: { createdAt: "asc" },
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