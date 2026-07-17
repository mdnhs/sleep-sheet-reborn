import { Hono } from 'hono';
import { db } from '@/db';
import { categories, products } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { sessionMiddleware } from '@/lib/session-middleware';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import cuid from 'cuid';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

const app = new Hono()
.get("/", async(c)=>{
   try{
      const [categoriesList, productCounts] = await Promise.all([
        db.select({
          id: categories.id,
          label: categories.label,
          value: categories.value,
          parentId: categories.parentId,
          image: categories.image,
          seoTitle: categories.seoTitle,
          seoDescription: categories.seoDescription,
        }).from(categories),
        db.select({ categoryId: products.categoryId, count: count() })
          .from(products)
          .groupBy(products.categoryId),
      ]);

      const countByCategoryId = new Map(productCounts.map((r) => [r.categoryId, Number(r.count)]));
      const categoriesWithCounts = categoriesList.map((category) => ({
        ...category,
        productCount: countByCategoryId.get(category.id) || 0,
      }));

      return c.json(categoriesWithCounts);
   }catch(error){
     console.error("Failed to fetch Categories",error);
     return c.json({error: "failed to fetch Categories"},500)
   }
})
.post("/create",sessionMiddleware,zValidator('json',
   z.object({
      label:z.string().min(2).max(50),
      value:z.string().min(2).max(50),
      parentId: z.string().optional().nullable(),
      image: z.string().url().optional().nullable(),
      seoTitle: z.string().max(70).optional().nullable(),
      seoDescription: z.string().max(160).optional().nullable(),
   })
), async(c)=>{
   try{
      const user = c.get("user");
      const {label,value,parentId,image,seoTitle,seoDescription}=c.req.valid("json");

      if(!user || !hasPermission(user, PERMISSIONS.MANAGE_PRODUCTS)){
         return c.json({ success: false, error: 'Unauthorized' }, 403);
       }

       if (parentId) {
         const parentExists = await db.query.categories.findFirst({ where: eq(categories.id, parentId) });
         if (!parentExists) return c.json({ error: "Parent category not found" }, 404);
         if (parentExists.parentId) return c.json({ error: "Only one level of nesting allowed" }, 400);
       }

       const existingCategory = await db.query.categories.findFirst({
         where: eq(categories.value, value)
       });
       if (existingCategory) {
         return c.json({ error: "Category value already exists" }, 409);
       }

       const newCategoryId = cuid();
       await db.insert(categories).values({
         id: newCategoryId,
         label,
         value,
         parentId: parentId ?? null,
         image: image ?? null,
         seoTitle: seoTitle ?? null,
         seoDescription: seoDescription ?? null,
       });

       return c.json({
         label,
         value,
         parentId: parentId ?? null,
         image: image ?? null,
         seoTitle: seoTitle ?? null,
         seoDescription: seoDescription ?? null,
       }, 201);
      } catch (error) {
         console.error("Failed to create category", error);
         return c.json({ error: "Failed to create category" }, 500);
       }
})
.patch("/:value", sessionMiddleware, zValidator('json',
   z.object({
      label: z.string().min(2).max(50).optional(),
      value: z.string().min(2).max(50).optional(),
      parentId: z.string().optional().nullable(),
      image: z.string().url().optional().nullable(),
      seoTitle: z.string().max(70).optional().nullable(),
      seoDescription: z.string().max(160).optional().nullable(),
   })
), async (c) => {
   const user = c.get("user");
   if (!user || user.role !== "ADMIN") {
     return c.json({ success: false, error: "Unauthorized" }, 403);
   }

   const currentValue = c.req.param("value");
   const body = c.req.valid("json");

   try {
     const existing = await db.query.categories.findFirst({
       where: eq(categories.value, currentValue),
     });
     if (!existing) return c.json({ error: "Category not found" }, 404);

     if (body.parentId) {
       const parentExists = await db.query.categories.findFirst({ where: eq(categories.id, body.parentId) });
       if (!parentExists) return c.json({ error: "Parent category not found" }, 404);
       if (parentExists.parentId) return c.json({ error: "Only one level of nesting allowed" }, 400);
       if (body.parentId === existing.id) return c.json({ error: "Cannot set self as parent" }, 400);
     }

     if (body.value && body.value !== currentValue) {
       const slugExists = await db.query.categories.findFirst({ where: eq(categories.value, body.value) });
       if (slugExists) return c.json({ error: "Category value already exists" }, 409);
     }

     const updates: Record<string, unknown> = {}
     if (body.label !== undefined) updates.label = body.label
     if (body.value !== undefined) updates.value = body.value
     if (body.parentId !== undefined) updates.parentId = body.parentId
     if (body.image !== undefined) {
       if (existing.image) {
         await deleteImage(existing.image).catch(() => {})
       }
       updates.image = body.image
     }
     if (body.seoTitle !== undefined) updates.seoTitle = body.seoTitle
     if (body.seoDescription !== undefined) updates.seoDescription = body.seoDescription
     updates.updatedAt = new Date()

     await db.update(categories).set(updates).where(eq(categories.value, currentValue))

     return c.json({ success: true })
   } catch (error) {
     console.error("Failed to update category", error)
     return c.json({ error: "Failed to update category" }, 500)
   }
})
.post("/upload-image", sessionMiddleware, async (c) => {
   const user = c.get("user");
   if (!user || user.role !== "ADMIN") {
     return c.json({ success: false, error: "Unauthorized" }, 403);
   }

   try {
     const formData = await c.req.formData()
     const file = formData.get("image")
     if (!file || !(file instanceof File)) {
       return c.json({ error: "No image file provided" }, 400)
     }

     const url = await uploadImage(file, "categories")
     return c.json({ url })
   } catch (error) {
     console.error("Failed to upload image", error)
     return c.json({ error: "Failed to upload image" }, 500)
   }
})
.post("/bulk-delete", sessionMiddleware, async (c) => {
   const user = c.get("user");
   if (!user || user.role !== "ADMIN") {
     return c.json({ success: false, error: "Unauthorized" }, 403);
   }

   try {
     const { values } = await c.req.json<{ values: string[] }>();
     if (!values || values.length === 0) {
       return c.json({ error: "No category values provided" }, 400);
     }

     for (const value of values) {
       const category = await db.query.categories.findFirst({
         where: eq(categories.value, value),
         with: { children: { columns: { id: true } } },
       });
       if (!category) continue;
       if (category.children.length > 0) continue;

       await db.delete(categories).where(eq(categories.value, value));
     }

     return c.json({ success: true });
   } catch (error) {
     console.error("Failed to bulk delete categories", error);
     return c.json({ error: "Failed to delete categories" }, 500);
   }
})
.delete("/delete/:value", sessionMiddleware, async (c) => {
   const user = c.get("user");
   const { value } = c.req.param();

   if (!user || user.role !== "ADMIN") {
     return c.json({ success: false, error: "Unauthorized" }, 403);
   }

   try {
     const category = await db.query.categories.findFirst({
       where: eq(categories.value, value),
       with: {
         children: {
           columns: { id: true }
         }
       },
     });

     if (!category) return c.json({ success: false, error: "Category not found" }, 404);

     if (category.children.length > 0) {
       return c.json({ success: false, error: "Cannot delete category with subcategories. Delete subcategories first." }, 409);
     }

      if (category.image) {
        await deleteImage(category.image).catch(() => {})
      }
      await db.delete(categories).where(eq(categories.value, value));

      return c.json({ success: true, message: "Category deleted" }, 200);
   } catch (error) {
     console.error("Failed to delete category", error);
     return c.json({ success: false, error: "Failed to delete category" }, 500);
   }
 })
 .get('/category', async (c) => {
   const categoriesList = await db.query.categories.findMany({
     with: {
       products: {
         with: {
           reviews: {
             columns: { rating: true }
           }
         }
       }
     }
   });

   const categoriesWithImages = categoriesList
      .map((category) => {
        const validProducts = category.products.filter(p => p.images && p.images.length > 0);
        
        let productImage = null;
        if (validProducts.length > 0) {
          const bestProduct = validProducts
            .map((p) => {
              const avgRating =
                p.reviews.length > 0
                  ? p.reviews.reduce((acc, r) => acc + r.rating, 0) / p.reviews.length
                  : 0;
              return { ...p, avgRating };
            })
            .sort((a, b) => b.avgRating - a.avgRating)[0];
          productImage = bestProduct?.images?.[0] ?? null;
        }

        const image = category.image || productImage;
        if (!image) return null;

        return {
          label: category.label,
          value: category.value,
          image,
          productCount: category.products.length,
          _sortWeight: validProducts.length, // internal only, favors categories with product photos
        };
      })
      .filter((c): c is { label: string; value: string; image: string; productCount: number; _sortWeight: number } => !!c)
     .sort((a, b) => b._sortWeight - a._sortWeight)
     .map(({ _sortWeight, ...rest }) => rest);

   return c.json({ success: true, categories: categoriesWithImages });
});

export default app;
