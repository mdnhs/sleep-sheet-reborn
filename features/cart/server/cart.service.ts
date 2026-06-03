import db from "@/lib/db";
import { parseStringArray } from "@/lib/json-fields";
import { ServiceError } from "@/lib/service-error";
import { CartResponse } from "../type";

type CartRelationItem = {
  id: string;
  productId: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
  product?: {
    id: string;
    name: string;
    price: number;
    images: string;
    description: string;
  };
};

type AddToCartInput = {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
};

export async function addToCart(userId: string, input: AddToCartInput) {
  let cart = await db.cart.findUnique({
    where: { userId },
    include: { items: true },
  });

  if (!cart) {
    cart = await db.cart.create({ data: { userId }, include: { items: true } });
  }
  if (!cart) throw new ServiceError("Failed to create cart", 500);

  const existingItem = (cart.items as CartRelationItem[]).find(
    (item) =>
      item.productId === input.productId &&
      item.size === input.size &&
      item.color === input.color,
  );

  if (existingItem) {
    await db.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + input.quantity },
    });
  } else {
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId: input.productId,
        quantity: input.quantity,
        size: input.size,
        color: input.color,
      },
    });
  }

  return { success: true };
}

export async function updateCartItem(userId: string, cartItemId: string, quantity: number) {
  const cart = await db.cart.findFirst({ where: { userId }, select: { id: true } });
  if (!cart) throw new ServiceError("Cart not found", 404);

  const item = await db.cartItem.update({
    where: { id: cartItemId, cartId: cart.id },
    data: { quantity },
  });

  return { success: true, item };
}

export async function removeCartItem(userId: string, cartItemId: string) {
  await db.cartItem.delete({
    where: { id: cartItemId, cart: { userId } },
  });
  return { success: true };
}

export async function getCart(userId: string): Promise<CartResponse> {
  const cart = await db.cart.findUnique({
    where: { userId },
    include: {
      items: { include: { product: true }, orderBy: { createdAt: "desc" } },
    },
  });

  return {
    items:
      (cart?.items as CartRelationItem[] | undefined)?.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        size: item.size || undefined,
        color: item.color || undefined,
        product: {
          id: item.product!.id,
          name: item.product!.name,
          price: item.product!.price,
          image: parseStringArray(item.product!.images)[0],
          description: item.product!.description,
        },
      })) || [],
  };
}
