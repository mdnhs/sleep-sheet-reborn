import { Hono } from 'hono';
import prisma from '@/lib/prisma';
import { imageStorage } from '@/lib/imageStorage';
import { deleteImageFromStorage } from '@/lib/deleteImage';
import { sessionMiddleware } from '@/lib/session-middleware';
import { parseStringArray, serializeStringArray, deserializeProduct } from '@/lib/json-fields';

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

    const specifications = JSON.parse(
      formData.get('specifications') as string
    ) as { key: string; value: string }[];

    const isFeaturedRaw = formData.get("isFeatured") as string | null;
    const isFeatured = isFeaturedRaw === "true" || isFeaturedRaw === "on";


    const productData = {
      name: formData.get('productName') as string,
      description: formData.get('productDescription') as string,
      price: Number(formData.get('productPrice')),
      stock: Number(formData.get('productStock')),
      sku: formData.get('productSKU') as string,
      variants: serializeStringArray(JSON.parse(formData.get('productVariants') as string)),
      tags: serializeStringArray(JSON.parse(formData.get('productTags') as string)),
      sizes: serializeStringArray(JSON.parse(formData.get('productSize') as string)),
      features: serializeStringArray(JSON.parse(formData.get('productFeature') as string)),
      careInstruction: formData.get("careInstruction") as string,
      images: serializeStringArray(uploadedImageUrls),
      isFeatured: isFeatured,
      category: {
        connect: {
          value: formData.get('productCategory') as string
        }
      },
      specifications: {
        create: specifications.map((spec) => ({
          key: spec.key,
          value: spec.value,
        })),
      },
    };
    const product = await prisma.product.create({
      data: {
        ...productData,
      },
      include: {
        category: true,
        specifications: true,
      }
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
          productVariants: parseStringArray(product.variants),
          productTags: parseStringArray(product.tags),
          productImages: parseStringArray(product.images),
          productSize: parseStringArray(product.sizes),
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

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
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

    const removedImages = parseStringArray(existingProduct.images).filter(
      (oldImg) => !uploadedImageUrls.includes(oldImg)
    );

    for (const img of removedImages) {
      await deleteImageFromStorage(img);
    }

    const updateData = {
      name: formData.get("productName") as string,
      description: formData.get("productDescription") as string,
      price: Number(formData.get("productPrice")),
      stock: Number(formData.get("productStock")),
      sku: formData.get("productSKU") as string,
      variants: serializeStringArray(JSON.parse(formData.get("productVariants") as string)),
      tags: serializeStringArray(JSON.parse(formData.get("productTags") as string)),
      sizes: serializeStringArray(JSON.parse(formData.get("productSize") as string)),
      features: serializeStringArray(JSON.parse(formData.get("productFeature") as string)),
      careInstruction: formData.get("careInstruction") as string,
      images: serializeStringArray(uploadedImageUrls),
      isFeatured: formData.get("isFeatured") === "true",
      category: {
        connect: { value: formData.get("productCategory") as string },
      },
      specifications: {
        deleteMany: {},
        create: JSON.parse(formData.get("specifications") as string).map(
          (spec: { key: string; value: string }) => ({
            key: spec.key,
            value: spec.value,
          })
        ),
      },
    };

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: true,
        specifications: true,
      },
    });

    return c.json({ success: true, product: deserializeProduct(updatedProduct) }, 200);
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
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return c.json({ error: "Product not found" }, 404);

    for (const img of parseStringArray(product.images)) {
      await deleteImageFromStorage(img);
    }

    await prisma.wishlistItem.deleteMany({ where: { productId } });
    await prisma.cartItem.deleteMany({ where: { productId } });
    await prisma.review.deleteMany({ where: { productId } });
    await prisma.specification.deleteMany({ where: { productId } });
    await prisma.$executeRaw`UPDATE order_items SET "productId" = NULL WHERE "productId" = ${productId}`;
    await prisma.product.delete({ where: { id: productId } });

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return c.json({ error: "Failed to delete product" }, 500);
  }
});

export default app;
