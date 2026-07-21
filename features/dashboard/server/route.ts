import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { products, categories, specifications, wishlistItems, cartItems, reviews, orderItems, campaigns } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { imageStorage } from '@/lib/imageStorage';
import { deleteImageFromStorage } from '@/lib/deleteImage';
import { sessionMiddleware } from '@/lib/session-middleware';
import { invalidateFeed } from '@/lib/meta-catalog/cache';
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { setActivityMeta, summarizeNames, type ActivityChange } from "@/features/activity/server/log-activity";

const app = new Hono();

app.post('/upload',sessionMiddleware, async (c) => {
  const user = c.get("user");
  if(!user || !hasPermission(user, PERMISSIONS.MANAGE_PRODUCTS)){
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  try {
    const formData = await c.req.formData();
    const imageFiles = formData.getAll('productImages');
    const uploadedImageUrls: string[] = [];
    
    for (const file of imageFiles) {
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const { url } = await imageStorage(buffer);
        uploadedImageUrls.push(url);
      } else if (typeof file === 'string') {
        uploadedImageUrls.push(file);
      }
    }

    const specificationsList = JSON.parse(
      formData.get('specifications') as string
    ) as { key: string; value: string }[];

    const isFeaturedRaw = formData.get("isFeatured") as string | null;
    const isFeatured = isFeaturedRaw === "true" || isFeaturedRaw === "on";

    const categoryVal = formData.get('productCategory') as string;
    const category = await db.query.categories.findFirst({
      where: eq(categories.value, categoryVal),
    });

    if (!category) {
      return c.json({ success: false, error: 'Category not found' }, 400);
    }

      const [newProduct] = await db.insert(products).values({
        name: formData.get('productName') as string,
        description: formData.get('productDescription') as string,
        price: Number(formData.get('productPrice')),
        stock: Number(formData.get('productStock')),
        sku: formData.get('productSKU') as string,
        variants: JSON.parse(formData.get('productVariants') as string),
        tags: JSON.parse(formData.get('productTags') as string),
        sizes: JSON.parse(formData.get('productSize') as string),
        features: JSON.parse(formData.get('productFeature') as string),
        careInstruction: (formData.get("careInstruction") as string) || null,
        images: uploadedImageUrls,
        isFeatured: isFeatured,
        categoryId: category.id,
        discount: Number(formData.get("discount") || 0),
        defaultVariantName: (formData.get("defaultVariantName") as string) || null,
      }).returning();

      const specsToInsert = specificationsList.map((spec) => ({
        key: spec.key,
        value: spec.value,
        productId: newProduct.id,
      }));

      let insertedSpecs: any[] = [];
      if (specsToInsert.length > 0) {
        insertedSpecs = await db.insert(specifications).values(specsToInsert).returning();
      }

      invalidateFeed();

      const product = {
        ...newProduct,
        category,
        specifications: insertedSpecs,
      };

    setActivityMeta(c, { name: product.name });

    return c.json({
      success: true,
      product: {
        id: product.id,
        productName: product.name,
        productDescription: product.description,
        productPrice: product.price,
        productStock: product.stock,
        productSKU: product.sku,
        productVariants: product.variants,
        productTags: product.tags,
        productImages: product.images,
        productSize: product.sizes,
        isFeatured: product.isFeatured,
        productDiscount: product.discount,
        productDefaultVariantName: product.defaultVariantName,
        productCategory: product.category.value,
        productSpecifications: product.specifications,
        createdAt: product.createdAt,
      }
    }, 201);
  } catch (error) {
    console.error('Error creating product:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create product'
    }, 400);
  }
})
.put("/update",sessionMiddleware, async (c) => {
  const user = c.get("user");
  if(!user || !hasPermission(user, PERMISSIONS.MANAGE_PRODUCTS)){
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    const formData = await c.req.formData();
    const productId = formData.get("id") as string;

    const existingProduct = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!existingProduct) {
      return c.json({ success: false, error: "Product not found" }, 404);
    }

    const imageFiles = formData.getAll("productImages");
    const uploadedImageUrls: string[] = [];

    for (const file of imageFiles) {
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const { url } = await imageStorage(buffer); 
        uploadedImageUrls.push(url);
      } else if (typeof file === "string") {
        uploadedImageUrls.push(file);
      }
    }

    const removedImages = existingProduct.images.filter(
      (oldImg) => !uploadedImageUrls.includes(oldImg)
    );

    for (const img of removedImages) {
      await deleteImageFromStorage(img);
    }

    const categoryVal = formData.get("productCategory") as string;
    const category = await db.query.categories.findFirst({
      where: eq(categories.value, categoryVal),
    });

    if (!category) {
      return c.json({ success: false, error: "Category not found" }, 400);
    }

      const [newProduct] = await db.update(products)
        .set({
          name: formData.get("productName") as string,
          description: formData.get("productDescription") as string,
          price: Number(formData.get("productPrice")),
          stock: Number(formData.get("productStock")),
          sku: formData.get("productSKU") as string,
          variants: JSON.parse(formData.get("productVariants") as string),
          tags: JSON.parse(formData.get("productTags") as string),
          sizes: JSON.parse(formData.get("productSize") as string),
          features: JSON.parse(formData.get("productFeature") as string),
          careInstruction: (formData.get("careInstruction") as string) || null,
          images: uploadedImageUrls,
          isFeatured: formData.get("isFeatured") === "true",
          categoryId: category.id,
          discount: Number(formData.get("discount") || 0),
          defaultVariantName: (formData.get("defaultVariantName") as string) || null,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId))
        .returning();

      await db.delete(specifications).where(eq(specifications.productId, productId));

      const specList = JSON.parse(formData.get("specifications") as string) as { key: string; value: string }[];
      let insertedSpecs: any[] = [];
      if (specList.length > 0) {
        insertedSpecs = await db.insert(specifications).values(
          specList.map((spec) => ({
            key: spec.key,
            value: spec.value,
            productId: productId,
          }))
        ).returning();
      }

      invalidateFeed();

      const updatedProduct = {
        ...newProduct,
        category,
        specifications: insertedSpecs,
      };

      const changes: ActivityChange[] = [];
      if (existingProduct.name !== newProduct.name) {
        changes.push({ label: "Name", from: existingProduct.name, to: newProduct.name });
      }
      if (existingProduct.price !== newProduct.price) {
        changes.push({ label: "Price", from: existingProduct.price, to: newProduct.price });
      }
      if (existingProduct.stock !== newProduct.stock) {
        changes.push({ label: "Stock", from: existingProduct.stock, to: newProduct.stock });
      }
      if (existingProduct.categoryId !== newProduct.categoryId) {
        const oldCategory = await db.query.categories.findFirst({
          where: eq(categories.id, existingProduct.categoryId),
          columns: { label: true },
        });
        changes.push({ label: "Category", from: oldCategory?.label ?? "—", to: category.label });
      }
      if (existingProduct.discount !== newProduct.discount) {
        changes.push({ label: "Discount", from: existingProduct.discount, to: newProduct.discount });
      }
      if (existingProduct.isFeatured !== newProduct.isFeatured) {
        changes.push({ label: "Featured", from: existingProduct.isFeatured, to: newProduct.isFeatured });
      }
      setActivityMeta(c, { name: newProduct.name, changes });

    return c.json({ success: true, product: updatedProduct }, 200);
  } catch (error) {
    console.error("Error updating product:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    }, 400);
  }
})

