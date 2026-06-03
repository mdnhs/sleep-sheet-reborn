import { Hono } from "hono";
import type { Context } from "hono";
import { sessionMiddleware } from "@/lib/session-middleware";
import { requireRole } from "@/lib/require-admin";
import { isServiceError } from "@/lib/service-error";
import { zValidator } from "@hono/zod-validator";
import {
  StockInSchema,
  StockOutSchema,
  AdjustSchema,
  DamageLossSchema,
} from "@/features/inventory/schema";
import {
  stockIn,
  stockOut,
  adjustStock,
  recordDamageLoss,
  getInventorySummary,
  listStock,
  listLowStock,
  getProductInventory,
  listMovements,
  listExpiring,
  listBatches,
} from "./inventory.service";

const requireStaff = requireRole("ADMIN", "MODERATOR");

function fail(c: Context, error: unknown, msg: string) {
  if (isServiceError(error)) return c.json({ success: false, error: error.message }, error.status);
  console.error(msg, error);
  return c.json({ success: false, error: msg }, 500);
}

function userId(c: Context): string | undefined {
  return c.get("user")?.id;
}

const app = new Hono()

  .get("/summary", sessionMiddleware, requireStaff, async (c) => {
    try {
      return c.json(await getInventorySummary());
    } catch (error) {
      return fail(c, error, "Failed to load inventory summary");
    }
  })

  .get("/stock", sessionMiddleware, requireStaff, async (c) => {
    try {
      return c.json(
        await listStock({ search: c.req.query("search"), status: c.req.query("status") }),
      );
    } catch (error) {
      return fail(c, error, "Failed to load stock");
    }
  })

  .get("/low-stock", sessionMiddleware, requireStaff, async (c) => {
    try {
      return c.json(await listLowStock());
    } catch (error) {
      return fail(c, error, "Failed to load low stock");
    }
  })

  .get("/expiring", sessionMiddleware, requireStaff, async (c) => {
    try {
      const days = parseInt(c.req.query("days") || "30", 10) || 30;
      return c.json(await listExpiring(days));
    } catch (error) {
      return fail(c, error, "Failed to load expiring batches");
    }
  })

  .get("/movements", sessionMiddleware, requireStaff, async (c) => {
    try {
      return c.json(
        await listMovements({
          productId: c.req.query("productId"),
          type: c.req.query("type"),
          page: parseInt(c.req.query("page") || "1", 10) || 1,
          limit: parseInt(c.req.query("limit") || "20", 10) || 20,
        }),
      );
    } catch (error) {
      return fail(c, error, "Failed to load movements");
    }
  })

  .get("/batches", sessionMiddleware, requireStaff, async (c) => {
    try {
      const productId = c.req.query("productId");
      if (!productId) return c.json({ success: false, error: "productId is required" }, 400);
      return c.json(await listBatches(productId));
    } catch (error) {
      return fail(c, error, "Failed to load batches");
    }
  })

  .get("/product/:id", sessionMiddleware, requireStaff, async (c) => {
    try {
      return c.json(await getProductInventory(c.req.param("id")));
    } catch (error) {
      return fail(c, error, "Failed to load product inventory");
    }
  })

  .post("/stock-in", sessionMiddleware, requireStaff, zValidator("json", StockInSchema), async (c) => {
    try {
      return c.json(await stockIn(c.req.valid("json"), userId(c)), 201);
    } catch (error) {
      return fail(c, error, "Failed to record stock in");
    }
  })

  .post("/stock-out", sessionMiddleware, requireStaff, zValidator("json", StockOutSchema), async (c) => {
    try {
      return c.json(await stockOut(c.req.valid("json"), userId(c)), 201);
    } catch (error) {
      return fail(c, error, "Failed to record stock out");
    }
  })

  .post("/adjust", sessionMiddleware, requireStaff, zValidator("json", AdjustSchema), async (c) => {
    try {
      return c.json(await adjustStock(c.req.valid("json"), userId(c)), 201);
    } catch (error) {
      return fail(c, error, "Failed to adjust stock");
    }
  })

  .post("/damage-loss", sessionMiddleware, requireStaff, zValidator("json", DamageLossSchema), async (c) => {
    try {
      return c.json(await recordDamageLoss(c.req.valid("json"), userId(c)), 201);
    } catch (error) {
      return fail(c, error, "Failed to record damage/loss");
    }
  });

export default app;
