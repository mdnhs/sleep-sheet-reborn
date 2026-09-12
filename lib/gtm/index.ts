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
    dataLayer: any[];
    gtag: (...args: any[]) => void;
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
export function pushToDataLayer(payload: Record<string, any>): void {
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
  ecommerce: Record<string, any>,
  extraData?: Record<string, any>
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

  const currency = payload.currency || "BDT";
  const ecommerceData = {
    transaction_id: orderId,
    value: Number(payload.value) || 0,
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

  // Google Ads Enhanced Conversions payload
  const userData: Record<string, any> | undefined = payload.user_data
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

  trackGtmEcommerce("add_to_cart", ecommerceData);
}

/**
 * Track GA4 & Google Ads Begin Checkout event.
 */
export function trackGtmBeginCheckout(payload: GtmBeginCheckoutPayload): void {
  if (!payload || !payload.items?.length) return;

  const currency = payload.currency || "BDT";
  const ecommerceData = {
    currency,
    value: payload.value !== undefined ? Number(payload.value) : undefined,
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

