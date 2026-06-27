import { Hono } from "hono";
import { sessionMiddleware } from "@/lib/session-middleware";
import { db } from "@/db";
import { siteSettings, carts, cartItems, products, orders, orderItems, payments, shippingMethods } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

async function getShippingCost(zone: string): Promise<number> {
  const key = zone === "outside_dhaka" ? "shipping_outside_dhaka" : "shipping_inside_dhaka";
  const setting = await db.query.siteSettings.findFirst({ where: eq(siteSettings.key, key) });
  return setting ? Number(setting.value) : (zone === "outside_dhaka" ? 120 : 60);
}

async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(
      sql`${orders.createdAt} >= ${todayStart.toISOString()} AND ${orders.createdAt} < ${todayEnd.toISOString()}`
    );

  return `ORD-${dd}${mm}${yy}${Number(count) + 1}`;
}

async function isPaymentMethodEnabled(method: string): Promise<boolean> {
  const key = method === "card" ? "payment_method_card" : "payment_method_cod";
  const setting = await db.query.siteSettings.findFirst({ where: eq(siteSettings.key, key) });
  return setting ? setting.value !== "false" : true;
}

const app = new Hono()

.post("/", sessionMiddleware, async (c) => {
  const user = c.get("user");

  const { shippingInfo, paymentInfo, guestItems } = await c.req.json();

  const selectedMethod = paymentInfo?.paymentMethod === "card" ? "card" : "cod";
  const methodEnabled = await isPaymentMethodEnabled(selectedMethod);
  if (!methodEnabled) {
    return c.json({ message: `Payment method "${selectedMethod}" is currently unavailable` }, 400);
  }

  let cartItemsForOrder: {
    productId: string;
    quantity: number;
    size?: string | null;
    color?: string | null;
    price: number;
  }[] = [];

  if (user) {
    const cart = await db.query.carts.findFirst({
      where: eq(carts.userId, user.id),
      with: { items: { with: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return c.json({ message: "Cart is empty" }, 400);
    }

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return c.json({ message: `Insufficient stock for ${item.product.name}` }, 400);
      }
      const variant = (item.product.variants as { name: string; price: number | null }[] | null)?.find(v => v.name === item.color);
      const displayPrice = variant?.price ?? item.product.price;
      cartItemsForOrder.push({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: displayPrice,
      });
    }

    const subtotal = cartItemsForOrder.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const shippingCost = await getShippingCost(shippingInfo.shippingZone);
    const totalAmount = subtotal + shippingCost;

    try {
      let createdOrder: any = null;
      const orderNumber = await generateOrderNumber();
      const [order] = await db.insert(orders).values({
        orderNumber,
        userId: user.id,
        subtotal,
        totalAmount,
        tax: 0,
        shippingCost,
        shippingAddress: shippingInfo.address,
        paymentMethod: paymentInfo.paymentMethod === "card" ? "CARD" : "COD",
      }).returning();
      
      createdOrder = order;

      await db.insert(orderItems).values(
        cartItemsForOrder.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          size: item.size || null,
          color: item.color || null,
        }))
      );

      if (paymentInfo.paymentMethod === "card" && paymentInfo.cardNumber) {
        await db.insert(payments).values({
          orderId: order.id,
          amount: totalAmount,
          method: "CARD",
          transactionId: paymentInfo.cardNumber,
          last4Digits: paymentInfo.cardNumber.slice(-4),
          expirationDate: paymentInfo.expirationDate,
          status: "COMPLETED",
        });
      }

      for (const item of cartItemsForOrder) {
        await db.update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }

      await db.delete(cartItems)
        .where(eq(cartItems.cartId, cart.id));

      return c.json({ message: "Order placed successfully", order: createdOrder });
    } catch (error) {
      console.error("Error placing order:", error);
      return c.json({ message: "Error placing order" }, 500);
    }
  }

  // Guest checkout
  if (!guestItems || guestItems.length === 0) {
    return c.json({ message: "Cart is empty" }, 400);
  }

  const productIds: string[] = guestItems.map((i: { productId: string }) => i.productId);
  const productsList = await db.query.products.findMany({
    where: inArray(products.id, productIds),
  });

  const productMap = new Map(productsList.map((p) => [p.id, p]));

  for (const item of guestItems) {
    const product = productMap.get(item.productId);
    if (!product) return c.json({ message: `Product not found` }, 400);
    if (product.stock < item.quantity) {
      return c.json({ message: `Insufficient stock for ${product.name}` }, 400);
    }
    const variant = (product.variants as { name: string; price: number | null }[] | null)?.find(v => v.name === item.color);
    const displayPrice = variant?.price ?? product.price;
    cartItemsForOrder.push({
      productId: item.productId,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      price: displayPrice,
    });
  }

  const subtotal = cartItemsForOrder.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shippingCost = await getShippingCost(shippingInfo.shippingZone);
  const totalAmount = subtotal + shippingCost;

  try {
    let guestOrderId = "";
    const orderNumber = await generateOrderNumber();
    const [order] = await db.insert(orders).values({
      orderNumber,
      userId: null,
      guestName: shippingInfo.fullName,
      guestPhone: shippingInfo.phone,
      guestEmail: shippingInfo.email || null,
      subtotal,
      totalAmount,
      tax: 0,
      shippingCost,
      shippingAddress: shippingInfo.address,
      paymentMethod: paymentInfo.paymentMethod === "card" ? "CARD" : "COD",
    }).returning();

    guestOrderId = order.id;

    await db.insert(orderItems).values(
      cartItemsForOrder.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        size: item.size ?? null,
        color: item.color ?? null,
      }))
    );

    if (paymentInfo.paymentMethod === "card" && paymentInfo.cardNumber) {
      await db.insert(payments).values({
        orderId: order.id,
        amount: totalAmount,
        method: "CARD",
        transactionId: paymentInfo.cardNumber,
        last4Digits: paymentInfo.cardNumber.slice(-4),
        expirationDate: paymentInfo.expirationDate,
        status: "COMPLETED",
      });
    }

    for (const item of cartItemsForOrder) {
      await db.update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }

    return c.json({ message: "Order placed successfully", orderId: guestOrderId });
  } catch (error) {
    console.error("Error placing guest order:", error);
    return c.json({ message: "Error placing order" }, 500);
  }
})

.get("/shipping-methods", async (c) => {
  try {
    const shippingMethodsList = await db.query.shippingMethods.findMany({
      where: eq(shippingMethods.active, true),
      orderBy: (fields, { asc }) => [asc(fields.cost)],
    });

    return c.json({ shippingMethods: shippingMethodsList });
  } catch (error) {
    console.error("Error fetching shipping methods:", error);
    return c.json({ error: "Failed to fetch shipping methods" }, 500);
  }
});

export default app;
