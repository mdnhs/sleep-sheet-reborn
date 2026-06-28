"use client";

import { useEffect } from "react";
import { useCurrent } from "@/features/auth/api/use-current";
import { CartItem } from "@/features/cart/type";
import { useCartStore } from "@/features/cart/state/use-cart-store";

const GUEST_CART_KEY = "guest-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useCurrent();
  const guestItems = useCartStore((state) => state.guestItems);
  const addGuestItem = useCartStore((state) => state.addGuestItem);
  const fetchCart = useCartStore((state) => state.fetchCart);

  // Restore guest cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(GUEST_CART_KEY);
      if (saved) {
        const items: CartItem[] = JSON.parse(saved);
        items.forEach((item) => addGuestItem(item));
      }
    } catch {
      // ignore parse errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist guest cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestItems));
    } catch {
      // ignore storage errors
    }
  }, [guestItems]);

  // Fetch DB cart when user is logged in
  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user, fetchCart]);

  return <>{children}</>;
}
