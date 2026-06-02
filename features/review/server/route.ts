import { sessionMiddleware } from "@/lib/session-middleware";
import { Hono } from "hono";
import { reviewSchema, updateReviewSchema } from "../schema";
import db from '@/lib/db';
import { zValidator } from "@hono/zod-validator";

const app = new Hono()
  .post("/", sessionMiddleware, async (c) => {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json(
          { success: false, error: "User must be logged in to review" }, 
          403
        );
      }

      const body = await c.req.json();
      const validation = reviewSchema.safeParse(body);
      
      if (!validation.success) {
        return c.json(
          { success: false, errors: validation.error.issues },
          400
        );
      }

      const { productId, rating, comment } = validation.data;

      const product = await db.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return c.json(
          { success: false, error: "Product not found" },
          404
        );
      }

      const newReview = await db.review.create({
        data: {
          comment,
          rating,
          userId: user.id,
          productId,
        },
        select: {
          id: true,
          comment: true,
          rating: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return c.json(
        { success: true, data: newReview },
        201
      );

    } catch (error) {
      console.error("Review creation error:", error);
      return c.json(
        { success: false, error: "Internal server error" },
        500
      );
    }
  })
// app/api/reviews/route.ts
.put("/:reviewId",  zValidator('json', updateReviewSchema), sessionMiddleware, async (c) => {
  try {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const reviewId = c.req.param("reviewId");
    const { rating, comment } = await c.req.json();
    
    // Add validation
    const validation = updateReviewSchema.safeParse({ rating, comment });
    if (!validation.success) {
      return c.json({ 
        success: false, 
        errors: validation.error.issues 
      }, 400);
    }

    const existingReview = await db.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return c.json({ success: false, error: "Review not found" }, 404);
    }

    if (existingReview.userId !== user.id) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }

    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: {
        rating: validation.data.rating,
        comment: validation.data.comment,
      },
    });

    return c.json({ success: true, data: updatedReview });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
})
  .delete("/:reviewId", sessionMiddleware, async (c) => {
    try {
      const user = c.get("user");
      if (!user) return c.json({ error: "Unauthorized" }, 401);
  
      const reviewId = c.req.param("reviewId");
  
      const existingReview = await db.review.findUnique({
        where: { id: reviewId },
      });
  
      if (!existingReview) {
        return c.json({ error: "Review not found" }, 404);
      }
  
      if (existingReview.userId !== user.id && user.role !== "ADMIN") {
        return c.json({ error: "Forbidden" }, 403);
      }
  
      await db.review.delete({ where: { id: reviewId } });
  
      return c.json({ success: true });
    } catch (error) {
      console.error(error);
      return c.json({ error: "Internal server error" }, 500);
    }
  });
  
export default app;