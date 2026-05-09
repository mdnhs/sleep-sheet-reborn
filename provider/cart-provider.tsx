"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCart, addGuestItem } from "@/features/cart/state/cart-slice";
import { useCurrent } from "@/features/auth/api/use-current";
import { CartItem } from "@/features/cart/type";

const GUEST_CART_KEY = "guest-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { data: user } = useCurrent();
  const guestItems = useAppSelector((state) => state.cart.guestItems);

  // Restore guest cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(GUEST_CART_KEY);
      if (saved) {
        const items: CartItem[] = JSON.parse(saved);
        items.forEach((item) => dispatch(addGuestItem(item)));
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
      dispatch(fetchCart());
    }
  }, [user, dispatch]);

  return <>{children}</>;
}
