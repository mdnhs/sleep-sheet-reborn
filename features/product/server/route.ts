import { Hono } from 'hono';
import { db } from '@/db';
import { products, categories, reviews, specifications, users } from '@/db/schema';
import { eq, and, or, lte, gte, ilike, sql, desc, asc } from 'drizzle-orm';
import { Product } from '@/lib/types';

const app = new Hono()

.get("/:id", async (c) => {
  const id = c.req.param("id");

  try {
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

    if (!product) {
      return c.json({ error: "Product Not Found" }, 404);
    }

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

    return c.json({ formattedProduct }, 200);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
})

.get("/", async (c) => {
  const category = c.req.query("category");
  const sort = c.req.query("sort");
  const priceRange = c.req.query("price");
  const page = parseInt(c.req.query("page") || "1");
  const search = c.req.query("search");
  const limit = Math.min(parseInt(c.req.query("limit") || "8", 10) || 8, 100);

  const filterConditions: any[] = [];

  if (category) {
    filterConditions.push(eq(categories.label, category));
  }

  if (priceRange) {
    switch (priceRange) {
      case "under-50":
        filterConditions.push(lte(products.price, 50));
        break;
      case "50-100":
        filterConditions.push(and(gte(products.price, 50), lte(products.price, 100)));
        break;
      case "100-200":
        filterConditions.push(and(gte(products.price, 100), lte(products.price, 200)));
        break;
      case "200+":
        filterConditions.push(gte(products.price, 200));
        break;
    }
  }

  const isFeatured = sort === "featured" ? true : undefined;
  if (isFeatured !== undefined) {
    filterConditions.push(eq(products.isFeatured, isFeatured));
  }

  if (search) {
    filterConditions.push(
      or(
        ilike(products.name, `%${search}%`),
        ilike(products.description, `%${search}%`),
        ilike(categories.label, `%${search}%`)
      )
    );
  }

  const orderConditions: any[] = [];
  switch (sort) {
    case "newest":
      orderConditions.push(desc(products.createdAt));
      break;
    case "price-asc":
      orderConditions.push(asc(products.price));
      break;
    case "price-desc":
      orderConditions.push(desc(products.price));
      break;
    case "featured":
      orderConditions.push(desc(products.isFeatured), desc(products.updatedAt));
      break;
  }

  try {
    const countQuery = db.select({
      count: sql<number>`count(*)`
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id));

    if (filterConditions.length > 0) {
      countQuery.where(and(...filterConditions));
    }

    const [countResult] = await countQuery;
    const totalCount = Number(countResult?.count || 0);

    const mainQuery = db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      stock: products.stock,
      sku: products.sku,
      variants: products.variants,
      sizes: products.sizes,
      tags: products.tags,
      images: products.images,
      careInstruction: products.careInstruction,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      isFeatured: products.isFeatured,
      discount: products.discount,
      defaultVariantName: products.defaultVariantName,
      categoryValue: categories.value,
      categoryLabel: categories.label,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id));

    if (filterConditions.length > 0) {
      mainQuery.where(and(...filterConditions));
    }

    if (orderConditions.length > 0) {
      mainQuery.orderBy(...orderConditions);
    }

    mainQuery.limit(limit).offset((page - 1) * limit);

    const productsList = await mainQuery;

    return c.json({
      data: productsList.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        sku: product.sku,
        tags: product.tags,
        images: product.images,
        colors: product.variants,
        sizes: product.sizes,
        category: product.categoryValue || "",
        categoryLabel: product.categoryLabel || "",
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        isFeatured: product.isFeatured,
        discount: product.discount,
        defaultVariantName: product.defaultVariantName || undefined,
      })),
      total: totalCount,
      hasNextPage: page * limit < totalCount,
      totalPages: Math.ceil(totalCount / limit),
    });
    
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch products" }, 500);
  }
});

export default app;
