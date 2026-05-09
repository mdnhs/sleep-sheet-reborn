import { Hono } from "hono";
import { sessionMiddleware } from "@/lib/session-middleware";
import prisma from "@/lib/prisma";

async function getShippingCost(zone: string): Promise<number> {
  const key = zone === "outside_dhaka" ? "shipping_outside_dhaka" : "shipping_inside_dhaka";
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  return setting ? Number(setting.value) : (zone === "outside_dhaka" ? 120 : 60);
}

async function isPaymentMethodEnabled(method: string): Promise<boolean> {
  const key = method === "card" ? "payment_method_card" : "payment_method_cod";
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
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
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return c.json({ message: "Cart is empty" }, 400);
    }

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return c.json({ message: `Insufficient stock for ${item.product.name}` }, 400);
      }
      cartItemsForOrder.push({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: item.product.price,
      });
    }

    const subtotal = cartItemsForOrder.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const shippingCost = await getShippingCost(shippingInfo.shippingZone);
    const totalAmount = subtotal + shippingCost;

    try {
      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}`,
          userId: user.id,
          subtotal,
          totalAmount,
          tax: 0,
          shippingCost,
          shippingAddress: shippingInfo.address,
          shippingCity: null,
          shippingState: null,
          shippingPostalCode: null,
          shippingCountry: null,
          paymentMethod: paymentInfo.paymentMethod === "card" ? "CARD" : "COD",
          items: {
            create: cartItemsForOrder.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              size: item.size,
              color: item.color,
            })),
          },
          ...(paymentInfo.paymentMethod === "card" && paymentInfo.cardNumber && {
            payment: {
              create: {
                amount: totalAmount,
                method: "CARD",
                transactionId: paymentInfo.cardNumber,
                last4Digits: paymentInfo.cardNumber.slice(-4),
                expirationDate: paymentInfo.expirationDate,
                status: "COMPLETED",
              },
            },
          }),
        },
      });

      for (const item of cartItemsForOrder) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await prisma.cartItem.deleteMany({
        where: { cart: { userId: user.id } },
      });

      return c.json({ message: "Order placed successfully", order });
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
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of guestItems) {
    const product = productMap.get(item.productId);
    if (!product) return c.json({ message: `Product not found` }, 400);
    if (product.stock < item.quantity) {
      return c.json({ message: `Insufficient stock for ${product.name}` }, 400);
    }
    cartItemsForOrder.push({
      productId: item.productId,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      price: product.price,
    });
  }

  const subtotal = cartItemsForOrder.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shippingCost = await getShippingCost(shippingInfo.shippingZone);
  const totalAmount = subtotal + shippingCost;

  try {
    // Create order with scalar fields only — avoids Prisma XOR relation ambiguity for guest (no userId)
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        userId: undefined,
        guestName: shippingInfo.fullName,
        guestPhone: shippingInfo.phone,
        guestEmail: shippingInfo.email || null,
        subtotal,
        totalAmount,
        tax: 0,
        shippingCost,
        shippingAddress: shippingInfo.address,
        shippingCity: null,
        shippingState: null,
        shippingPostalCode: null,
        shippingCountry: null,
        paymentMethod: paymentInfo.paymentMethod === "card" ? "CARD" : "COD",
      },
    });

    await prisma.orderItem.createMany({
      data: cartItemsForOrder.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        size: item.size ?? null,
        color: item.color ?? null,
      })),
    });

    if (paymentInfo.paymentMethod === "card" && paymentInfo.cardNumber) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          method: "CARD",
          transactionId: paymentInfo.cardNumber,
          last4Digits: paymentInfo.cardNumber.slice(-4),
          expirationDate: paymentInfo.expirationDate,
          status: "COMPLETED",
        },
      });
    }

    for (const item of cartItemsForOrder) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return c.json({ message: "Order placed successfully", orderId: order.id });
  } catch (error) {
    console.error("Error placing guest order:", error);
    return c.json({ message: "Error placing order" }, 500);
  }
})

.get("/shipping-methods", async (c) => {
  try {
    const shippingMethods = await prisma.shippingMethod.findMany({
      where: { active: true },
      orderBy: { cost: "asc" },
    });

    return c.json({ shippingMethods });
  } catch (error) {
    console.error("Error fetching shipping methods:", error);
    return c.json({ error: "Failed to fetch shipping methods" }, 500);
  }
});

export default app;
