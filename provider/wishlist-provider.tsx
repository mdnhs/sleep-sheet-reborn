"use client";

import { createContext, useContext, useMemo } from "react";
import { useWishlist } from "@/features/wishlist/api/use-wishlist";

interface WishlistContextValue {
  /** Product ids currently in the wishlist. O(1) membership lookups for cards. */
  wishlistIds: Set<string>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * Fetches the wishlist once for the whole client subtree. Cards read membership
 * from this context instead of each calling `useWishlist`, avoiding redundant
 * subscriptions/re-renders. The single query is still shared via React Query.
 */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data } = useWishlist();

  const wishlistIds = useMemo(
    () => new Set(data?.items.map((item) => item.product.id) ?? []),
    [data],
  );

  return (
    <WishlistContext.Provider value={{ wishlistIds }}>{children}</WishlistContext.Provider>
  );
}

export function useWishlistContext() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlistContext must be used within a WishlistProvider");
  }
  return ctx;
}