app.post('/bulk-delete', sessionMiddleware, async (c) => {
  const user = c.get("user");
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !hasPermission(user, PERMISSIONS.MANAGE_PRODUCTS))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  try {
    const { ids } = await c.req.json<{ ids: string[] }>();
    if (!ids || ids.length === 0) {
      return c.json({ error: "No product IDs provided" }, 400);
    }

    const deletedNames: string[] = [];

    for (const productId of ids) {
      const product = await db.query.products.findFirst({
        where: eq(products.id, productId),
      });
      if (!product) continue;
      deletedNames.push(product.name);

      for (const img of product.images) {
        await deleteImageFromStorage(img);
      }

      await db.delete(campaigns).where(eq(campaigns.productId, productId));
      await db.delete(wishlistItems).where(eq(wishlistItems.productId, productId));
      await db.delete(cartItems).where(eq(cartItems.productId, productId));
      await db.delete(reviews).where(eq(reviews.productId, productId));
      await db.delete(specifications).where(eq(specifications.productId, productId));
      await db.update(orderItems)
        .set({ productId: null })
        .where(eq(orderItems.productId, productId));
      await db.delete(products).where(eq(products.id, productId));
    }

    invalidateFeed();
    setActivityMeta(c, { name: `${deletedNames.length} products: ${summarizeNames(deletedNames)}` });
    return c.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error("Error bulk deleting products:", error);
    return c.json({ error: "Failed to delete products" }, 500);
  }
})

