import { sessionMiddleware } from "@/lib/session-middleware";
import { Hono } from "hono";
import { z } from "zod";
import { isServiceError } from "@/lib/service-error";
import { addToCart, updateCartItem, removeCartItem, getCart } from "./cart.service";

const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1),
  size: z.string().optional(),
  color: z.string().optional(),
});

const app = new Hono()

  .post("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const parsed = addToCartSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    try {
      return c.json(await addToCart(user.id, parsed.data));
    } catch (error) {
      if (isServiceError(error)) return c.json({ error: error.message }, error.status);
      console.error("Add to cart error:", error);
      return c.json({ error: "Failed to add to cart" }, 500);
    }
  })

  .put("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const parsed = z
      .object({ cartItemId: z.string(), quantity: z.number().min(1) })
      .safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    try {
      return c.json(await updateCartItem(user.id, parsed.data.cartItemId, parsed.data.quantity));
    } catch (error) {
      if (isServiceError(error)) return c.json({ error: error.message }, error.status);
      console.error("Update cart error:", error);
      return c.json({ error: "Failed to update cart item" }, 500);
    }
  })

  .delete("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const parsed = z.object({ cartItemId: z.string() }).safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    try {
      return c.json(await removeCartItem(user.id, parsed.data.cartItemId));
    } catch (error) {
      if (isServiceError(error)) return c.json({ error: error.message }, error.status);
      console.error("Delete cart error:", error);
      return c.json({ error: "Failed to remove cart item" }, 500);
    }
  })

  .get("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
      return c.json(await getCart(user.id));
    } catch (error) {
      console.error("Fetch cart error:", error);
      return c.json({ error: "Failed to fetch cart items" }, 500);
    }
  });

export default app;
