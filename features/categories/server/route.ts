import { Hono } from 'hono';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sessionMiddleware } from '@/lib/session-middleware';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import cuid from 'cuid';

const app = new Hono()
.get("/", async(c)=>{
   try{
      const categoriesList = await db.select({
        id: categories.id,
        label: categories.label,
        value: categories.value,
        parentId: categories.parentId,
      }).from(categories);

      return c.json(categoriesList);
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
   })
), async(c)=>{
   try{
      const user = c.get("user");
      const {label,value,parentId}=c.req.valid("json");

      if(!user || user.role !== "ADMIN"){
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
       });

       return c.json({
         label,
         value,
         parentId: parentId ?? null,
       }, 201);
      } catch (error) {
         console.error("Failed to create category", error);
         return c.json({ error: "Failed to create category" }, 500);
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
       if (validProducts.length === 0) return null;

       const bestProduct = validProducts
         .map((p) => {
           const avgRating =
             p.reviews.length > 0
               ? p.reviews.reduce((acc, r) => acc + r.rating, 0) / p.reviews.length
               : 0;
           return { ...p, avgRating };
         })
         .sort((a, b) => b.avgRating - a.avgRating)[0];

       const image = bestProduct?.images?.[0] ?? null;
       if (!image) return null;

       return {
         label: category.label,
         value: category.value,
         image,
         _productCount: validProducts.length, // internal only
       };
     })
     .filter((c): c is { label: string; value: string; image: string; _productCount: number } => !!c)
     .sort((a, b) => b._productCount - a._productCount)
     .map(({ _productCount, ...rest }) => rest);

   return c.json({ success: true, categories: categoriesWithImages });
});

export default app;
