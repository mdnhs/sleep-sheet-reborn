"use client";

import { useEffect } from "react";
import { usePixelTracking } from "@/lib/meta-pixel";
import type { Product } from "@/lib/types";

/**
 * Fires the Meta Pixel ViewContent event for a product. Kept as a tiny
 * client leaf so the product page itself can stay a Server Component.
 */
export function ProductViewTracker({ product }: { product: Product }) {
  const { track } = usePixelTracking();

  useEffect(() => {
    track("ViewContent", {
      content_ids: [product.id],
      content_type: "product",
      content_name: product.name,
      content_category: product.category,
      value: product.price,
      currency: "BDT",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  return null;
}
