import { Hono } from "hono";
import { sessionMiddleware } from "@/lib/session-middleware";
import { db } from "@/db";
import { orders, orderItems, products, carts, users, wishlistItems, expenses } from "@/db/schema";
import { eq, and, gte, lte, asc, desc, sum, count, isNotNull, sql } from "drizzle-orm";
import { getDateRange, getStartDate } from "@/lib/utils";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

const app = new Hono()

// Sales Overview
.get("/sales-overview", sessionMiddleware, async (c) => {
  const user =c.get("user");
  if (!hasPermission(user, PERMISSIONS.VIEW_ANALYTICS)) {
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    const { period = "month" } = c.req.query();
    const { startDate, endDate } = getDateRange(period);

    const [revenueRes, ordersRes, salesTrend, expensesRes, costRes] = await Promise.all([
      db.select({ sum: sum(orders.totalAmount) })
        .from(orders)
        .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate))),
      db.select({ count: count() })
        .from(orders)
        .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate))),
      db.select({ createdAt: orders.createdAt, totalAmount: orders.totalAmount })
        .from(orders)
        .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
        .orderBy(asc(orders.createdAt)),
      db.select({ sum: sum(expenses.amount) })
        .from(expenses)
        .where(and(gte(expenses.date, startDate), lte(expenses.date, endDate))),
      db.select({ 
          sum: sql<number>`SUM(${orderItems.quantity} * COALESCE(${orderItems.costPrice}, 0))` 
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate))),
    ]);

    const totalRevenue = Number(revenueRes[0]?.sum || 0);
    const totalOrders = Number(ordersRes[0]?.count || 0);
    const totalExpenses = Number(expensesRes[0]?.sum || 0);
    const totalCost = Number(costRes[0]?.sum || 0);
    const netProfit = totalRevenue - totalCost - totalExpenses;

    return c.json({
      totalRevenue,
      totalOrders,
      totalExpenses,
      netProfit,
      aov: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      trendData: salesTrend.map((item) => ({
        date: item.createdAt.toISOString(),
        amount: item.totalAmount,
      })),
    });
  } catch (error) {
    console.error("Sales overview error:", error);
    return c.json({ error: "Failed to fetch sales data" }, 500);
  }
})

// Customer Lifetime Value (CLV)
.get('/clv',sessionMiddleware, async (c) => {
  const user =c.get("user");
  if (!hasPermission(user, PERMISSIONS.VIEW_ANALYTICS)) {
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    const result = await db.select({
      userId: orders.userId,
      totalAmount: sum(orders.totalAmount),
    })
    .from(orders)
    .where(isNotNull(orders.userId))
    .groupBy(orders.userId);

    const validResults = result.filter(r => r.totalAmount !== null && r.userId);
    const averageCLV = validResults.length > 0 
      ? validResults.reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0) / validResults.length
      : 0;

    return c.json({ averageCLV });
  } catch (error) {
    console.error("CLV error:", error);
    return c.json({ error: "Failed to calculate CLV" }, 500);
  }
})

// Geographic Distribution
.get('/distribution',sessionMiddleware, async (c) => {
  const user =c.get("user");
  if (!hasPermission(user, PERMISSIONS.VIEW_ANALYTICS)) {
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    const data = await db.select({
      shippingState: orders.shippingState,
      totalAmount: sum(orders.totalAmount),
      count: count(orders.id),
    })
    .from(orders)
    .where(isNotNull(orders.shippingState))
    .groupBy(orders.shippingState);

    return c.json(data.map(d => ({
      state: d.shippingState,
      revenue: Number(d.totalAmount || 0),
      orders: Number(d.count || 0)
    })));
  } catch (error) {
    console.error("Distribution error:", error);
    return c.json({ error: "Failed to fetch distribution data" }, 500);
  }
})

// Inventory Turnover
.get('/inventory-turnover',sessionMiddleware, async (c) => {
  const user =c.get("user");
  if (!hasPermission(user, PERMISSIONS.VIEW_ANALYTICS)) {
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [salesRes, startingRes, endingRes] = await Promise.all([
      db.select({ sum: sum(orderItems.quantity) })
        .from(orderItems)
        .where(gte(orderItems.createdAt, startOfYear)),
      db.select({ sum: sum(products.stock) }).from(products),
      db.select({ sum: sum(products.stock) }).from(products)
    ]);

    const totalSales = Number(salesRes[0]?.sum || 0);
    const avgInventory = ((Number(startingRes[0]?.sum || 0)) + (Number(endingRes[0]?.sum || 0))) / 2 || 1;

    const turnover = totalSales / avgInventory;

    return c.json({ 
      turnoverRate: Number(turnover.toFixed(2)),
      totalSales,
      avgInventory
    });
  } catch (error) {
    console.error("Inventory turnover error:", error);
    return c.json({ error: "Failed to calculate inventory turnover" }, 500);
  }
})
  

// Cart Abandonment Rate
.get('/abandonment',sessionMiddleware, async (c) => {
  const user =c.get("user");
  if (!hasPermission(user, PERMISSIONS.VIEW_ANALYTICS)) {
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    const [totalCartsRes, convertedCartsRes] = await Promise.all([
      db.select({ count: count() }).from(carts),
      db.select({ count: count() })
        .from(carts)
        .where(sql`exists (select 1 from ${orders} where ${orders.userId} = ${carts.userId})`)
    ]);

    const total = Number(totalCartsRes[0]?.count || 0);
    const converted = Number(convertedCartsRes[0]?.count || 0);

    const abandonmentRate = total > 0 
      ? ((total - converted) / total) * 100 
      : 0;

    return c.json({ 
      abandonmentRate: Number(abandonmentRate.toFixed(2)),
      totalCarts: total,
      convertedCarts: converted
    });
  } catch (error) {
    console.error("Abandonment rate error:", error);
    return c.json({ error: "Failed to calculate abandonment rate" }, 500);
  }
})

