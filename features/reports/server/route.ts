import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import { db } from "@/db";
import { orders, orderItems, products, expenses } from "@/db/schema";
import { eq, ne, and, gte, lte, desc, sum, count, isNotNull, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

const BREAKDOWN_LIMIT = 200;

const app = new Hono().get(
  "/",
  sessionMiddleware,
  zValidator(
    "query",
    z.object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !hasPermission(user, PERMISSIONS.VIEW_ANALYTICS))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { from, to } = c.req.valid("query");

    // Normalize to full-day boundaries so "Today" covers the whole day
    let fromDate: Date | undefined;
    if (from) {
      const d = new Date(from);
      if (!isNaN(d.getTime())) {
        d.setHours(0, 0, 0, 0);
        fromDate = d;
      }
    }
    let toDate: Date | undefined;
    if (to) {
      const d = new Date(to);
      if (!isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        toDate = d;
      }
    }

    const orderConditions: SQL[] = [ne(orders.status, "CANCELLED")];
    if (fromDate) orderConditions.push(gte(orders.createdAt, fromDate));
    if (toDate) orderConditions.push(lte(orders.createdAt, toDate));
    const orderWhere = and(...orderConditions);

    const expenseConditions: SQL[] = [];
    if (fromDate) expenseConditions.push(gte(expenses.date, fromDate));
    if (toDate) expenseConditions.push(lte(expenses.date, toDate));
    const expenseWhere = expenseConditions.length ? and(...expenseConditions) : undefined;

    const monthOf = (column: AnyPgColumn) =>
      sql<string>`TO_CHAR(DATE_TRUNC('month', ${column}), 'YYYY-MM')`;

    const itemCost = sql<number>`SUM(${orderItems.quantity} * COALESCE(${orderItems.costPrice}, 0))`;

    const [orderTotals, costTotals, expenseTotals, monthlyOrders, monthlyCosts, monthlyExpenses, productCostBreakdown] =
      await Promise.all([
        db.select({
            revenue: sum(orders.totalAmount),
            shipping: sum(orders.shippingCost),
            orders: count(),
          })
          .from(orders)
          .where(orderWhere),
        db.select({ cost: itemCost })
          .from(orderItems)
          .innerJoin(orders, eq(orderItems.orderId, orders.id))
          .where(orderWhere),
        db.select({ sum: sum(expenses.amount) })
          .from(expenses)
          .where(expenseWhere),
        db.select({
            month: monthOf(orders.createdAt),
            revenue: sum(orders.totalAmount),
            shippingCost: sum(orders.shippingCost),
          })
          .from(orders)
          .where(orderWhere)
          .groupBy(monthOf(orders.createdAt)),
        db.select({
            month: monthOf(orders.createdAt),
            cost: itemCost,
          })
          .from(orderItems)
          .innerJoin(orders, eq(orderItems.orderId, orders.id))
          .where(orderWhere)
          .groupBy(monthOf(orders.createdAt)),
        db.select({
            month: monthOf(expenses.date),
            expense: sum(expenses.amount),
          })
          .from(expenses)
          .where(expenseWhere)
          .groupBy(monthOf(expenses.date)),
        db.select({
            orderId: orders.id,
            orderNumber: orders.orderNumber,
            productName: products.name,
            quantity: orderItems.quantity,
            costPrice: orderItems.costPrice,
            totalItemCost: sql<number>`${orderItems.quantity} * ${orderItems.costPrice}`,
            date: orders.createdAt,
          })
          .from(orderItems)
          .innerJoin(orders, eq(orderItems.orderId, orders.id))
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(and(orderWhere, isNotNull(orderItems.costPrice)))
          .orderBy(desc(orders.createdAt))
          .limit(BREAKDOWN_LIMIT),
      ]);

    const totalRevenue = Number(orderTotals[0]?.revenue || 0);
    const totalShippingCost = Number(orderTotals[0]?.shipping || 0);
    const orderCount = Number(orderTotals[0]?.orders || 0);
    const totalCost = Number(costTotals[0]?.cost || 0);
    const totalExpenseAmount = Number(expenseTotals[0]?.sum || 0);
    const netProfit = totalRevenue - (totalCost + totalShippingCost + totalExpenseAmount);

    // Merge the three monthly result sets on 'YYYY-MM'
    const monthlyMap: Record<string, { month: string; revenue: number; cost: number; shippingCost: number; expense: number; profit: number }> = {};
    const initMonth = (month: string) => {
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, revenue: 0, cost: 0, shippingCost: 0, expense: 0, profit: 0 };
      }
      return monthlyMap[month];
    };

    for (const row of monthlyOrders) {
      const m = initMonth(row.month);
      m.revenue = Number(row.revenue || 0);
      m.shippingCost = Number(row.shippingCost || 0);
    }
    for (const row of monthlyCosts) {
      initMonth(row.month).cost = Number(row.cost || 0);
    }
    for (const row of monthlyExpenses) {
      initMonth(row.month).expense = Number(row.expense || 0);
    }

    const monthlyData = Object.values(monthlyMap)
      .map((m) => ({ ...m, profit: m.revenue - (m.cost + m.shippingCost + m.expense) }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return c.json({
      totalRevenue,
      totalCost,
      totalShippingCost,
      totalExpense: totalExpenseAmount,
      netProfit,
      orderCount,
      monthlyData,
      productCostBreakdown: productCostBreakdown.map((item) => ({
        ...item,
        productName: item.productName || "Unknown Product",
        costPrice: Number(item.costPrice || 0),
        totalItemCost: Number(item.totalItemCost || 0),
      })),
      breakdownTruncated: productCostBreakdown.length === BREAKDOWN_LIMIT,
    });
  }
);

export default app;
