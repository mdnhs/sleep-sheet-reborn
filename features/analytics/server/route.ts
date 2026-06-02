import { Hono } from "hono";
import { sessionMiddleware } from "@/lib/session-middleware";
import db from "@/lib/db";
import { getDateRange, getStartDate } from "@/lib/utils";
import { parseStringArray } from "@/lib/json-fields";

const app = new Hono()

// Sales Overview
.get("/sales-overview", sessionMiddleware, async (c) => {
  const user =c.get("user");
  if(!user || user.role !== "ADMIN"){
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    const { period = "month" } = c.req.query();
    const { startDate, endDate } = getDateRange(period);

    const [totalRevenue, totalOrders, salesTrend] = await Promise.all([
      db.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      db.order.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      db.order.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true, totalAmount: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return c.json({
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalOrders,
      aov: totalOrders > 0 ? (totalRevenue._sum.totalAmount || 0) / totalOrders : 0,
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
  if(!user || user.role !== "ADMIN"){
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    const result = await db.order.groupBy({
      by: ['userId'],
      _sum: { totalAmount: true },
      where: { userId: { not: undefined } }
    });

    const validResults = result.filter(r => r._sum.totalAmount && r.userId);
    const averageCLV = validResults.length > 0 
      ? validResults.reduce((acc, curr) => acc + (curr._sum.totalAmount || 0), 0) / validResults.length
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
  if(!user || user.role !== "ADMIN"){
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    const data = await db.order.groupBy({
      by: ['shippingState'],
      _sum: { totalAmount: true },
      _count: { id: true },
      where: { shippingState: { not: undefined } }
    });

    return c.json(data.map(d => ({
      state: d.shippingState,
      revenue: d._sum.totalAmount || 0,
      orders: d._count.id
    })));
  } catch (error) {
    console.error("Distribution error:", error);
    return c.json({ error: "Failed to fetch distribution data" }, 500);
  }
})

// Category Breakdown
// .get('/categories', async (c) => {
//     try {
//       const data = await db.$queryRaw<
//         { category: string; items_sold: bigint; revenue: number }[]
//       >`
//         SELECT c.label as category, 
//           SUM(oi.quantity) as items_sold,
//           SUM(oi.price * oi.quantity) as revenue
//         FROM "order_items" oi  // Changed from OrderItem
//         JOIN "products" p ON oi."productId" = p.id
//         JOIN "Category" c ON p."categoryId" = c.id
//         GROUP BY c.label
//       `;
  
//       return c.json(data.map(d => ({
//         category: d.category,
//         itemsSold: Number(d.items_sold),
//         revenue: Number(d.revenue)
//       })));
//     } catch (error) {
//       console.error("Categories error:", error);
//       return c.json({ error: "Failed to fetch category data" }, 500);
//     }
//   })

// Inventory Turnover
.get('/inventory-turnover',sessionMiddleware, async (c) => {
  const user =c.get("user");
  if(!user || user.role !== "ADMIN"){
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
    try {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
  
      const [sales, startingInventory, endingInventory] = await Promise.all([
        db.orderItem.aggregate({
          _sum: { quantity: true },
          where: { createdAt: { gte: startOfYear } }
        }),
        db.product.aggregate({ _sum: { stock: true } }),
        db.product.aggregate({ _sum: { stock: true } })
      ]);
  
      const totalSales = sales._sum.quantity || 0;
      const avgInventory = ((startingInventory._sum.stock || 0) + (endingInventory._sum.stock || 0)) / 2 || 1;
  
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
  if(!user || user.role !== "ADMIN"){
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    const [totalCarts, convertedCarts] = await Promise.all([
      db.cart.count(),
      db.cart.count({
        where: { user: { Order: { some: {} } } }
      })
    ]);

    const abandonmentRate = totalCarts > 0 
      ? ((totalCarts - convertedCarts) / totalCarts) * 100 
      : 0;

    return c.json({ 
      abandonmentRate: Number(abandonmentRate.toFixed(2)),
      totalCarts,
      convertedCarts
    });
  } catch (error) {
    console.error("Abandonment rate error:", error);
    return c.json({ error: "Failed to calculate abandonment rate" }, 500);
  }
})

// Cohort Retention
.get('/cohort',sessionMiddleware, async (c) => {
  const user =c.get("user");
  if(!user || user.role !== "ADMIN"){
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    // SQLite (D1) has no DATE_TRUNC/INTERVAL; aggregate in JS instead.
    const users = await db.user.findMany({
      select: { id: true, createdAt: true, Order: { select: { createdAt: true } } },
    });

    const buckets: Record<string, { total: number; retained: number }> = {};
    for (const u of users) {
      const month = u.createdAt.toISOString().slice(0, 7); // YYYY-MM
      buckets[month] ??= { total: 0, retained: 0 };
      buckets[month].total++;
      const limit = new Date(u.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      const retained = u.Order.some(
        (o: { createdAt: Date }) => o.createdAt >= u.createdAt && o.createdAt <= limit
      );
      if (retained) buckets[month].retained++;
    }

    const cohorts = Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        cohortMonth: new Date(`${month}-01T00:00:00.000Z`).toISOString(),
        totalUsers: v.total,
        retainedUsers: v.retained,
        retentionRate: v.total > 0 ? (v.retained / v.total) * 100 : 0,
      }));

    return c.json(cohorts);
  } catch (error) {
    console.error("Cohort error:", error);
    return c.json({ error: "Failed to fetch cohort data" }, 500);
  }
})

// Delivery Times
// .get('/delivery-times', async (c) => {
//     try {
//       const data = await db.$queryRaw<
//         { status: string; avg_hours: number }[]
//       >`
//         SELECT 
//           ote.status,
//           AVG(EXTRACT(EPOCH FROM (ote."createdAt" - o."createdAt")) / 3600) as avg_hours
//         FROM "order_timeline_events" ote  // Changed from OrderTimelineEvent
//         JOIN "orders" o ON ote."orderId" = o.id
//         GROUP BY ote.status
//       `;
  
//       return c.json(data.map(d => ({
//         status: d.status,
//         avgHours: Number(Number(d.avg_hours).toFixed(1))
//       })));
//     } catch (error) {
//       console.error("Delivery times error:", error);
//       return c.json({ error: "Failed to fetch delivery times" }, 500);
//     }
//   })
// Spending Clusters
.get('/spending-clusters',sessionMiddleware, async (c) => {
  const user =c.get("user");
  if(!user || user.role !== "ADMIN"){
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    const segments = await db.$queryRaw<
      { segment: string; customers: bigint }[]
    >`
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
    `;

    return c.json(segments.map(s => ({
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

    // SQLite (D1) has no DATE_TRUNC; bucket in JS.
    const rows = await db.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const truncate = (d: Date): Date => {
      const t = new Date(d);
      t.setUTCHours(0, 0, 0, 0);
      if (period === "week") {
        const day = t.getUTCDay(); // 0=Sun
        const diff = (day + 6) % 7; // days since Monday
        t.setUTCDate(t.getUTCDate() - diff);
      } else if (period === "month") {
        t.setUTCDate(1);
      } else if (period === "year") {
        t.setUTCMonth(0, 1);
      }
      return t;
    };

    const buckets: Record<string, number> = {};
    for (const u of rows) {
      const key = truncate(u.createdAt).toISOString();
      buckets[key] = (buckets[key] || 0) + 1;
    }

    return c.json(
      Object.entries(buckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }))
    );
  } catch (error) {
    console.error("Acquisition error:", error);
    return c.json({ error: "Failed to fetch acquisition data" }, 500);
  }
})
.get('/most-purchased',sessionMiddleware, async (c) => {
  const user =c.get("user");
  if(!user || user.role !== "ADMIN"){
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
    try {
      const data = await db.$queryRaw<
        Array<{
          productId: string;
          productName: string;
          productImages: string;
          totalSold: bigint;
        }>
      >`
        SELECT
          p.id as "productId",
          p."productName",
          p."productImages",
          SUM(oi.quantity) as "totalSold"
        FROM "order_items" oi
        JOIN "products" p ON oi."productId" = p.id
        GROUP BY p.id
        ORDER BY "totalSold" DESC
        LIMIT 5
      `;

      return c.json(data.map(item => ({
        ...item,
        totalSold: Number(item.totalSold),
        productImages: parseStringArray(item.productImages)
      })));
    } catch (error) {
      console.error("Most purchased error:", error);
      return c.json({ error: "Failed to fetch most purchased products" }, 500);
    }
  })

  .get('/most-wishlisted',sessionMiddleware, async (c) => {
    const user =c.get("user");
    if(!user || user.role !== "ADMIN"){
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }
    
    try {
      const data = await db.$queryRaw<
        Array<{
          productId: string;
          productName: string;
          productImages: string;
          wishlistCount: bigint;
        }>
      >`
        SELECT
          p.id as "productId",
          p."productName",
          p."productImages",
          COUNT(wi."productId") as "wishlistCount"
        FROM "wishlist_items" wi
        JOIN "products" p ON wi."productId" = p.id
        GROUP BY p.id
        ORDER BY "wishlistCount" DESC
        LIMIT 5
      `;

      return c.json(data.map(item => ({
        ...item,
        wishlistCount: Number(item.wishlistCount),
        productImages: parseStringArray(item.productImages)
      })));
    } catch (error) {
      console.error("Most wishlisted error:", error);
      return c.json({ error: "Failed to fetch most wishlisted products" }, 500);
    }
  })
  

export default app;
