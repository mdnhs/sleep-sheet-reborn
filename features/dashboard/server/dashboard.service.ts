import db from "@/lib/db";
import { imageStorage } from "@/lib/imageStorage";
import { deleteImageFromStorage } from "@/lib/deleteImage";
import { parseStringArray, serializeStringArray, deserializeProduct } from "@/lib/json-fields";
import { ServiceError } from "@/lib/service-error";

/** Persist uploaded files to storage and return their URLs (passing through existing string URLs). */
async function uploadImages(files: FormDataEntryValue[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    if (file instanceof File) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { url } = await imageStorage(buffer);
      urls.push(url);
    } else if (typeof file === "string") {
      urls.push(file);
    }
  }
  return urls;
}

function parseProductFields(formData: FormData, imageUrls: string[]) {
  const isFeaturedRaw = formData.get("isFeatured") as string | null;
  return {
    name: formData.get("productName") as string,
    description: formData.get("productDescription") as string,
    price: Number(formData.get("productPrice")),
    stock: Number(formData.get("productStock")),
    lowStockThreshold: formData.get("lowStockThreshold") != null
      ? Number(formData.get("lowStockThreshold"))
      : 5,
    sku: formData.get("productSKU") as string,
    variants: serializeStringArray(JSON.parse(formData.get("productVariants") as string)),
    tags: serializeStringArray(JSON.parse(formData.get("productTags") as string)),
    sizes: serializeStringArray(JSON.parse(formData.get("productSize") as string)),
    features: serializeStringArray(JSON.parse(formData.get("productFeature") as string)),
    careInstruction: formData.get("careInstruction") as string,
    images: serializeStringArray(imageUrls),
    isFeatured: isFeaturedRaw === "true" || isFeaturedRaw === "on",
    category: { connect: { value: formData.get("productCategory") as string } },
  };
}

export async function createProduct(formData: FormData) {
  const imageUrls = await uploadImages(formData.getAll("productImages"));
  const specifications = JSON.parse(formData.get("specifications") as string) as {
    key: string;
    value: string;
  }[];

  const product = await db.product.create({
    data: {
      ...parseProductFields(formData, imageUrls),
      specifications: { create: specifications.map((s) => ({ key: s.key, value: s.value })) },
    },
    include: { category: true, specifications: true },
  });

  if (!product) throw new ServiceError("Failed to create product", 500);

  return {
    id: product.id,
    productName: product.name,
    productDescription: product.description,
    productPrice: product.price,
    productStock: product.stock,
    lowStockThreshold: product.lowStockThreshold ?? 5,
    productSKU: product.sku,
    productVariants: parseStringArray(product.variants),
    productTags: parseStringArray(product.tags),
    productImages: parseStringArray(product.images),
    productSize: parseStringArray(product.sizes),
    isFeatured: product.isFeatured,
    productCategory: product.category.value,
    productSpecifications: product.specifications,
    createdAt: product.createdAt,
  };
}

export async function updateProduct(formData: FormData) {
  const productId = formData.get("id") as string;

  const existingProduct = await db.product.findUnique({ where: { id: productId } });
  if (!existingProduct) throw new ServiceError("Product not found", 404);

  const imageUrls = await uploadImages(formData.getAll("productImages"));

  const removedImages = parseStringArray(existingProduct.images).filter(
    (oldImg) => !imageUrls.includes(oldImg),
  );
  for (const img of removedImages) {
    await deleteImageFromStorage(img);
  }

  const updatedProduct = await db.product.update({
    where: { id: productId },
    data: {
      ...parseProductFields(formData, imageUrls),
      specifications: {
        deleteMany: {},
        create: JSON.parse(formData.get("specifications") as string).map(
          (spec: { key: string; value: string }) => ({ key: spec.key, value: spec.value }),
        ),
      },
    },
    include: { category: true, specifications: true },
  });

  if (!updatedProduct) throw new ServiceError("Product not found", 404);

  return deserializeProduct(updatedProduct);
}

export async function deleteProduct(productId: string) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new ServiceError("Product not found", 404);

  for (const img of parseStringArray(product.images)) {
    await deleteImageFromStorage(img);
  }

  await db.wishlistItem.deleteMany({ where: { productId } });
  await db.cartItem.deleteMany({ where: { productId } });
  await db.review.deleteMany({ where: { productId } });
  await db.specification.deleteMany({ where: { productId } });
  await db.$executeRaw`UPDATE order_items SET "productId" = NULL WHERE "productId" = ${productId}`;
  await db.product.delete({ where: { id: productId } });

  return { success: true };
}
