import { Hono } from 'hono'
import { parseStringArray } from '@/lib/json-fields'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { D1Database } from '@cloudflare/workers-types'

const app = new Hono()

.get('/', async (c) => {
  try {
    const { env } = getCloudflareContext();
    const db = (env as { DB?: D1Database }).DB;

    if (!db) {
      return c.json({ error: "D1 binding `DB` not found" }, 500);
    }

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
        `
      )
      .all<{
        id: string;
        tags: string;
        images: string;
        categoryId: string;
        category: string;
        avgRating: number;
      }>();

    const tagCategoryMap: Record<string, Set<string>> = {};
    const tagProductMap: Record<string, { image: string; avgRating: number; category: string }[]> = {};

    for (const product of results) {
      const productImages = parseStringArray(product.images);
      for (const tag of parseStringArray(product.tags)) {
        const lowercasedTag = tag.toLowerCase();

        if (!tagCategoryMap[lowercasedTag]) {
          tagCategoryMap[lowercasedTag] = new Set();
        }
        tagCategoryMap[lowercasedTag].add(product.categoryId);

        if (!tagProductMap[lowercasedTag]) {
          tagProductMap[lowercasedTag] = [];
        }
        tagProductMap[lowercasedTag].push({
          image: productImages[0] || '',
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
          value: tag.toLowerCase().replace(/\s+/g, '-'),
          image: topProduct.image || null,
          category: topProduct.category,
        };
      })
      .filter((collection) => collection.image)
      .slice(0, 10);

    return c.json({ success: true, collections });
  } catch (error) {
    console.error("Collection fetch error:", error);
    return c.json({ error: "Failed to fetch collection" }, 500);
  }
});

export default app;