// Cohort Retention
.get('/cohort',sessionMiddleware, async (c) => {
  const user =c.get("user");
  if (!hasPermission(user, PERMISSIONS.VIEW_ANALYTICS)) {
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    const cohortsRows = (await db.execute(sql`
      SELECT 
        DATE_TRUNC('month', u."createdAt") as cohort_month,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT o."userId") as retained_users
      FROM "User" u
      LEFT JOIN "orders" o 
        ON u.id = o."userId"
        AND o."createdAt" BETWEEN u."createdAt" AND u."createdAt" + INTERVAL '30 days'
      GROUP BY cohort_month
      ORDER BY cohort_month
    `)) as unknown as { rows: Array<{ cohort_month: string; total_users: string | number; retained_users: string | number }> };

    return c.json(cohortsRows.rows.map(c => {
      const totalUsers = Number(c.total_users);
      const retainedUsers = Number(c.retained_users);
      return {
        cohortMonth: new Date(c.cohort_month).toISOString(),
        totalUsers,
        retainedUsers,
        retentionRate: totalUsers > 0 
          ? (retainedUsers / totalUsers) * 100
          : 0
      };
    }));
  } catch (error) {
    console.error("Cohort error:", error);
    return c.json({ error: "Failed to fetch cohort data" }, 500);
  }
})

// Spending Clusters
.get('/spending-clusters',sessionMiddleware, async (c) => {
  const user =c.get("user");
  if (!hasPermission(user, PERMISSIONS.VIEW_ANALYTICS)) {
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    const segmentsRows = (await db.execute(sql`
      SELECT 
        CASE
          WHEN total_spent < 100 THEN 'Low'
          WHEN total_spent BETWEEN 100 AND 500 THEN 'Medium'
          ELSE 'High'
        END as segment,
        COUNT(*) as customers
      FROM (
        SELECT u.id, SUM(o."totalAmount") as total_spent
        FROM "User" u
        LEFT JOIN "orders" o ON u.id = o."userId"
        GROUP BY u.id
      ) as spending
      GROUP BY segment
    `)) as unknown as { rows: Array<{ segment: string; customers: string | number }> };

    return c.json(segmentsRows.rows.map(s => ({
      segment: s.segment,
      customers: Number(s.customers)
    })));
  } catch (error) {
    console.error("Spending clusters error:", error);
    return c.json({ error: "Failed to fetch customer segments" }, 500);
  }
})

// Customer Acquisition
.get('/acquisition', async (c) => {
  try {
    const { period = 'month' } = c.req.query();
    const startDate = getStartDate(period);

    const allowedPeriods = ['day', 'week', 'month', 'year'];
    const selectedPeriod = allowedPeriods.includes(period) ? period : 'month';

    const usersRows = (await db.execute(sql.raw(`
      SELECT 
        DATE_TRUNC('${selectedPeriod}', "createdAt") as period,
        COUNT(*) as count
      FROM "User"
      WHERE "createdAt" >= '${startDate.toISOString()}'
      GROUP BY period
      ORDER BY period ASC
    `))) as unknown as { rows: Array<{ period: string; count: string | number }> };

    return c.json(usersRows.rows.map(u => ({
      date: new Date(u.period).toISOString(),
      count: Number(u.count)
    })));
  } catch (error) {
    console.error("Acquisition error:", error);
    return c.json({ error: "Failed to fetch acquisition data" }, 500);
  }
})
.get('/most-purchased',sessionMiddleware, async (c) => {
  const user =c.get("user");
  if (!hasPermission(user, PERMISSIONS.VIEW_ANALYTICS)) {
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    const data = await db.select({
      productId: products.id,
      productName: products.name,
      productImages: products.images,
      totalSold: sum(orderItems.quantity),
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .groupBy(products.id, products.name, products.images)
    .orderBy(desc(sum(orderItems.quantity)))
    .limit(5);

    return c.json(data.map(item => ({
      productId: item.productId,
      productName: item.productName,
      productImages: item.productImages || [],
      totalSold: Number(item.totalSold || 0),
    })));
  } catch (error) {
    console.error("Most purchased error:", error);
    return c.json({ error: "Failed to fetch most purchased products" }, 500);
  }
})

.get('/most-wishlisted',sessionMiddleware, async (c) => {
  const user =c.get("user");
  if (!hasPermission(user, PERMISSIONS.VIEW_ANALYTICS)) {
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    const data = await db.select({
      productId: products.id,
      productName: products.name,
      productImages: products.images,
      wishlistCount: count(wishlistItems.productId),
    })
    .from(wishlistItems)
    .innerJoin(products, eq(wishlistItems.productId, products.id))
    .groupBy(products.id, products.name, products.images)
    .orderBy(desc(count(wishlistItems.productId)))
    .limit(5);

    return c.json(data.map(item => ({
      productId: item.productId,
      productName: item.productName,
      productImages: item.productImages || [],
      wishlistCount: Number(item.wishlistCount || 0),
    })));
  } catch (error) {
    console.error("Most wishlisted error:", error);
    return c.json({ error: "Failed to fetch most wishlisted products" }, 500);
  }
})
  

export default app;