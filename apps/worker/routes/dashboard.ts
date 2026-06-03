import { Hono } from "hono";
import { sessionMiddleware } from "../middleware/session";
import { requireAdmin, requireRole } from "../middleware/rbac";
import { isServiceError } from "../utils/service-error";
import { createProduct, updateProduct, deleteProduct } from "../services/dashboard.service";

const app = new Hono();

app
  .post("/upload", sessionMiddleware, requireAdmin, async (c) => {
    try {
      const product = await createProduct(await c.req.formData());
      return c.json({ success: true, product }, 201);
    } catch (error) {
      if (isServiceError(error)) return c.json({ success: false, error: error.message }, error.status);
      console.error("Error creating product:", error);
      return c.json(
        { success: false, error: error instanceof Error ? error.message : "Failed to create product" },
        400,
      );
    }
  })

  .put("/update", sessionMiddleware, requireAdmin, async (c) => {
    try {
      const product = await updateProduct(await c.req.formData());
      return c.json({ success: true, product }, 200);
    } catch (error) {
      if (isServiceError(error)) return c.json({ success: false, error: error.message }, error.status);
      console.error("Error updating product:", error);
      return c.json(
        { success: false, error: error instanceof Error ? error.message : "Update failed" },
        400,
      );
    }
  });

app.delete("/:id", sessionMiddleware, requireRole("ADMIN", "MODERATOR"), async (c) => {
  try {
    return c.json(await deleteProduct(c.req.param("id")));
  } catch (error) {
    if (isServiceError(error)) return c.json({ error: error.message }, error.status);
    console.error("Error deleting product:", error);
    return c.json({ error: "Failed to delete product" }, 500);
  }
});

export default app;
