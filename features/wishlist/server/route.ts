import { sessionMiddleware } from "@/lib/session-middleware";
import { Hono } from "hono";
import { z } from "zod";
import prisma from '@/lib/prisma';



const WishlistSchema = z.object({
    productId: z.string().min(1),
  });
  
const app = new Hono()
.post("/",sessionMiddleware,async(c)=>{
    const user = c.get("user");
    if (!user) {
        return c.json(
          { success: false, error: "UnAuthorized" }, 
          403
        );
      }

      const body = await c.req.json();

    
      const parsed = WishlistSchema.safeParse(body);
      if(!parsed.success){
        return c.json({success:false, error:"invalid Input"},400)
      }

      const {productId}= parsed.data;

      let wishlist = await prisma?.wishlist.findUnique({
        where:{userId:user.id}
      });

      if (!wishlist) {
        wishlist = await prisma?.wishlist.create({
          data: { userId: user.id },
        });
      }

      const existingItem = await prisma?.wishlistItem.findUnique({
        where: {
          wishlistId_productId: {
            wishlistId: wishlist?.id as string,
            productId,
          },
        },
      });

      if (existingItem) {
        return c.json({ success: false, message: "Product already in wishlist" });
      }

      await prisma?.wishlistItem.create({
        data: {
          wishlistId: wishlist?.id as string,
          productId,
        },
      });

      return c.json({ success: true, message: "Product added to wishlist" });
})

.get("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 403);
  
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          select: {
            id: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
              },
            },
          },
        },
      },
    });

    const response = wishlist ? {
      success: true,
      data: {
        wishlistId: wishlist.id,
        items: wishlist.items.map((item) => ({
          id: item.id,
          product: item.product,
        })),
      }
    } : { success: false, error: "No wishlist found" };
  
    return c.json(response);
  })
  
   .delete("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 403);
  
    const body = await c.req.json();
    const parsed = WishlistSchema.safeParse(body);
    if (!parsed.success) return c.json({ success: false, error: "Invalid input" }, 400);
  
    const { productId } = parsed.data;
  
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: user.id },
    });
  
    if (!wishlist) {
      return c.json({ success: false, error: "Wishlist not found" }, 404);
    }
  
    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
    });
  
    return c.json({ success: true, message: "Product removed from wishlist" });
  });
  
  export default app;

  
  
  
  
  
  
  