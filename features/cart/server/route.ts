import { sessionMiddleware } from "@/lib/session-middleware";
import { Hono } from "hono";
import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

import prisma from "@/lib/prisma";
import { parseStringArray } from "@/lib/json-fields";
import { CartResponse } from "../type";

const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1),
  size: z.string().optional(),
  color: z.string().optional(),
});

const app = new Hono()


  .post("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const parsed = addToCartSchema.safeParse(body);
    
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    try {
      let cart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: { items: true },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId: user.id },
          include: { items: true },
        });
      }

      const existingItem = cart.items.find(item =>
        item.productId === parsed.data.productId &&
        item.size === parsed.data.size &&
        item.color === parsed.data.color
      );

      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + parsed.data.quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: parsed.data.productId,
            quantity: parsed.data.quantity,
            size: parsed.data.size,
            color: parsed.data.color,
          },
        });
      }

      return c.json({ success: true });
    } catch (error) {
      console.error("Add to cart error:", error);
      return c.json({ error: "Failed to add to cart" }, 500);
    }
  })

.put("/", sessionMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const schema = z.object({
    cartItemId: z.string(),
    quantity: z.number().min(1),
  });

  const parsed = schema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  try {
    const cart = await prisma.cart.findFirst({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!cart) {
      return c.json({ error: "Cart not found" }, 404);
    }

    const item = await prisma.cartItem.update({
      where: { 
        id: parsed.data.cartItemId,
        cartId: cart.id 
      },
      data: { quantity: parsed.data.quantity },
    });

    return c.json({ success: true, item });
  } catch (error) {
    console.error("Update cart error:", error);
    
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return c.json({ error: "Cart item not found" }, 404);
      }
    }
    
    
    return c.json({ error: "Failed to update cart item" }, 500);
  }
})

  .delete("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const schema = z.object({ cartItemId: z.string() });
    const parsed = schema.safeParse(await c.req.json());
    
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    try {
      await prisma.cartItem.delete({
        where: { 
          id: parsed.data.cartItemId,
          cart: { userId: user.id }
        },
      });
      return c.json({ success: true });
    } catch (error) {
      console.error("Delete cart error:", error);
      return c.json({ error: "Failed to remove cart item" }, 500);
    }
  })

  .get("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
      const cart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: { product: true },
            orderBy: { createdAt: "desc" }
          },
        },
      });

      const response: CartResponse = {
        items: cart?.items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          size: item.size || undefined,
          color: item.color || undefined,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            image: parseStringArray(item.product.images)[0],
            description: item.product.description
          }
        })) || []
      };

      return c.json(response);
    } catch (error) {
      console.error("Fetch cart error:", error);
      return c.json({ error: "Failed to fetch cart items" }, 500);
    }
  });

export default app;