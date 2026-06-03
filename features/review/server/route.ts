import { sessionMiddleware } from "@/lib/session-middleware";
import { Hono } from "hono";
import { reviewSchema, updateReviewSchema } from "../schema";
import { zValidator } from "@hono/zod-validator";
import { isServiceError } from "@/lib/service-error";
import { createReview, updateReview, deleteReview } from "./review.service";

const app = new Hono()

  .post("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ success: false, error: "User must be logged in to review" }, 403);
    }

    const validation = reviewSchema.safeParse(await c.req.json());
    if (!validation.success) {
      return c.json({ success: false, errors: validation.error.issues }, 400);
    }

    try {
      const data = await createReview(user.id, validation.data);
      return c.json({ success: true, data }, 201);
    } catch (error) {
      if (isServiceError(error)) return c.json({ success: false, error: error.message }, error.status);
      console.error("Review creation error:", error);
      return c.json({ success: false, error: "Internal server error" }, 500);
    }
  })

  .put("/:reviewId", zValidator("json", updateReviewSchema), sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
      const data = await updateReview(user.id, c.req.param("reviewId"), c.req.valid("json"));
      return c.json({ success: true, data });
    } catch (error) {
      if (isServiceError(error)) return c.json({ success: false, error: error.message }, error.status);
      console.error(error);
      return c.json({ success: false, error: "Internal server error" }, 500);
    }
  })

  .delete("/:reviewId", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
      return c.json(await deleteReview(user, c.req.param("reviewId")));
    } catch (error) {
      if (isServiceError(error)) return c.json({ error: error.message }, error.status);
      console.error(error);
      return c.json({ error: "Internal server error" }, 500);
    }
  });

export default app;
