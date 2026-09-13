import type {
  GtmAddToCartPayload,
  GtmBeginCheckoutPayload,
  GtmEcommerceItem,
  GtmPurchasePayload,
  GtmRemoveFromCartPayload,
  GtmUserData,
  GtmViewItemPayload,
} from "./events";

export * from "./events";

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }
}

const trackedGtmPurchaseIds = new Set<string>();

/**
 * Format raw phone number into standard E.164 format for Google Ads Enhanced Conversions.
 */
export function formatE164Phone(rawPhone?: string | null): string | undefined {
  if (!rawPhone) return undefined;
  const digits = rawPhone.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("880") && digits.length >= 13) return `+${digits}`;
  if (digits.startsWith("01") && digits.length === 11) return `+88${digits}`;
  if (digits.length === 10 && digits.startsWith("1")) return `+880${digits}`;
  return rawPhone.startsWith("+") ? rawPhone : `+${digits}`;
}

/**
 * Split a full name into first and last name for Google Ads user-provided data.
 */
export function splitFullName(name?: string | null): { first_name?: string; last_name?: string } {
  if (!name) return {};
  const trimmed = name.trim();
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx === -1) return { first_name: trimmed };
  return {
    first_name: trimmed.substring(0, spaceIdx).trim(),
    last_name: trimmed.substring(spaceIdx + 1).trim(),
  };
}

/**
 * Safely push an event or object to Google Tag Manager dataLayer.
 */
export function pushToDataLayer(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  } catch (error) {
    console.error("[GTM] Failed to push to dataLayer:", error);
  }
}

/**
 * Standard GA4 Ecommerce event pusher:
 * Google Tag Manager best practice requires clearing previous `ecommerce`
 * object before pushing a new ecommerce event to avoid key pollution.
 */
export function trackGtmEcommerce(
  event: "purchase" | "add_to_cart" | "remove_from_cart" | "begin_checkout" | "view_item" | string,
  ecommerce: Record<string, unknown>,
  extraData?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;

  pushToDataLayer({ ecommerce: null });
  pushToDataLayer({
    event,
    ...extraData,
    ecommerce,
  });
}

/**
 * Track GA4 & Google Ads Purchase event with deduplication guard and Enhanced Conversions.
 * Returns true if event was pushed, false if already tracked.
 */
export function trackGtmPurchase(payload: GtmPurchasePayload): boolean {
  if (!payload || !payload.transaction_id) return false;

  const orderId = String(payload.transaction_id);
  const rawOrderId = payload.order_id ? String(payload.order_id) : undefined;
  const guardKey = `gtm_purchase_tracked_${orderId}`;
  const rawGuardKey = rawOrderId ? `gtm_purchase_tracked_${rawOrderId}` : undefined;

  let alreadyTracked =
    trackedGtmPurchaseIds.has(orderId) ||
    (rawOrderId ? trackedGtmPurchaseIds.has(rawOrderId) : false);

  if (typeof window !== "undefined") {
    try {
      alreadyTracked =
        alreadyTracked ||
        sessionStorage.getItem(guardKey) === "1" ||
        (rawGuardKey ? sessionStorage.getItem(rawGuardKey) === "1" : false);
    } catch {
      /* sessionStorage unavailable */
    }
  }

  if (alreadyTracked) {
    return false;
  }

  trackedGtmPurchaseIds.add(orderId);
  if (rawOrderId) trackedGtmPurchaseIds.add(rawOrderId);

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(guardKey, "1");
      if (rawGuardKey) sessionStorage.setItem(rawGuardKey, "1");
    } catch {
      /* sessionStorage unavailable */
    }
  }

  const currency = (payload.currency || "BDT")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3) || "BDT";
  const rawValue = Number(payload.value);
  const safeValue = !isNaN(rawValue) && rawValue > 0 ? Number(rawValue.toFixed(2)) : 0;

  const ecommerceData = {
    transaction_id: orderId,
    value: safeValue,
    currency,
    tax: payload.tax !== undefined ? Number(payload.tax) : 0,
    shipping: payload.shipping !== undefined ? Number(payload.shipping) : 0,
    coupon: payload.coupon,
    items: payload.items.map((item, idx) => ({
      item_id: String(item.item_id),
      item_name: item.item_name,
      currency: item.currency || currency,
      price: item.price !== undefined ? Number(item.price) : 0,
      quantity: item.quantity !== undefined ? Number(item.quantity) : 1,
      item_variant: item.item_variant,
      item_category: item.item_category,
      index: item.index ?? idx + 1,
    })),
  };

  // Google Ads Enhanced Conversions payload (fbc rides along for a GTM
  // Data Layer Variable to feed the Facebook Pixel tag's Advanced Matching —
  // Google Ads itself ignores the field).
  const userData: Record<string, unknown> | undefined = payload.user_data
    ? {
        email: payload.user_data.email || undefined,
        phone_number: formatE164Phone(payload.user_data.phone_number),
        address: payload.user_data.address
          ? {
              first_name: payload.user_data.address.first_name,
              last_name: payload.user_data.address.last_name,
              street: payload.user_data.address.street,
              city: payload.user_data.address.city,
              region: payload.user_data.address.region,
              postal_code: payload.user_data.address.postal_code,
              country: payload.user_data.address.country || "BD",
            }
          : undefined,
        fbc: payload.user_data.fbc || undefined,
      }
    : undefined;

  trackGtmEcommerce(
    "purchase",
    ecommerceData,
    userData ? { user_data: userData } : undefined
  );
  return true;
}

