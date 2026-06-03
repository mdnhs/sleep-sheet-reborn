import { Hono } from "hono";
import { sessionMiddleware } from "../middleware/session";
import { requireAdmin } from "../middleware/rbac";
import * as analytics from "../services/analytics.service";

const fail = (label: string, error: unknown, message: string) => {
  console.error(`${label}:`, error);
  return message;
};

const app = new Hono()

  .get("/sales-overview", sessionMiddleware, requireAdmin, async (c) => {
    try {
      const { period = "month" } = c.req.query();
      return c.json(await analytics.getSalesOverview(period));
    } catch (error) {
      return c.json({ error: fail("Sales overview error", error, "Failed to fetch sales data") }, 500);
    }
  })

  .get("/clv", sessionMiddleware, requireAdmin, async (c) => {
    try {
      return c.json(await analytics.getCustomerLifetimeValue());
    } catch (error) {
      return c.json({ error: fail("CLV error", error, "Failed to calculate CLV") }, 500);
    }
  })

  .get("/distribution", sessionMiddleware, requireAdmin, async (c) => {
    try {
      return c.json(await analytics.getGeographicDistribution());
    } catch (error) {
      return c.json({ error: fail("Distribution error", error, "Failed to fetch distribution data") }, 500);
    }
  })

  .get("/inventory-turnover", sessionMiddleware, requireAdmin, async (c) => {
    try {
      return c.json(await analytics.getInventoryTurnover());
    } catch (error) {
      return c.json({ error: fail("Inventory turnover error", error, "Failed to calculate inventory turnover") }, 500);
    }
  })

  .get("/abandonment", sessionMiddleware, requireAdmin, async (c) => {
    try {
      return c.json(await analytics.getCartAbandonment());
    } catch (error) {
      return c.json({ error: fail("Abandonment rate error", error, "Failed to calculate abandonment rate") }, 500);
    }
  })

  .get("/cohort", sessionMiddleware, requireAdmin, async (c) => {
    try {
      return c.json(await analytics.getCohortRetention());
    } catch (error) {
      return c.json({ error: fail("Cohort error", error, "Failed to fetch cohort data") }, 500);
    }
  })

  .get("/spending-clusters", sessionMiddleware, requireAdmin, async (c) => {
    try {
      return c.json(await analytics.getSpendingClusters());
    } catch (error) {
      return c.json({ error: fail("Spending clusters error", error, "Failed to fetch customer segments") }, 500);
    }
  })

  .get("/acquisition", async (c) => {
    try {
      const { period = "month" } = c.req.query();
      return c.json(await analytics.getCustomerAcquisition(period));
    } catch (error) {
      return c.json({ error: fail("Acquisition error", error, "Failed to fetch acquisition data") }, 500);
    }
  })

  .get("/most-purchased", sessionMiddleware, requireAdmin, async (c) => {
    try {
      return c.json(await analytics.getMostPurchased());
    } catch (error) {
      return c.json({ error: fail("Most purchased error", error, "Failed to fetch most purchased products") }, 500);
    }
  })

  .get("/most-wishlisted", sessionMiddleware, requireAdmin, async (c) => {
    try {
      return c.json(await analytics.getMostWishlisted());
    } catch (error) {
      return c.json({ error: fail("Most wishlisted error", error, "Failed to fetch most wishlisted products") }, 500);
    }
  });

export default app;
