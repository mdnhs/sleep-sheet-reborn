import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import { db } from "@/db";
import { siteSettings, carts, cartItems, products, orders, orderItems, shippingMethods, users } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { sendPurchaseEventOnce, capiContextFromHeaders } from "@/lib/meta-capi";
import bcrypt from "bcryptjs";

// Mirrors features/checkout/schema.ts (client-side form validation) so the
// server never trusts shippingInfo/paymentInfo/guestItems shape or content
// on faith — the client schema only ever ran in the browser.
const checkoutSchema = z.object({
  shippingInfo: z.object({
    fullName: z.string().trim().min(1),
    phone: z.string().trim().min(1),
    email: z.string().trim().email().optional().or(z.literal("")),
    address: z.string().trim().min(1),
    shippingZone: z.enum(["inside_dhaka", "outside_dhaka"]),
    notes: z.string().optional(),
  }),
  paymentInfo: z.object({
    paymentMethod: z.enum(["card", "cod"]),
    cardNumber: z.string().optional(),
    expirationDate: z.string().optional(),
    cvv: z.string().optional(),
    nameOnCard: z.string().optional(),
  }),
  guestItems: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1),
    size: z.string().optional(),
    color: z.string().optional(),
  })).optional(),
  idempotencyKey: z.string().optional(),
});

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

  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `ORD-${dd}${mm}${yy}-${randomSuffix}`;
}

/**
 * True when an error is a Postgres unique-constraint violation (SQLSTATE
 * 23505). Used to turn a losing concurrent insert on `orders.idempotencyKey`
 * into "return the order the winning request already created" instead of a 500.
 */
function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string }; message?: string };
  return (
    e?.code === "23505" ||
    e?.cause?.code === "23505" ||
    /duplicate key|unique constraint/i.test(e?.message ?? "")
  );
}

/**
 * Find (by phone) or create the customer account behind a guest checkout —
 * the same phone-based match/create pattern POS uses for walk-in customers.
 * Without this, a guest order's only trace of the customer is columns on
 * that one order row: if the order is ever deleted, the customer vanishes
 * with it and never appears on the Customers page. Linking a real `users`
 * row makes the customer persist independently of any single order.
 */
async function findOrCreateGuestCustomer(info: {
  fullName: string;
  phone: string;
  email?: string | null;
  address: string;
}): Promise<string> {
  const existing = await db.query.users.findFirst({ where: eq(users.phone, info.phone) });
  if (existing) return existing.id;

  // Only reuse the submitted email if it doesn't already belong to a
  // different account — `users.email` is unique, and a collision here would
  // otherwise crash order creation.
  let email = info.email?.trim() || "";
  if (email) {
    const emailTaken = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (emailTaken) email = "";
  }

  const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
  const [newCustomer] = await db.insert(users).values({
    name: info.fullName,
    email: email || `${info.phone}@guest.local`,
    phone: info.phone,
    password: hashedPassword,
    address: info.address,
  }).returning({ id: users.id });

  return newCustomer.id;
}

async function isPaymentMethodEnabled(method: string): Promise<boolean> {
  // Card payments are hard-disabled here regardless of the
  // payment_method_card setting: there is no real payment gateway wired up,
  // so nothing should ever be able to create a "card" order. Re-enable only
  // once a PCI-compliant processor (e.g. SSLCommerz, bKash, Stripe) is
  // actually integrated — never re-add raw card storage.
  if (method === "card") return false;
  const setting = await db.query.siteSettings.findFirst({ where: eq(siteSettings.key, "payment_method_cod") });
  return setting ? setting.value !== "false" : true;
}

const app = new Hono()

