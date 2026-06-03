import db from "@/lib/db";
import { parseStringArray } from "@/lib/json-fields";
import { ServiceError } from "@/lib/service-error";

type WishlistRelationItem = {
  id: string;
  product: { id: string; name: string; price: number; images: string };
};

export async function addToWishlist(userId: string, productId: string) {
  let wishlist = await db.wishlist.findUnique({ where: { userId } });
  if (!wishlist) {
    wishlist = await db.wishlist.create({ data: { userId } });
  }

  const existingItem = await db.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist?.id as string, productId } },
  });

  if (existingItem) {
    return { success: false, message: "Product already in wishlist" };
  }

  await db.wishlistItem.create({
    data: { wishlistId: wishlist?.id as string, productId },
  });

  return { success: true, message: "Product added to wishlist" };
}

export async function getWishlist(userId: string) {
  const wishlist = await db.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        select: {
          id: true,
          product: { select: { id: true, name: true, price: true, images: true } },
        },
      },
    },
  });

  return wishlist
    ? {
        success: true,
        data: {
          wishlistId: wishlist.id,
          items: (wishlist.items as WishlistRelationItem[]).map((item) => ({
            id: item.id,
            product: { ...item.product, images: parseStringArray(item.product.images) },
          })),
        },
      }
    : { success: false, error: "No wishlist found" };
}

export async function removeFromWishlist(userId: string, productId: string) {
  const wishlist = await db.wishlist.findUnique({ where: { userId } });
  if (!wishlist) throw new ServiceError("Wishlist not found", 404);

  await db.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId } });
  return { success: true, message: "Product removed from wishlist" };
}