/**
 * Track GA4 & Google Ads Add to Cart event.
 */
export function trackGtmAddToCart(payload: GtmAddToCartPayload): void {
  if (!payload || !payload.items?.length) return;

  if (typeof window !== "undefined") {
    try {
      const firstId = payload.items[0]?.item_id || "";
      const key = `gtm_add_to_cart_${firstId}`;
      const last = sessionStorage.getItem(key);
      const now = Date.now();
      if (last && now - Number(last) < 2000) {
        return;
      }
      sessionStorage.setItem(key, String(now));
    } catch {
      /* ignore */
    }
  }

  const currency = (payload.currency || "BDT")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3) || "BDT";
  const numValue = payload.value !== undefined ? Number(payload.value) : undefined;
  const safeValue = numValue !== undefined && !isNaN(numValue) && numValue > 0 ? Number(numValue.toFixed(2)) : undefined;

  const ecommerceData = {
    currency,
    value: safeValue,
    items: payload.items.map((item, idx) => ({
      item_id: String(item.item_id),
      item_name: item.item_name,
      currency: item.currency || currency,
      price: item.price !== undefined ? Number(item.price) : 0,
      quantity: item.quantity !== undefined ? Number(item.quantity) : 1,
      item_variant: item.item_variant,
      item_category: item.item_category,
      index: item.index ?? idx + 1,
    })),
  };

  trackGtmEcommerce("add_to_cart", ecommerceData);
}

/**
 * Track GA4 & Google Ads Begin Checkout event.
 */
export function trackGtmBeginCheckout(payload: GtmBeginCheckoutPayload): void {
  if (!payload || !payload.items?.length) return;

  if (typeof window !== "undefined") {
    try {
      const last = sessionStorage.getItem("gtm_begin_checkout_ts");
      const now = Date.now();
      if (last && now - Number(last) < 8000) {
        // Skip duplicate begin_checkout if fired within 8s (e.g. Buy Now button followed by /checkout page load)
        return;
      }
      sessionStorage.setItem("gtm_begin_checkout_ts", String(now));
    } catch {
      /* ignore */
    }
  }

  const currency = (payload.currency || "BDT")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3) || "BDT";
  const numValue = payload.value !== undefined ? Number(payload.value) : undefined;
  const safeValue = numValue !== undefined && !isNaN(numValue) && numValue > 0 ? Number(numValue.toFixed(2)) : undefined;

  const ecommerceData = {
    currency,
    value: safeValue,
    coupon: payload.coupon,
    items: payload.items.map((item, idx) => ({
      item_id: String(item.item_id),
      item_name: item.item_name,
      currency: item.currency || currency,
      price: item.price !== undefined ? Number(item.price) : 0,
      quantity: item.quantity !== undefined ? Number(item.quantity) : 1,
      item_variant: item.item_variant,
      item_category: item.item_category,
      index: item.index ?? idx + 1,
    })),
  };

  trackGtmEcommerce("begin_checkout", ecommerceData);
}

/**
 * Track GA4 View Item (Product Details) event.
 */
export function trackGtmViewItem(payload: GtmViewItemPayload): void {
  if (!payload || !payload.items?.length) return;

  const currency = payload.currency || "BDT";
  const ecommerceData = {
    currency,
    value: payload.value !== undefined ? Number(payload.value) : undefined,
    items: payload.items.map((item, idx) => ({
      item_id: String(item.item_id),
      item_name: item.item_name,
      currency: item.currency || currency,
      price: item.price !== undefined ? Number(item.price) : 0,
      quantity: item.quantity !== undefined ? Number(item.quantity) : 1,
      item_variant: item.item_variant,
      item_category: item.item_category,
      index: item.index ?? idx + 1,
    })),
  };

  trackGtmEcommerce("view_item", ecommerceData);
}

/**
 * Track GA4 Remove from Cart event.
 */
export function trackGtmRemoveFromCart(payload: GtmRemoveFromCartPayload): void {
  if (!payload || !payload.items?.length) return;

  const currency = payload.currency || "BDT";
  const ecommerceData = {
    currency,
    value: payload.value !== undefined ? Number(payload.value) : undefined,
    items: payload.items.map((item, idx) => ({
      item_id: String(item.item_id),
      item_name: item.item_name,
      currency: item.currency || currency,
      price: item.price !== undefined ? Number(item.price) : 0,
      quantity: item.quantity !== undefined ? Number(item.quantity) : 1,
      item_variant: item.item_variant,
      item_category: item.item_category,
      index: item.index ?? idx + 1,
    })),
  };

  trackGtmEcommerce("remove_from_cart", ecommerceData);
}

/**
 * Track GA4 Search event with search term.
 */
export function trackGtmSearch(searchTerm: string): void {
  if (!searchTerm || !searchTerm.trim()) return;
  const term = searchTerm.trim();
  pushToDataLayer({
    event: "search",
    search_term: term,
  });
}

