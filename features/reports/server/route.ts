import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import { db } from "@/db";
import { orders, orderItems, products, expenses, expenseCategories, users } from "@/db/schema";
import { eq, ne, and, gte, lte, desc, sum, count, isNotNull, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

const BREAKDOWN_LIMIT = 200;

const app = new Hono()
  .get(
    "/monthly",
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

      let fromDate: Date | undefined;
      if (from) {
        const d = new Date(from);
        if (!isNaN(d.getTime())) {
          if (!from.includes("T")) {
            d.setHours(0, 0, 0, 0);
          }
          fromDate = d;
        }
      }
      let toDate: Date | undefined;
      if (to) {
        const d = new Date(to);
        if (!isNaN(d.getTime())) {
          if (!to.includes("T")) {
            d.setHours(23, 59, 59, 999);
          }
          toDate = d;
        }
      }

      const orderConditions: SQL[] = [
        ne(orders.status, "CANCELLED"),
        ne(orders.status, "REFUNDED"),
      ];
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

      const [monthlyOrders, monthlyCosts, monthlyExpenses] = await Promise.all([
        db.select({
            month: monthOf(orders.createdAt),
            revenue: sum(sql<number>`${orders.totalAmount} - COALESCE(${orders.refundedAmount}, 0)`),
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
      ]);

      const monthlyMap: Record<string, { month: string; revenue: number; cost: number; shippingCost: number; expense: number; profit: number }> = {};
      const initMonth = (month: string) => {
        if (!monthlyMap[month]) {
          monthlyMap[month] = { month, revenue: 0, cost: 0, shippingCost: 0, expense: 0, profit: 0 };
        }
        return monthlyMap[month];
      };

      for (const row of monthlyOrders) {
        if (!row.month) continue;
        const m = initMonth(row.month);
        m.revenue = Number(row.revenue || 0);
        m.shippingCost = Number(row.shippingCost || 0);
      }
      for (const row of monthlyCosts) {
        if (!row.month) continue;
        initMonth(row.month).cost = Number(row.cost || 0);
      }
      for (const row of monthlyExpenses) {
        if (!row.month) continue;
        initMonth(row.month).expense = Number(row.expense || 0);
      }

      const monthlyData = Object.values(monthlyMap)
        .map((m) => ({ ...m, profit: m.revenue - (m.cost + m.shippingCost + m.expense) }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return c.json({ monthlyData });
    }
  )
  .get(
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
          if (!from.includes("T")) {
            d.setHours(0, 0, 0, 0);
          }
          fromDate = d;
        }
      }
      let toDate: Date | undefined;
      if (to) {
        const d = new Date(to);
        if (!isNaN(d.getTime())) {
          if (!to.includes("T")) {
            d.setHours(23, 59, 59, 999);
          }
          toDate = d;
        }
      }

      const orderConditions: SQL[] = [
        ne(orders.status, "CANCELLED"),
        ne(orders.status, "REFUNDED"),
      ];
      if (fromDate) orderConditions.push(gte(orders.createdAt, fromDate));
      if (toDate) orderConditions.push(lte(orders.createdAt, toDate));
      const orderWhere = and(...orderConditions);

      const cancelledConditions: SQL[] = [eq(orders.status, "CANCELLED")];
      if (fromDate) cancelledConditions.push(gte(orders.createdAt, fromDate));
      if (toDate) cancelledConditions.push(lte(orders.createdAt, toDate));
      const cancelledWhere = and(...cancelledConditions);

      const returnedConditions: SQL[] = [
        sql`(${orders.status} = 'REFUNDED' OR (${orders.refundedAmount} IS NOT NULL AND ${orders.refundedAmount} > 0))`,
      ];
      if (fromDate) returnedConditions.push(gte(orders.createdAt, fromDate));
      if (toDate) returnedConditions.push(lte(orders.createdAt, toDate));
      const returnedWhere = and(...returnedConditions);

      const expenseConditions: SQL[] = [];
      if (fromDate) expenseConditions.push(gte(expenses.date, fromDate));
      if (toDate) expenseConditions.push(lte(expenses.date, toDate));
      const expenseWhere = expenseConditions.length ? and(...expenseConditions) : undefined;

      const itemCost = sql<number>`SUM(${orderItems.quantity} * COALESCE(${orderItems.costPrice}, 0))`;

      const [
        orderTotals, 
        costTotals, 
        expenseTotals, 
        cancelledTotals,
        returnedTotals,
        allOrdersTotals,
        allCostsTotals,
        productCostBreakdown,
        revenueBreakdown,
        shippingBreakdown,
        expenseBreakdown,
        cancelledBreakdown,
        returnedBreakdown,
      ] =
        await Promise.all([
          db.select({
              revenue: sum(sql<number>`${orders.totalAmount} - COALESCE(${orders.refundedAmount}, 0)`),
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
              count: count(),
              amount: sum(orders.totalAmount),
            })
            .from(orders)
            .where(cancelledWhere),
          db.select({
              count: count(),
              amount: sum(sql<number>`COALESCE(${orders.refundedAmount}, ${orders.totalAmount})`),
            })
            .from(orders)
            .where(returnedWhere),
          db.select({
              amount: sum(orders.totalAmount),
            })
            .from(orders),
          db.select({ cost: itemCost })
            .from(orderItems),
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
          db.select({
              orderId: orders.id,
              orderNumber: orders.orderNumber,
              customerName: sql<string>`COALESCE(${users.name}, ${orders.guestName}, 'Guest')`,
              date: orders.createdAt,
              totalAmount: sql<number>`${orders.totalAmount} - COALESCE(${orders.refundedAmount}, 0)`,
            })
            .from(orders)
            .leftJoin(users, eq(orders.userId, users.id))
            .where(orderWhere)
            .orderBy(desc(orders.createdAt))
            .limit(BREAKDOWN_LIMIT),
          db.select({
              orderId: orders.id,
              orderNumber: orders.orderNumber,
              customerName: sql<string>`COALESCE(${users.name}, ${orders.guestName}, 'Guest')`,
              date: orders.createdAt,
              shippingCost: orders.shippingCost,
            })
            .from(orders)
            .leftJoin(users, eq(orders.userId, users.id))
            .where(and(orderWhere, sql`${orders.shippingCost} > 0`))
            .orderBy(desc(orders.createdAt))
            .limit(BREAKDOWN_LIMIT),
          db.select({
              id: expenses.id,
              date: expenses.date,
              amount: expenses.amount,
              category: expenseCategories.name,
              description: expenses.note,
            })
            .from(expenses)
            .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
            .where(expenseWhere)
            .orderBy(desc(expenses.date))
            .limit(BREAKDOWN_LIMIT),
          db.select({
              orderId: orders.id,
              orderNumber: orders.orderNumber,
              date: orders.createdAt,
              totalAmount: orders.totalAmount,
              reason: orders.cancellationReason,
            })
            .from(orders)
            .where(cancelledWhere)
            .orderBy(desc(orders.createdAt))
            .limit(BREAKDOWN_LIMIT),
          db.select({
              orderId: orders.id,
              orderNumber: orders.orderNumber,
              date: orders.createdAt,
              refundedAmount: sql<number>`COALESCE(${orders.refundedAmount}, ${orders.totalAmount})`,
              reason: orders.refundReason,
            })
            .from(orders)
            .where(returnedWhere)
            .orderBy(desc(orders.createdAt))
            .limit(BREAKDOWN_LIMIT),
        ]);

      const totalRevenue = Number(orderTotals[0]?.revenue || 0);
      const totalShippingCost = Number(orderTotals[0]?.shipping || 0);
      const orderCount = Number(orderTotals[0]?.orders || 0);
      const totalCost = Number(costTotals[0]?.cost || 0);
      const totalExpenseAmount = Number(expenseTotals[0]?.sum || 0);
      const cancelledCount = Number(cancelledTotals[0]?.count || 0);
      const cancelledAmount = Number(cancelledTotals[0]?.amount || 0);
      const returnedCount = Number(returnedTotals[0]?.count || 0);
      const returnedAmount = Number(returnedTotals[0]?.amount || 0);
      const grossSales = Number(allOrdersTotals[0]?.amount || 0);
      const grossCost = Number(allCostsTotals[0]?.cost || 0);
      const cancelledCost = grossCost - totalCost;

      const grossProfit = totalRevenue - (totalCost + totalShippingCost);
      const netProfit = grossProfit - totalExpenseAmount;

      return c.json({
        totalRevenue,
        grossSales,
        totalCost,
        grossCost,
        cancelledCost,
        totalShippingCost,
        grossProfit,
        totalExpense: totalExpenseAmount,
        netProfit,
        orderCount,
        cancelledCount,
        cancelledAmount,
        returnedCount,
        returnedAmount,
        productCostBreakdown: productCostBreakdown.map((item) => ({
          ...item,
          productName: item.productName || "Unknown Product",
          costPrice: Number(item.costPrice || 0),
          totalItemCost: Number(item.totalItemCost || 0),
        })),
        revenueBreakdown: revenueBreakdown.map(item => ({ ...item, totalAmount: Number(item.totalAmount || 0) })),
        shippingBreakdown: shippingBreakdown.map(item => ({ ...item, shippingCost: Number(item.shippingCost || 0) })),
        expenseBreakdown: expenseBreakdown.map(item => ({ ...item, amount: Number(item.amount || 0) })),
        cancelledBreakdown: cancelledBreakdown.map(item => ({ ...item, totalAmount: Number(item.totalAmount || 0) })),
        returnedBreakdown: returnedBreakdown.map(item => ({ ...item, refundedAmount: Number(item.refundedAmount || 0) })),
        breakdownTruncated: productCostBreakdown.length === BREAKDOWN_LIMIT || revenueBreakdown.length === BREAKDOWN_LIMIT || shippingBreakdown.length === BREAKDOWN_LIMIT || expenseBreakdown.length === BREAKDOWN_LIMIT,
      });
    }
  );

export default app;
