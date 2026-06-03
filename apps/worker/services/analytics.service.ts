import db from "@repo/database";
import { getDateRange, getStartDate } from "../utils/date";
import { parseStringArray } from "@repo/database";

export async function getSalesOverview(period = "month") {
  const { startDate, endDate } = getDateRange(period);

  const [totalRevenue, totalOrders, salesTrend] = await Promise.all([
    db.order.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: startDate, lte: endDate } },
    }),
    db.order.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
    db.order.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true, totalAmount: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const revenue = totalRevenue._sum.totalAmount || 0;
  return {
    totalRevenue: revenue,
    totalOrders,
    aov: totalOrders > 0 ? revenue / totalOrders : 0,
    trendData: salesTrend.map((item) => ({
      date: item.createdAt.toISOString(),
      amount: item.totalAmount,
    })),
  };
}

export async function getCustomerLifetimeValue() {
  const result = await db.order.groupBy({
    by: ["userId"],
    _sum: { totalAmount: true },
    where: { userId: { not: undefined } },
  });

  const valid = result.filter((r) => r._sum.totalAmount && r.userId);
  const averageCLV =
    valid.length > 0
      ? valid.reduce((acc, curr) => acc + (curr._sum.totalAmount || 0), 0) / valid.length
      : 0;

  return { averageCLV };
}

export async function getGeographicDistribution() {
  const data = await db.order.groupBy({
    by: ["shippingState"],
    _sum: { totalAmount: true },
    _count: { id: true },
    where: { shippingState: { not: undefined } },
  });

  return data.map((d) => ({
    state: d.shippingState,
    revenue: d._sum.totalAmount || 0,
    orders: d._count.id,
  }));
}

export async function getInventoryTurnover() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [sales, startingInventory, endingInventory] = await Promise.all([
    db.orderItem.aggregate({ _sum: { quantity: true }, where: { createdAt: { gte: startOfYear } } }),
    db.product.aggregate({ _sum: { stock: true } }),
    db.product.aggregate({ _sum: { stock: true } }),
  ]);

  const totalSales = sales._sum.quantity || 0;
  const avgInventory = ((startingInventory._sum.stock || 0) + (endingInventory._sum.stock || 0)) / 2 || 1;

  return {
    turnoverRate: Number((totalSales / avgInventory).toFixed(2)),
    totalSales,
    avgInventory,
  };
}

export async function getCartAbandonment() {
  const [totalCarts, convertedCarts] = await Promise.all([
    db.cart.count(),
    db.cart.count({ where: { user: { Order: { some: {} } } } }),
  ]);

  const abandonmentRate = totalCarts > 0 ? ((totalCarts - convertedCarts) / totalCarts) * 100 : 0;

  return {
    abandonmentRate: Number(abandonmentRate.toFixed(2)),
    totalCarts,
    convertedCarts,
  };
}

export async function getCohortRetention() {
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
      (o: { createdAt: Date }) => o.createdAt >= u.createdAt && o.createdAt <= limit,
    );
    if (retained) buckets[month].retained++;
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      cohortMonth: new Date(`${month}-01T00:00:00.000Z`).toISOString(),
      totalUsers: v.total,
      retainedUsers: v.retained,
      retentionRate: v.total > 0 ? (v.retained / v.total) * 100 : 0,
    }));
}

export async function getSpendingClusters() {
  const segments = await db.$queryRaw<{ segment: string; customers: bigint }[]>`
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

  return segments.map((s) => ({ segment: s.segment, customers: Number(s.customers) }));
}

export async function getCustomerAcquisition(period = "month") {
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

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

export async function getMostPurchased() {
  const data = await db.$queryRaw<
    Array<{ productId: string; productName: string; productImages: string; totalSold: bigint }>
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

  return data.map((item) => ({
    ...item,
    totalSold: Number(item.totalSold),
    productImages: parseStringArray(item.productImages),
  }));
}

export async function getMostWishlisted() {
  const data = await db.$queryRaw<
    Array<{ productId: string; productName: string; productImages: string; wishlistCount: bigint }>
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

  return data.map((item) => ({
    ...item,
    wishlistCount: Number(item.wishlistCount),
    productImages: parseStringArray(item.productImages),
  }));
}
