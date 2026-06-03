import { parseStringArray } from "@/lib/json-fields";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";
import { ServiceError } from "@/lib/service-error";

type CollectionRow = {
  id: string;
  tags: string;
  images: string;
  categoryId: string;
  category: string;
  avgRating: number;
};

export async function getCollections() {
  const { env } = getCloudflareContext();
  const db = (env as { DB?: D1Database }).DB;
  if (!db) throw new ServiceError("D1 binding `DB` not found", 500);

  const { results } = await db
    .prepare(
      `
      SELECT
        p.id,
        p.productTags AS tags,
        p.productImages AS images,
        p.productCategory AS categoryId,
        c.label AS category,
        COALESCE(AVG(r.rating), 0) AS avgRating
      FROM products p
      INNER JOIN Category c ON c.id = p.productCategory
      LEFT JOIN product_reviews r ON r.productId = p.id
      WHERE p.productTags <> '[]'
      GROUP BY p.id, p.productTags, p.productImages, p.productCategory, c.label
      `,
    )
    .all<CollectionRow>();

  const tagCategoryMap: Record<string, Set<string>> = {};
  const tagProductMap: Record<string, { image: string; avgRating: number; category: string }[]> = {};

  for (const product of results) {
    const productImages = parseStringArray(product.images);
    for (const tag of parseStringArray(product.tags)) {
      const lowercasedTag = tag.toLowerCase();

      (tagCategoryMap[lowercasedTag] ??= new Set()).add(product.categoryId);
      (tagProductMap[lowercasedTag] ??= []).push({
        image: productImages[0] || "",
        avgRating: product.avgRating,
        category: product.category,
      });
    }
  }

  const collections = Object.entries(tagCategoryMap)
    .filter(([, categories]) => categories.size > 1)
    .map(([tag]) => {
      const products = tagProductMap[tag];
      const topProduct = products.sort((a, b) => b.avgRating - a.avgRating)[0];
      return {
        label: tag,
        value: tag.toLowerCase().replace(/\s+/g, "-"),
        image: topProduct.image || null,
        category: topProduct.category,
      };
    })
    .filter((collection) => collection.image)
    .slice(0, 10);

  return { success: true, collections };
}
