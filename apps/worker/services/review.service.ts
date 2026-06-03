import db from "@repo/database";
import { ServiceError } from "../utils/service-error";

export async function createReview(
  userId: string,
  input: { productId: string; rating: number; comment: string },
) {
  const product = await db.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new ServiceError("Product not found", 404);

  return db.review.create({
    data: {
      comment: input.comment,
      rating: input.rating,
      userId,
      productId: input.productId,
    },
    select: {
      id: true,
      comment: true,
      rating: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
    },
  });
}

export async function updateReview(
  userId: string,
  reviewId: string,
  input: { rating: number; comment: string },
) {
  const existingReview = await db.review.findUnique({ where: { id: reviewId } });
  if (!existingReview) throw new ServiceError("Review not found", 404);
  if (existingReview.userId !== userId) throw new ServiceError("Forbidden", 403);

  return db.review.update({
    where: { id: reviewId },
    data: { rating: input.rating, comment: input.comment },
  });
}

export async function deleteReview(
  user: { id: string; role: string },
  reviewId: string,
) {
  const existingReview = await db.review.findUnique({ where: { id: reviewId } });
  if (!existingReview) throw new ServiceError("Review not found", 404);
  if (existingReview.userId !== user.id && user.role !== "ADMIN") {
    throw new ServiceError("Forbidden", 403);
  }

  await db.review.delete({ where: { id: reviewId } });
  return { success: true };
}
