import { Hono } from 'hono';
import { db } from '@/db';
import { products, categories, specifications, wishlistItems, cartItems, reviews, orderItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { imageStorage } from '@/lib/imageStorage';
import { deleteImageFromStorage } from '@/lib/deleteImage';
import { sessionMiddleware } from '@/lib/session-middleware';

const app = new Hono();

app.post('/upload',sessionMiddleware, async (c) => {
  const user =c.get("user");
  if(!user || user.role !== "ADMIN"){
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

    const product = await db.transaction(async (tx) => {
      const [newProduct] = await tx.insert(products).values({
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
      }).returning();

      const specsToInsert = specificationsList.map((spec) => ({
        key: spec.key,
        value: spec.value,
        productId: newProduct.id,
      }));

      let insertedSpecs: any[] = [];
      if (specsToInsert.length > 0) {
        insertedSpecs = await tx.insert(specifications).values(specsToInsert).returning();
      }

      return {
        ...newProduct,
        category,
        specifications: insertedSpecs,
      };
    });

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
  const user =c.get("user");
  if(!user || user.role !== "ADMIN"){
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

    const updatedProduct = await db.transaction(async (tx) => {
      const [newProduct] = await tx.update(products)
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
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId))
        .returning();

      await tx.delete(specifications).where(eq(specifications.productId, productId));

      const specList = JSON.parse(formData.get("specifications") as string) as { key: string; value: string }[];
      let insertedSpecs: any[] = [];
      if (specList.length > 0) {
        insertedSpecs = await tx.insert(specifications).values(
          specList.map((spec) => ({
            key: spec.key,
            value: spec.value,
            productId: productId,
          }))
        ).returning();
      }

      return {
        ...newProduct,
        category,
        specifications: insertedSpecs,
      };
    });

    return c.json({ success: true, product: updatedProduct }, 200);
  } catch (error) {
    console.error("Error updating product:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    }, 400);
  }
})

app.delete('/:id', sessionMiddleware, async (c) => {
  const user = c.get("user");
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
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

    await db.transaction(async (tx) => {
      await tx.delete(wishlistItems).where(eq(wishlistItems.productId, productId));
      await tx.delete(cartItems).where(eq(cartItems.productId, productId));
      await tx.delete(reviews).where(eq(reviews.productId, productId));
      await tx.delete(specifications).where(eq(specifications.productId, productId));
      await tx.update(orderItems)
        .set({ productId: null })
        .where(eq(orderItems.productId, productId));
      await tx.delete(products).where(eq(products.id, productId));
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return c.json({ error: "Failed to delete product" }, 500);
  }
});

export default app;
