import { sessionMiddleware } from "../middleware/session";
import { Hono } from "hono";
import { z } from "zod";
import { isServiceError } from "../utils/service-error";
import { addToWishlist, getWishlist, removeFromWishlist } from "../services/wishlist.service";

const WishlistSchema = z.object({ productId: z.string().min(1) });

const app = new Hono()

  .post("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "UnAuthorized" }, 403);

    const parsed = WishlistSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ success: false, error: "invalid Input" }, 400);

    return c.json(await addToWishlist(user.id, parsed.data.productId));
  })

  .get("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 403);

    return c.json(await getWishlist(user.id));
  })

  .delete("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 403);

    const parsed = WishlistSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ success: false, error: "Invalid input" }, 400);

    try {
      return c.json(await removeFromWishlist(user.id, parsed.data.productId));
    } catch (error) {
      if (isServiceError(error)) return c.json({ success: false, error: error.message }, error.status);
      throw error;
    }
  });

export default app;
