import { hash, hashPhone } from "@/lib/meta-capi";
import { purchaseEventId } from "@/lib/meta-purchase-event";

/**
 * Sends a confirmed order's Purchase to the GTM *server* container
 * (ss.sleepsheetbd.com), so one event reaches both Google and Meta through the
 * tags that container already has: "GA4 - All Events" and "Meta CAPI - All
 * Events", each triggered by every incoming event.
 *
 * Why the server container and not the web one. The web container runs in the
 * customer's browser. Confirmation happens in the *admin's* browser, hours
 * after the order, so a dataLayer push from there would report the sale under
 * the admin's cookies, IP and device. The app's server can reach the server
 * container directly instead, using the GA4 Measurement Protocol path
 * (/mp/collect) that the container's GA4 client claims.
 *
 * Field names below follow the Stape "Facebook Conversion API" tag's own source
 * (the container export), not guesswork: it reads `event_id || transaction_id`
 * for dedup, `fbc`, `external_id`, `page_location`, `test_event_code` and
 * `user_data.sha256_email_address` / `user_data.phone_number` off the event.
 */

export interface GtmPurchaseConfig {
  /** Server container base URL, https, no trailing slash. */
  endpoint: string;
  /** GA4 Measurement ID (G-XXXX) the container's GA4 tag forwards to. */
  measurementId: string;
  apiSecret?: string;
  /** Meta Test Events code; the Stape tag reads `test_event_code` off the event. */
  testEventCode?: string;
}

export type GtmPurchaseReadiness =
  | { ready: true; config: GtmPurchaseConfig }
  | {
      ready: false;
      /** `not_configured` means the feature is simply not set up, not that it is broken. */
      reason: "not_configured" | "invalid_endpoint" | "missing_measurement_id";
      message: string;
    };

const HTTPS_ORIGIN = /^https:\/\/[^\s/]+$/i;

/** The origin with any trailing slash removed, or undefined if it is not a plain https origin. */
export function normalizeEndpoint(raw?: string | null): string | undefined {
  const value = (raw ?? "").trim().replace(/\/+$/, "");
  return HTTPS_ORIGIN.test(value) ? value : undefined;
}

export function extractMeasurementId(raw?: string | null): string | undefined {
  const match = (raw ?? "").match(/G-[A-Z0-9]{6,}/i);
  return match ? match[0].toUpperCase() : undefined;
}

/** Decide whether GTM dispatch is usable from the stored settings, and say why not. */
export function evaluateGtmPurchaseSettings(
  settings: Record<string, string | undefined>,
): GtmPurchaseReadiness {
  const rawEndpoint = (settings.gtm_purchase_endpoint ?? "").trim();
  if (!rawEndpoint) {
    return {
      ready: false,
      reason: "not_configured",
      message: "No GTM server container URL is set. Add it under Settings > Purchase events.",
    };
  }

  const endpoint = normalizeEndpoint(rawEndpoint);
  if (!endpoint) {
    return {
      ready: false,
      reason: "invalid_endpoint",
      message: "The GTM server container URL must be an https address such as https://ss.example.com. Fix it under Settings > Purchase events.",
    };
  }

  const measurementId = extractMeasurementId(settings.google_analytics_id);
  if (!measurementId) {
    return {
      ready: false,
      reason: "missing_measurement_id",
      message: "No GA4 Measurement ID (G-XXXX) is set, and the server container's GA4 tag needs one. Add it under Settings > SEO.",
    };
  }

  return {
    ready: true,
    config: {
      endpoint,
      measurementId,
      apiSecret: settings.gtm_purchase_api_secret?.trim() || undefined,
      testEventCode: settings.meta_capi_test_event_code?.trim() || undefined,
    },
  };
}

export interface PurchaseOrderInput {
  id: string;
  orderNumber: string | null;
  totalAmount: number;
  shippingCost: number;
  userId: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  fbc: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  items: {
    id: string;
    productId: string | null;
    quantity: number;
    price: number;
    product?: { name: string } | null;
  }[];
}

export interface GtmPurchaseRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

export function buildGtmPurchaseRequest(
  order: PurchaseOrderInput,
  config: GtmPurchaseConfig,
  sourceUrl?: string,
): GtmPurchaseRequest {
  const orderNumber = order.orderNumber || order.id;

  const total = Number(order.totalAmount);
  // Meta rejects a Purchase with no value, so a missing one is not sent as 0.
  const value = Number.isFinite(total) && total > 0 ? Number(total.toFixed(2)) : 0.01;

  const email = hash(order.guestEmail);
  const phone = hashPhone(order.guestPhone);
  const userData: Record<string, unknown> = {};
  if (email) userData.sha256_email_address = [email];
  if (phone) {
    // GA4's own key, plus the one the Stape tag actually reads
    // (`user_data.phone_number`); it accepts a value that is already hashed.
    userData.sha256_phone_number = [phone];
    userData.phone_number = phone;
  }

  const params: Record<string, unknown> = {
    transaction_id: orderNumber,
    // Same key the browser events carry, so the container's Meta tag and any
    // other path agree on the dedup id: `purchase_<order number>`.
    event_id: purchaseEventId(orderNumber),
    value,
    currency: "BDT",
    shipping: Number(order.shippingCost) || 0,
    items: order.items.map((item) => ({
      item_id: item.productId || item.id,
      item_name: item.product?.name,
      price: Number(item.price),
      quantity: item.quantity,
    })),
    engagement_time_msec: 1,
  };
  // The Stape tag uses page_location as Meta's event_source_url, which Meta
  // requires on website events; there is no browser request to take it from.
  if (sourceUrl) params.page_location = sourceUrl;
  if (order.fbc) params.fbc = order.fbc;
  if (order.userId) params.external_id = order.userId;
  if (config.testEventCode) params.test_event_code = config.testEventCode;

  const payload: Record<string, unknown> = {
    // No GA client id was captured at checkout, so this is a stable id per
    // customer rather than per order: repeat buyers share one GA4 user instead
    // of each confirmed order adding a new one.
    client_id: `srv.${order.userId ?? order.id}`,
    events: [{ name: "purchase", params }],
  };
  if (Object.keys(userData).length > 0) payload.user_data = userData;
  if (order.ipAddress) payload.ip_override = order.ipAddress;

  const query = new URLSearchParams({ measurement_id: config.measurementId });
  if (config.apiSecret) query.set("api_secret", config.apiSecret);

  return {
    url: `${config.endpoint}/mp/collect?${query.toString()}`,
    headers: {
      "Content-Type": "application/json",
      // The container reads the user agent off the request, so pass the
      // customer's rather than this server's.
      "User-Agent": order.userAgent || "sleep-sheet-server",
    },
    body: JSON.stringify(payload),
  };
}

export type GtmSendResult = { ok: true } | { ok: false; status?: number; detail: string };

/** POST the request to the server container. Never throws. */
export async function sendGtmPurchase(
  request: GtmPurchaseRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<GtmSendResult> {
  // The api_secret rides in the query string, so keep it out of the logs.
  const safeUrl = request.url.replace(/api_secret=[^&]*/i, "api_secret=***");
  try {
    const res = await fetchImpl(request.url, {
      method: "POST",
      headers: request.headers,
      body: request.body,
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return { ok: true };
    console.error("[GtmPurchase] server container refused the event", res.status, safeUrl);
    return { ok: false, status: res.status, detail: `HTTP ${res.status}` };
  } catch (err) {
    console.error("[GtmPurchase] request to the server container failed", safeUrl, err);
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}
