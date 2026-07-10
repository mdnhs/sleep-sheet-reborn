import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import { db } from "@/db";
import { orders, orderItems, expenses } from "@/db/schema";
import { eq, and, gte, lte, isNotNull } from "drizzle-orm";

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
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { from, to } = c.req.valid("query");

    // Fetch all non-cancelled orders
    const allOrders = await db.query.orders.findMany({
      with: {
        items: true,
      },
    });

    let filteredOrders = allOrders.filter(o => o.status !== "CANCELLED");

    // Fetch all expenses
    const allExpenses = await db.query.expenses.findMany();
    let filteredExpenses = allExpenses;

    if (from) {
      const fromDate = new Date(from);
      filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) >= fromDate);
      filteredExpenses = filteredExpenses.filter(e => new Date(e.date) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) <= toDate);
      filteredExpenses = filteredExpenses.filter(e => new Date(e.date) <= toDate);
    }

    let totalRevenue = 0;
    let totalCost = 0;
    let totalShippingCost = 0;
    
    // Grouping by month YYYY-MM
    const monthlyMap: Record<string, { month: string; revenue: number; cost: number; shippingCost: number; expense: number; profit: number }> = {};

    const getMonthKey = (dateStr: string | Date) => {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    };

    const initMonth = (monthKey: string) => {
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, revenue: 0, cost: 0, shippingCost: 0, expense: 0, profit: 0 };
      }
    };

    for (const order of filteredOrders) {
      const monthKey = getMonthKey(order.createdAt);
      initMonth(monthKey);

      totalRevenue += order.totalAmount;
      totalShippingCost += order.shippingCost || 0;
      
      monthlyMap[monthKey].revenue += order.totalAmount;
      monthlyMap[monthKey].shippingCost += order.shippingCost || 0;

      let orderCost = 0;
      for (const item of order.items) {
        if (item.costPrice) {
          const itemTotalCost = item.costPrice * item.quantity;
          totalCost += itemTotalCost;
          orderCost += itemTotalCost;
        }
      }
      monthlyMap[monthKey].cost += orderCost;
    }

    let totalExpenseAmount = 0;
    for (const expense of filteredExpenses) {
      const monthKey = getMonthKey(expense.date);
      initMonth(monthKey);

      totalExpenseAmount += expense.amount;
      monthlyMap[monthKey].expense += expense.amount;
    }

    const netProfit = totalRevenue - (totalCost + totalShippingCost + totalExpenseAmount);

    // Calculate profit for each month
    const monthlyData = Object.values(monthlyMap).map(m => {
      m.profit = m.revenue - (m.cost + m.shippingCost + m.expense);
      return m;
    });

    // Sort monthly data chronologically
    monthlyData.sort((a, b) => a.month.localeCompare(b.month));

    return c.json({
      totalRevenue,
      totalCost,
      totalShippingCost,
      totalExpense: totalExpenseAmount,
      netProfit,
      orderCount: filteredOrders.length,
      monthlyData,
    });
  }
);

export default app;
