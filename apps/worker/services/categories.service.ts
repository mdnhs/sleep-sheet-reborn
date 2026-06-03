import db from "@repo/database";
import { parseStringArray } from "@repo/database";
import { ServiceError } from "../utils/service-error";
import cuid from "cuid";

export async function listCategories() {
  return db.category.findMany({
    select: { id: true, label: true, value: true, parentId: true },
  });
}

export async function createCategory(input: { label: string; value: string; parentId?: string | null }) {
  const { label, value, parentId } = input;

  if (parentId) {
    const parentExists = await db.category.findUnique({ where: { id: parentId } });
    if (!parentExists) throw new ServiceError("Parent category not found", 404);
    if (parentExists.parentId) throw new ServiceError("Only one level of nesting allowed", 400);
  }

  const existingCategory = await db.category.findUnique({ where: { value } });
  if (existingCategory) throw new ServiceError("Category value already exists", 409);

  return db.category.create({
    data: { id: cuid(), label, value, parentId: parentId ?? null },
    select: { label: true, value: true, parentId: true },
  });
}

export async function deleteCategory(value: string) {
  const category = await db.category.findUnique({
    where: { value },
    include: { children: { select: { id: true } } },
  });

  if (!category) throw new ServiceError("Category not found", 404);
  if (category.children.length > 0) {
    throw new ServiceError(
      "Cannot delete category with subcategories. Delete subcategories first.",
      409,
    );
  }

  await db.category.delete({ where: { value } });
  return { success: true, message: "Category deleted" };
}

export async function getFeaturedCategories() {
  const categories = await db.category.findMany({
    include: { products: { include: { reviews: true } } },
  });

  const categoriesWithImages = categories
    .map((category) => {
      // The custom DB wrapper uses 'include' to populate relations.
      // If no products exist, the wrapper might return undefined or an empty array.
      const products = (category.products || []) as any[];
      if (products.length === 0) return null;

      // Filter products that actually have images (images field is a JSON string in D1)
      const productsWithImages = products.filter((p) => parseStringArray(p.images).length > 0);
      if (productsWithImages.length === 0) return null;

      const bestProduct = productsWithImages
        .map((p) => {
          const reviews = (p.reviews || []) as any[];
          const avgRating =
            reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
          return { ...p, avgRating };
        })
        .sort((a, b) => b.avgRating - a.avgRating)[0];

      const image = parseStringArray(bestProduct?.images)[0] ?? null;
      if (!image) return null;

      return {
        label: category.label,
        value: category.value,
        image,
        _productCount: productsWithImages.length, // internal only
      };
    })
    .filter((c): c is { label: string; value: string; image: string; _productCount: number } => !!c)
    .sort((a, b) => b._productCount - a._productCount)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ _productCount, ...rest }) => rest);

  return { success: true, categories: categoriesWithImages };
}
