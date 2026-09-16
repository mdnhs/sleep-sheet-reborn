"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/traffic-tracker";
import { trackGtmViewItem } from "@/lib/gtm";
import type { Product } from "@/lib/types";

/**
 * Pushes the GA4 view_item event for a product. Kept as a tiny client leaf so
 * the product page itself can stay a Server Component.
 *
 * The Meta Pixel ViewContent this used to fire alongside is gone: the GTM web
 * container fires it from this same dataLayer push, and the app firing its
 * own was a second, uncoordinated copy of the event.
 */
export function ProductViewTracker({ product }: { product: Product }) {
  const firedForProduct = useRef<string | null>(null);

  useEffect(() => {
    // This used to wait on the Pixel SDK being initialized, which also held
    // the GA4 push back for no reason — the dataLayer needs nothing from the
    // Pixel. With the Pixel gone the push happens on mount.
    //
    // Guards against React StrictMode's dev-mode double-invoke of this
    // effect, which otherwise fires view_item twice per page load.
    if (firedForProduct.current === product.id) return;
    firedForProduct.current = product.id;

    trackGtmViewItem({
      currency: "BDT",
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price,
          quantity: 1,
        },
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

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
