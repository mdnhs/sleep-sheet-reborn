import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Product } from "@/lib/types";

/**
 * Fetch and format a single product by id, directly from the database.
 * Shared by the Hono `/api/products/:id` route and the server-rendered
 * product page so both produce the exact same `Product` shape.
 */
export async function getProductById(id: string): Promise<Product | null> {
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      category: true,
      reviews: {
        with: {
          user: true,
        },
      },
      specifications: true,
    },
  });

  if (!product) return null;

  const formattedProduct: Product = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    sku: product.sku,
    tags: product.tags,
    images: product.images,
    category: product.category.value,
    categoryLabel: product.category.label,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    specifications: product.specifications.map((s) => ({
      key: s.key,
      value: s.value,
    })),
    care: product.careInstruction || "",
    colors: product.variants,
    sizes: product.sizes,
    features: product.features,
    isFeatured: product.isFeatured,
    discount: product.discount,
    defaultVariantName: product.defaultVariantName || undefined,
    reviews: product.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      date: review.createdAt.toISOString(),
      comment: review.comment,
      name: review.user?.name || "Anonymous",
      userId: review.userId,
    })),
    reviewCount: product.reviews.length,
  };

  return formattedProduct;
}
