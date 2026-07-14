"use client";

import { useEffect, useRef } from "react";
import { usePixelTracking } from "@/lib/meta-pixel";
import { trackEvent } from "@/lib/traffic-tracker";
import type { Product } from "@/lib/types";

/**
 * Fires the Meta Pixel ViewContent event for a product. Kept as a tiny
 * client leaf so the product page itself can stay a Server Component.
 */
export function ProductViewTracker({ product }: { product: Product }) {
  const { track, isReady } = usePixelTracking();
  const firedForProduct = useRef<string | null>(null);

  useEffect(() => {
    // Wait until the Pixel SDK is initialized. On this server-rendered page
    // the tracker mounts before the PixelProvider finishes init, so firing
    // immediately would hit an uninitialized `fbq`.
    if (!isReady) return;
    // Guards against React StrictMode's dev-mode double-invoke of this
    // effect, which otherwise fires ViewContent twice per page load.
    if (firedForProduct.current === product.id) return;
    firedForProduct.current = product.id;
    track("ViewContent", {
      content_ids: [product.id],
      content_type: "product",
      content_name: product.name,
      content_category: product.category,
      value: product.price,
      currency: "BDT",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, product.id]);

  useEffect(() => {
    const guardKey = `traffic_pv_tracked_${product.id}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(guardKey)) return;
    trackEvent("product_view", `/shop/${product.id}`, product.name, {
      productId: product.id,
      price: product.price,
    });
    sessionStorage.setItem(guardKey, "1");
  }, []);

  return null;
}
