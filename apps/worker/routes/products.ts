import { Hono } from "hono";
import { isServiceError } from "../utils/service-error";
import { getProductById, listProducts } from "../services/product.service";

const app = new Hono()

  .get("/:id", async (c) => {
    try {
      return c.json(await getProductById(c.req.param("id")), 200);
    } catch (error) {
      if (isServiceError(error)) return c.json({ error: error.message }, error.status);
      console.error(error);
      return c.json({ error: "Failed to fetch product" }, 500);
    }
  })

  .get("/", async (c) => {
    try {
      const result = await listProducts({
        category: c.req.query("category"),
        sort: c.req.query("sort"),
        price: c.req.query("price"),
        search: c.req.query("search"),
        page: parseInt(c.req.query("page") || "1"),
        limit: parseInt(c.req.query("limit") || "8", 10) || 8,
      });
      return c.json(result);
    } catch (error) {
      console.error(error);
      return c.json({ error: "Failed to fetch products" }, 500);
    }
  });

export default app;