.post("/", sessionMiddleware, zValidator("json", checkoutSchema), async (c) => {
  const user = c.get("user");

  const { shippingInfo, paymentInfo, guestItems, idempotencyKey: rawKey } = c.req.valid("json");

  // Order-creation idempotency key: one UUID per checkout attempt, generated
  // client-side and stored in sessionStorage, so a double-click, a slow-network
  // re-click, or a back-then-resubmit reuses the SAME key. If an order already
  // exists for this key, return it instead of creating a second row. The unique
  // index on orders.idempotencyKey closes the remaining concurrent-burst race
  // below (the losing insert is caught via isUniqueViolation).
  const idempotencyKey: string | undefined =
    typeof rawKey === "string" && rawKey.trim() ? rawKey.trim() : undefined;

  if (idempotencyKey) {
    const existing = await db.query.orders.findFirst({
      where: eq(orders.idempotencyKey, idempotencyKey),
    });
    if (existing) {
      return c.json({
        message: "Order already placed",
        order: existing,
        orderId: existing.id,
      });
    }
  }

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
        guestName: shippingInfo.fullName,
        guestPhone: shippingInfo.phone,
        guestEmail: shippingInfo.email || null,
        subtotal,
        totalAmount,
        tax: 0,
        shippingCost,
        shippingAddress: shippingInfo.address,
        paymentMethod: paymentInfo.paymentMethod === "card" ? "CARD" : "COD",
        saleType: 'WEBSITE',
        note: shippingInfo.notes || null,
        idempotencyKey: idempotencyKey ?? null,
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

      for (const item of cartItemsForOrder) {
        await db.update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }

      await db.delete(cartItems)
        .where(eq(cartItems.cartId, cart.id));

      // Server-side Purchase (CAPI). Fires at most once per order (guarded by
      // orders.metaPurchaseEventSentAt) and is deduplicated against the browser
      // Pixel via a shared event_id. No-op unless CAPI env is configured.
      await sendPurchaseEventOnce(
        {
          eventId: order.id,
          value: totalAmount,
          currency: "BDT",
          orderId: order.id,
          contents: cartItemsForOrder.map((i) => ({
            id: i.productId,
            quantity: i.quantity,
            item_price: i.price,
          })),
          numItems: cartItemsForOrder.reduce((s, i) => s + i.quantity, 0),
          customer: {
            email: shippingInfo.email,
            phone: shippingInfo.phone,
            fullName: shippingInfo.fullName,
          },
        },
        capiContextFromHeaders(c.req.raw.headers),
      );

      // Purchase is reported to Meta only server-side (sendPurchaseEventOnce
      // above), so the response no longer carries a Pixel payload.
      return c.json({
        message: "Order placed successfully",
        order: createdOrder,
        orderId: order.id,
      });
    } catch (error) {
      // Lost a concurrent insert race on the same idempotency key: the winning
      // request already created the order, so return that instead of erroring.
      if (idempotencyKey && isUniqueViolation(error)) {
        const existing = await db.query.orders.findFirst({
          where: eq(orders.idempotencyKey, idempotencyKey),
        });
        if (existing) {
          return c.json({ message: "Order already placed", order: existing, orderId: existing.id });
        }
      }
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
    const guestUserId = await findOrCreateGuestCustomer({
      fullName: shippingInfo.fullName,
      phone: shippingInfo.phone,
      email: shippingInfo.email,
      address: shippingInfo.address,
    });

    let guestOrderId = "";
    const orderNumber = await generateOrderNumber();
    const [order] = await db.insert(orders).values({
      orderNumber,
      userId: guestUserId,
      guestName: shippingInfo.fullName,
      guestPhone: shippingInfo.phone,
      guestEmail: shippingInfo.email || null,
      subtotal,
      totalAmount,
      tax: 0,
      shippingCost,
      shippingAddress: shippingInfo.address,
      paymentMethod: paymentInfo.paymentMethod === "card" ? "CARD" : "COD",
      saleType: 'WEBSITE',
      note: shippingInfo.notes || null,
      idempotencyKey: idempotencyKey ?? null,
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

    for (const item of cartItemsForOrder) {
      await db.update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }

    // Server-side Purchase (CAPI). Fires at most once per order (guarded by
    // orders.metaPurchaseEventSentAt) and deduplicated against the browser Pixel.
    await sendPurchaseEventOnce(
      {
        eventId: order.id,
        value: totalAmount,
        currency: "BDT",
        orderId: order.id,
        contents: cartItemsForOrder.map((i) => ({
          id: i.productId,
          quantity: i.quantity,
          item_price: i.price,
        })),
        numItems: cartItemsForOrder.reduce((s, i) => s + i.quantity, 0),
        customer: {
          email: shippingInfo.email,
          phone: shippingInfo.phone,
          fullName: shippingInfo.fullName,
        },
      },
      capiContextFromHeaders(c.req.raw.headers),
    );

    // Purchase is reported to Meta only server-side (sendPurchaseEventOnce
    // above), so the response no longer carries a Pixel payload.
    return c.json({
      message: "Order placed successfully",
      orderId: guestOrderId,
    });
  } catch (error) {
    // Lost a concurrent insert race on the same idempotency key: the winning
    // request already created the order, so return that instead of erroring.
    if (idempotencyKey && isUniqueViolation(error)) {
      const existing = await db.query.orders.findFirst({
        where: eq(orders.idempotencyKey, idempotencyKey),
      });
      if (existing) {
        return c.json({ message: "Order already placed", order: existing, orderId: existing.id });
      }
    }
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
