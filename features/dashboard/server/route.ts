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
import { can } from "@/lib/permissions";
import { setActivityMeta, summarizeNames, type ActivityChange } from "@/features/activity/server/log-activity";

const app = new Hono();

app.post('/upload',sessionMiddleware, async (c) => {
  const user = c.get("user");
  if(!user || !can(user, "products", "write")){
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
        addOns: JSON.parse((formData.get('productAddOns') as string) || '[]'),
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
        productAddOns: product.addOns,
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
  if(!user || !can(user, "products", "write")){
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
          addOns: JSON.parse((formData.get("productAddOns") as string) || "[]"),
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
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !can(user, "products", "write"))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  try {
    const { ids } = await c.req.json<{ ids: string[] }>();
    if (!ids || ids.length === 0) {
      return c.json({ error: "No product IDs provided" }, 400);
    }

    // One query per TABLE instead of eight queries per PRODUCT: deleting 50
    // products used to fire ~400 separate statements at the database.
    const found = await db.query.products.findMany({
      where: inArray(products.id, ids),
      columns: { id: true, name: true, images: true },
    });

    if (found.length === 0) {
      return c.json({ success: true, deleted: 0 });
    }

    const deletedNames = found.map((product) => product.name);
    const foundIds = found.map((product) => product.id);

    // Image removal talks to object storage, not the database — run them
    // together rather than one after another.
    await Promise.all(
      found.flatMap((product) => product.images.map((img) => deleteImageFromStorage(img)))
    );

    // The dependent rows don't reference each other, so they all travel in a
    // single batched round trip; only the products delete has to wait.
    await db.batch([
      db.delete(campaigns).where(inArray(campaigns.productId, foundIds)),
      db.delete(wishlistItems).where(inArray(wishlistItems.productId, foundIds)),
      db.delete(cartItems).where(inArray(cartItems.productId, foundIds)),
      db.delete(reviews).where(inArray(reviews.productId, foundIds)),
      db.delete(specifications).where(inArray(specifications.productId, foundIds)),
      db.update(orderItems).set({ productId: null }).where(inArray(orderItems.productId, foundIds)),
    ]);
    await db.delete(products).where(inArray(products.id, foundIds));

    invalidateFeed();
    setActivityMeta(c, { name: `${deletedNames.length} products: ${summarizeNames(deletedNames)}` });
    return c.json({ success: true, deleted: foundIds.length });
  } catch (error) {
    console.error("Error bulk deleting products:", error);
    return c.json({ error: "Failed to delete products" }, 500);
  }
})

app.delete('/:id', sessionMiddleware, async (c) => {
  const user = c.get("user");
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !can(user, "products", "write"))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const productId = c.req.param("id");

  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });
    if (!product) return c.json({ error: "Product not found" }, 404);

    await Promise.all(product.images.map((img) => deleteImageFromStorage(img)));

    // Independent of one another — sent as one batched round trip instead of
    // six sequential ones.
    await db.batch([
      db.delete(campaigns).where(eq(campaigns.productId, productId)),
      db.delete(wishlistItems).where(eq(wishlistItems.productId, productId)),
      db.delete(cartItems).where(eq(cartItems.productId, productId)),
      db.delete(reviews).where(eq(reviews.productId, productId)),
      db.delete(specifications).where(eq(specifications.productId, productId)),
      db.update(orderItems).set({ productId: null }).where(eq(orderItems.productId, productId)),
    ]);
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
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !can(user, "products", "write"))) {
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

// Lightweight JSON update — the main /update endpoint above takes multipart
// form-data (mirroring the admin form exactly, including new image file
// uploads), which is awkward for a programmatic caller like the MCP server.
// This covers every product field except new image *uploads*: images are
// accepted as an array of existing URLs (reorder/remove), category as its
// value/slug (resolved to an id), specifications as key/value pairs
// (replaces the full set).
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
      sku: z.string().min(1).optional(),
      category: z.string().min(1).optional(),
      variants: z.array(z.object({ name: z.string(), price: z.number().nullable() })).optional(),
      addOns: z.array(z.object({ name: z.string(), price: z.number() })).optional(),
      tags: z.array(z.string()).optional(),
      sizes: z.array(z.string()).optional(),
      features: z.array(z.string()).optional(),
      careInstruction: z.string().nullable().optional(),
      images: z.array(z.string().url()).optional(),
      specifications: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
      defaultVariantName: z.string().nullable().optional(),
      showLowestPriceAsDefault: z.boolean().optional(),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !can(user, "products", "write"))) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    const id = c.req.param("id");
    const { category: categoryVal, specifications: specList, ...rest } = c.req.valid("json");

    if (Object.keys(rest).length === 0 && categoryVal === undefined && specList === undefined) {
      return c.json({ error: "No fields to update" }, 400);
    }

    const existing = await db.query.products.findFirst({ where: eq(products.id, id) });
    if (!existing) return c.json({ error: "Product not found" }, 404);

    let category: { id: string; label: string } | undefined;
    if (categoryVal !== undefined) {
      const found = await db.query.categories.findFirst({ where: eq(categories.value, categoryVal) });
      if (!found) return c.json({ error: "Category not found" }, 400);
      category = found;
    }

    if (rest.images !== undefined) {
      const removedImages = existing.images.filter((oldImg) => !rest.images!.includes(oldImg));
      for (const img of removedImages) {
        await deleteImageFromStorage(img);
      }
    }

    const [updated] = await db.update(products)
      .set({
        ...rest,
        ...(category ? { categoryId: category.id } : {}),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    let insertedSpecs: (typeof specifications.$inferSelect)[] | undefined;
    if (specList !== undefined) {
      await db.delete(specifications).where(eq(specifications.productId, id));
      insertedSpecs = specList.length > 0
        ? await db.insert(specifications).values(specList.map((spec) => ({ ...spec, productId: id }))).returning()
        : [];
    }

    invalidateFeed();

    const changes: ActivityChange[] = [];
    if (rest.name !== undefined && rest.name !== existing.name) changes.push({ label: "Name", from: existing.name, to: rest.name });
    if (rest.description !== undefined && rest.description !== existing.description) changes.push({ label: "Description", from: existing.description, to: rest.description });
    if (rest.price !== undefined && rest.price !== existing.price) changes.push({ label: "Price", from: existing.price, to: rest.price });
    if (rest.stock !== undefined && rest.stock !== existing.stock) changes.push({ label: "Stock", from: existing.stock, to: rest.stock });
    if (rest.discount !== undefined && rest.discount !== existing.discount) changes.push({ label: "Discount", from: existing.discount, to: rest.discount });
    if (rest.isFeatured !== undefined && rest.isFeatured !== existing.isFeatured) changes.push({ label: "Featured", from: existing.isFeatured, to: rest.isFeatured });
    if (category && category.id !== existing.categoryId) changes.push({ label: "Category", from: existing.categoryId, to: category.label });
    setActivityMeta(c, { name: updated.name, changes });

    return c.json({ success: true, product: { ...updated, ...(insertedSpecs !== undefined ? { specifications: insertedSpecs } : {}) } });
  }
);

export default app;
