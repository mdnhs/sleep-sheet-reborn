import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import { appendOrdersToSheet, type SheetOrderRow } from "@/lib/google-sheets";
import { replaceProductsSheet, type ProductSheetRow } from "@/lib/google-sheets-products";
import { db } from "@/db";
import { orders, products, categories } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { isAllowed } from "@/lib/permissions";
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
    shippingCost: 200,
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
      if (!isAllowed(user, "orders", "write", ["MODERATOR"])) {
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
      if (!isAllowed(user, "orders", "write", ["MODERATOR"])) {
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
  )

  .post(
    "/sync-products",
    sessionMiddleware,
    zValidator("json", z.object({ categories: z.array(z.string()).min(1) })),
    async (c) => {
      const user = c.get("user");
      if (!isAllowed(user, "products", "write", ["MODERATOR"])) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { categories: categoryLabels } = c.req.valid("json");

      try {
        const matchedCategories = await db.query.categories.findMany({
          where: inArray(categories.label, categoryLabels),
        });
        const categoryIds = matchedCategories.map((cat) => cat.id);

        const productsList = categoryIds.length
          ? await db.query.products.findMany({
              where: inArray(products.categoryId, categoryIds),
              with: { category: true },
            })
          : [];

        const rows: ProductSheetRow[] = productsList.flatMap((product) =>
          (product.images || []).map((imageUrl) => ({
            name: product.name,
            category: product.category?.label ?? "Uncategorized",
            price: product.price,
            isAvailable: product.stock > 0,
            imageUrl,
          })),
        );

        await replaceProductsSheet(rows);

        setActivityMeta(c, {
          name: `${categoryLabels.length} categor${categoryLabels.length === 1 ? "y" : "ies"}: ${summarizeNames(categoryLabels)}`,
        });
        return c.json({ success: true, count: rows.length });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to sync products to Google Sheet";
        console.error("Google Sheets product sync error:", err);
        return c.json({ error: msg }, 500);
      }
    }
  );

export default app;
