import { Hono } from 'hono';
import { db } from '@/db';
import { orders, orderItems, payments, products, users } from '@/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { zValidator } from '@hono/zod-validator';
import { sessionMiddleware } from '@/lib/session-middleware';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { parseUserAgent } from '@/lib/user-agent-parser';

async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);

  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `POS-${dd}${mm}${yy}-${randomSuffix}`;
}

const app = new Hono()

.post('/', sessionMiddleware, zValidator('json', z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
  shippingType: z.enum(['showroom', 'online']).default('online'),
  paymentMethod: z.enum(['COD', 'CARD', 'DUE']).default('COD'),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0),
    costPrice: z.number().optional(),
    size: z.string().optional(),
    color: z.string().optional(),
  })).min(1, 'At least one item is required'),
  shippingCost: z.number().optional(),
})), async (c) => {
  const user = c.get('user');
  if (!user || !hasPermission(user, PERMISSIONS.POS_ACCESS)) {
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }

  try {
    const { customerName, customerPhone, customerAddress, paymentMethod, reference, note, items, shippingType, shippingCost } = c.req.valid('json');

    const productIds = items.map(i => i.productId);
    const productsList = await db.query.products.findMany({
      where: inArray(products.id, productIds),
    });
    const productMap = new Map(productsList.map(p => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return c.json({ success: false, error: `Product not found: ${item.productId}` }, 400);
      }
      if (product.stock < item.quantity) {
        return c.json({ success: false, error: `Insufficient stock for ${product.name}` }, 400);
      }
    }

    const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const totalAmount = subtotal + (shippingCost || 0);
    const orderNumber = await generateOrderNumber();

    let finalUserId: string | null = null;
    
    if (customerPhone) {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.phone, customerPhone),
      });
      
      if (existingUser) {
        finalUserId = existingUser.id;
      } else {
        const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
        const [newUser] = await db.insert(users).values({
          name: customerName,
          email: `${customerPhone}@pos.local`,
          phone: customerPhone,
          password: hashedPassword,
          address: customerAddress || null,
        }).returning();
        finalUserId = newUser.id;
      }
    } else {
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
      const [newUser] = await db.insert(users).values({
        name: customerName,
        email: `guest_${randomSuffix}@pos.local`,
        password: hashedPassword,
        address: customerAddress || null,
      }).returning();
      finalUserId = newUser.id;
    }

    const userAgentHeader = c.req.header("user-agent") || null;
    const clientIp = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || c.req.header("x-real-ip") || null;
    const parsedUa = parseUserAgent(userAgentHeader);

    const [order] = await db.insert(orders).values({
      orderNumber,
      userId: finalUserId,
      guestName: customerName,
      guestPhone: customerPhone || null,
      subtotal,
      totalAmount,
      tax: 0,
      shippingCost: shippingCost || 0,
      shippingAddress: customerAddress || (shippingType === 'showroom' ? 'POS - In-store pickup' : 'Online Delivery (POS)'),
      reference: reference || null,
      note: note || null,
      saleType: 'POS',
      paymentMethod,
      paymentStatus: paymentMethod === 'CARD' ? 'COMPLETED' : 'PENDING',
      status: shippingType === 'showroom' ? 'DELIVERED' : 'PENDING',
      ipAddress: clientIp,
      deviceOs: parsedUa.os,
      browserName: parsedUa.browser,
      userAgent: userAgentHeader,
    }).returning();

    await db.insert(orderItems).values(
      items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        costPrice: item.costPrice || null,
        size: item.size || null,
        color: item.color || null,
      }))
    );

    if (paymentMethod === 'CARD') {
      await db.insert(payments).values({
        orderId: order.id,
        amount: totalAmount,
        method: 'CARD',
        status: 'COMPLETED',
      });
    }

    for (const item of items) {
      await db.update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }

    return c.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        items: items.length,
      },
    }, 201);
  } catch (error) {
    console.error('POS order error:', error);
    return c.json({ success: false, error: 'Failed to create POS order' }, 500);
  }
});

export default app;
