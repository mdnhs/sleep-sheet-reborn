import { Hono } from 'hono';
import { db } from '@/db';
import { products, categories, reviews, specifications, users, orderItems, orders } from '@/db/schema';
import { eq, and, or, lte, gte, ilike, sql, desc, asc, inArray, ne } from 'drizzle-orm';
import { Product } from '@/lib/types';
import { getProductById } from './get-product';

// Total units sold per product, from real (non-cancelled) orders — used to
// rank the bestselling sort. Products with zero sales don't appear here at
// all (no matching orderItems rows), so callers must COALESCE to 0.
const salesSubquery = db
  .select({
    productId: orderItems.productId,
    totalSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`.as("totalSold"),
  })
  .from(orderItems)
  .innerJoin(orders, eq(orderItems.orderId, orders.id))
  .where(ne(orders.status, "CANCELLED"))
  .groupBy(orderItems.productId)
  .as("sales");

const app = new Hono()

.get("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const formattedProduct = await getProductById(id);

    if (!formattedProduct) {
      return c.json({ error: "Product Not Found" }, 404);
    }

    c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return c.json({ formattedProduct }, 200);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
})

.get("/", async (c) => {
  const category = c.req.query("category");
  const sort = c.req.query("sort") || "newest";
  const minPrice = c.req.query("minPrice");
  const maxPrice = c.req.query("maxPrice");
  const page = parseInt(c.req.query("page") || "1");
  const search = c.req.query("search");
  const admin = c.req.query("admin");
  const limit = Math.min(parseInt(c.req.query("limit") || "8", 10) || 8, 100);

  const filterConditions: any[] = [];

  if (category) {
    const categoryList = category.split(",").map(c => c.trim()).filter(Boolean);
    if (categoryList.length > 0) {
      const matchedCategories = await db.query.categories.findMany({
        where: inArray(categories.label, categoryList)
      });
      
      const matchedIds = matchedCategories.map(c => c.id);
      
      let allValidLabels = [...categoryList];
      
      if (matchedIds.length > 0) {
        const childCategories = await db.query.categories.findMany({
          where: inArray(categories.parentId, matchedIds)
        });
        
        allValidLabels = [...new Set([...categoryList, ...childCategories.map(c => c.label)])];
      }

      if (allValidLabels.length === 1) {
        filterConditions.push(eq(categories.label, allValidLabels[0]));
      } else {
        filterConditions.push(inArray(categories.label, allValidLabels));
      }
    }
  }

  if (minPrice) {
    const min = parseFloat(minPrice);
    if (!isNaN(min)) {
      filterConditions.push(gte(products.price, min));
    }
  }

  if (maxPrice) {
    const max = parseFloat(maxPrice);
    if (!isNaN(max)) {
      filterConditions.push(lte(products.price, max));
    }
  }

  const featured = c.req.query("featured");

  if (featured === "true") {
    filterConditions.push(eq(products.isFeatured, true));
  } else if (featured === "false") {
    filterConditions.push(eq(products.isFeatured, false));
  }

  // Note: We don't filter by isFeatured when sort="featured" because it's a sort option, 
  // not a filter. It will sort featured products first via orderConditions.

  if (search) {
    filterConditions.push(
      or(
        ilike(products.name, `%${search}%`),
        ilike(products.description, `%${search}%`),
        ilike(categories.label, `%${search}%`)
      )
    );
  }

  const orderConditions: any[] = admin === "true" ? [] : [desc(products.isFeatured)];
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
      orderConditions.push(desc(products.updatedAt));
      break;
    case "bestselling":
      orderConditions.push(desc(sql`COALESCE(${salesSubquery.totalSold}, 0)`));
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
      addOns: products.addOns,
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
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(salesSubquery, eq(products.id, salesSubquery.productId));

    if (filterConditions.length > 0) {
      mainQuery.where(and(...filterConditions));
    }

    if (orderConditions.length > 0) {
      mainQuery.orderBy(...orderConditions);
    }

    mainQuery.limit(limit).offset((page - 1) * limit);

    const productsList = await mainQuery;

    // Cache public storefront listings at the CDN; the admin dashboard needs
    // to see edits immediately, so its variant stays uncached.
    if (admin !== "true") {
      c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    }

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
        addOns: product.addOns || [],
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
