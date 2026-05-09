/* eslint-disable @typescript-eslint/no-unused-vars */
import { Hono } from 'hono'
import prisma from '@/lib/prisma'

const app = new Hono()

.get('/', async (c) => {
  const products = await prisma.product.findMany({
    where: {
      tags: {
        isEmpty: false,
      },
    },
    select: {
      id: true,
      name: true,
      tags: true,
      images: true,
      categoryId: true,
      reviews: {
        select: {
          rating: true,
        },
      },
      category: {
        select: {
          label: true,
          value: true,
        }
      },
    },
  });

  const tagCategoryMap: Record<string, Set<string>> = {};
  const tagProductMap: Record<string, { image: string; avgRating: number, category: string }[]> = {};

  for (const product of products) {
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
        : 0;

    for (const tag of product.tags) {
      const lowercasedTag = tag.toLowerCase();

      if (!tagCategoryMap[lowercasedTag]) {
        tagCategoryMap[lowercasedTag] = new Set();
      }
      tagCategoryMap[lowercasedTag].add(product.categoryId);

      if (!tagProductMap[lowercasedTag]) {
        tagProductMap[lowercasedTag] = [];
      }
      tagProductMap[lowercasedTag].push({
        image: product.images?.[0] || '',
        avgRating,
        category: product.category.label,
      });
    }
  }

  const collections = Object.entries(tagCategoryMap)
    .filter(([_, categories]) => categories.size > 1)
    .map(([tag, _]) => {
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
});

export default app;
