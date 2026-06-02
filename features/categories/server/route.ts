import { Hono } from 'hono';
import db from '@/lib/db';
import { parseStringArray } from '@/lib/json-fields';
import { sessionMiddleware } from '@/lib/session-middleware';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import cuid from 'cuid';

type CategoryProductForImage = {
  images: string;
  reviews: Array<{ rating: number }>;
};

const app = new Hono()
.get("/", async(c)=>{
   try{
      const categories = await db.category.findMany({
         select: {
           id: true,
           label: true,
           value: true,
           parentId: true,
         },
       });

    return c.json(categories);
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
         const parentExists = await db.category.findUnique({ where: { id: parentId } });
         if (!parentExists) return c.json({ error: "Parent category not found" }, 404);
         if (parentExists.parentId) return c.json({ error: "Only one level of nesting allowed" }, 400);
       }

       const existingCategory = await db.category.findUnique({
         where: { value }
       });
       if (existingCategory) {
         return c.json({ error: "Category value already exists" }, 409);
       }
       const newCategory = await db.category.create({
         data: {
           id: cuid(),
           label,
           value,
           parentId: parentId ?? null,
         },
         select: {
           label: true,
           value: true,
           parentId: true,
         }
       });
       return c.json(newCategory, 201);
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
     const category = await db.category.findUnique({
       where: { value },
       include: { children: { select: { id: true } } },
     });

     if (!category) return c.json({ success: false, error: "Category not found" }, 404);

     if (category.children.length > 0) {
       return c.json({ success: false, error: "Cannot delete category with subcategories. Delete subcategories first." }, 409);
     }

     await db.category.delete({ where: { value } });

     return c.json({ success: true, message: "Category deleted" }, 200);
   } catch (error) {
     console.error("Failed to delete category", error);
     return c.json({ success: false, error: "Failed to delete category" }, 500);
   }
 })
 .get('/category', async (c) => {
  try {
    const categories = await db.category.findMany({
      include: {
        products: {
          include: {
            reviews: true,
          },
        },
      },
    });

    const categoriesWithImages = categories
      .map((category) => {
        // The custom DB wrapper uses 'include' to populate relations.
        // If no products exist, the wrapper might return undefined or an empty array.
        const products = (category.products || []) as any[];
        if (products.length === 0) return null;

        // Filter products that actually have images (images field is a JSON string in D1)
        const productsWithImages = products.filter((p) => {
          const images = parseStringArray(p.images);
          return images.length > 0;
        });

        if (productsWithImages.length === 0) return null;

        const bestProduct = productsWithImages
          .map((p) => {
            const reviews = (p.reviews || []) as any[];
            const avgRating =
              reviews.length > 0
                ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
                : 0;
            return { ...p, avgRating };
          })
          .sort((a, b) => b.avgRating - a.avgRating)[0];

        const image = parseStringArray(bestProduct?.images)[0] ?? null;
        if (!image) return null;

        return {
          label: category.label,
          value: category.value,
          image,
          _productCount: productsWithImages.length, // internal only
        };
      })
      .filter((c): c is { label: string; value: string; image: string; _productCount: number } => !!c)
      .sort((a, b) => b._productCount - a._productCount)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ _productCount, ...rest }) => rest);

    return c.json({ success: true, categories: categoriesWithImages });
  } catch (error) {
    console.error("Failed to fetch featured categories:", error);
    return c.json({ success: false, error: "Internal Server Error" }, 500);
  }
});

 


export default app;