app.delete('/:id', sessionMiddleware, async (c) => {
  const user = c.get("user");
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !hasPermission(user, PERMISSIONS.MANAGE_PRODUCTS))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const productId = c.req.param("id");

  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });
    if (!product) return c.json({ error: "Product not found" }, 404);

    for (const img of product.images) {
      await deleteImageFromStorage(img);
    }

      await db.delete(campaigns).where(eq(campaigns.productId, productId));
      await db.delete(wishlistItems).where(eq(wishlistItems.productId, productId));
      await db.delete(cartItems).where(eq(cartItems.productId, productId));
      await db.delete(reviews).where(eq(reviews.productId, productId));
      await db.delete(specifications).where(eq(specifications.productId, productId));
      await db.update(orderItems)
        .set({ productId: null })
        .where(eq(orderItems.productId, productId));
      await db.delete(products).where(eq(products.id, productId));
      invalidateFeed();
      setActivityMeta(c, { name: product.name });

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return c.json({ error: "Failed to delete product" }, 500);
  }
});

app.patch('/bulk-feature', sessionMiddleware, async (c) => {
  const user = c.get("user");
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !hasPermission(user, PERMISSIONS.MANAGE_PRODUCTS))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  try {
    const { ids, isFeatured } = await c.req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return c.json({ error: "No product IDs provided" }, 400);
    }

    await db.update(products)
      .set({ isFeatured: Boolean(isFeatured) })
      .where(inArray(products.id, ids));

    invalidateFeed();
    return c.json({ success: true, updated: ids.length });
  } catch (error) {
    console.error("Error bulk updating feature status:", error);
    return c.json({ error: "Failed to update products" }, 500);
  }
});

// Lightweight JSON update for non-image fields — the main /update endpoint
// above takes multipart form-data (images, variants, specs, tags all at
// once, mirroring the admin form exactly), which is awkward for a
// programmatic caller like the MCP server that only wants to change a price
// or stock count. This is intentionally narrower: no images, variants,
// specifications, or tags — just the fields most operational edits touch.
app.patch(
  '/:id/details',
  sessionMiddleware,
  zValidator(
    'json',
    z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      price: z.number().min(0).optional(),
      stock: z.number().int().min(0).optional(),
      discount: z.number().min(0).max(100).optional(),
      isFeatured: z.boolean().optional(),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !hasPermission(user, PERMISSIONS.MANAGE_PRODUCTS))) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    const id = c.req.param("id");
    const body = c.req.valid("json");

    if (Object.keys(body).length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    const existing = await db.query.products.findFirst({ where: eq(products.id, id) });
    if (!existing) return c.json({ error: "Product not found" }, 404);

    const [updated] = await db.update(products)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    invalidateFeed();

    const changes: ActivityChange[] = [];
    if (body.name !== undefined && body.name !== existing.name) changes.push({ label: "Name", from: existing.name, to: body.name });
    if (body.description !== undefined && body.description !== existing.description) changes.push({ label: "Description", from: existing.description, to: body.description });
    if (body.price !== undefined && body.price !== existing.price) changes.push({ label: "Price", from: existing.price, to: body.price });
    if (body.stock !== undefined && body.stock !== existing.stock) changes.push({ label: "Stock", from: existing.stock, to: body.stock });
    if (body.discount !== undefined && body.discount !== existing.discount) changes.push({ label: "Discount", from: existing.discount, to: body.discount });
    if (body.isFeatured !== undefined && body.isFeatured !== existing.isFeatured) changes.push({ label: "Featured", from: existing.isFeatured, to: body.isFeatured });
    setActivityMeta(c, { name: updated.name, changes });

    return c.json({ success: true, product: updated });
  }
);

export default app;
