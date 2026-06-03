import { Hono } from "hono";
import { sessionMiddleware } from "@/lib/session-middleware";
import { requireAdmin } from "@/lib/require-admin";
import { isServiceError } from "@/lib/service-error";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  listCategories,
  createCategory,
  deleteCategory,
  getFeaturedCategories,
} from "./categories.service";

const app = new Hono()

  .get("/", async (c) => {
    try {
      return c.json(await listCategories());
    } catch (error) {
      console.error("Failed to fetch Categories", error);
      return c.json({ error: "failed to fetch Categories" }, 500);
    }
  })

  .post(
    "/create",
    sessionMiddleware,
    requireAdmin,
    zValidator(
      "json",
      z.object({
        label: z.string().min(2).max(50),
        value: z.string().min(2).max(50),
        parentId: z.string().optional().nullable(),
      }),
    ),
    async (c) => {
      try {
        return c.json(await createCategory(c.req.valid("json")), 201);
      } catch (error) {
        if (isServiceError(error)) return c.json({ error: error.message }, error.status);
        console.error("Failed to create category", error);
        return c.json({ error: "Failed to create category" }, 500);
      }
    },
  )

  .delete("/delete/:value", sessionMiddleware, requireAdmin, async (c) => {
    try {
      return c.json(await deleteCategory(c.req.param("value")), 200);
    } catch (error) {
      if (isServiceError(error)) return c.json({ success: false, error: error.message }, error.status);
      console.error("Failed to delete category", error);
      return c.json({ success: false, error: "Failed to delete category" }, 500);
    }
  })

  .get("/category", async (c) => {
    try {
      return c.json(await getFeaturedCategories());
    } catch (error) {
      console.error("Failed to fetch featured categories:", error);
      return c.json({ success: false, error: "Internal Server Error" }, 500);
    }
  });

export default app;
