import { createHash } from "crypto";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { orders, siteSettings } from "@/db/schema";
import { purchaseEventId } from "@/lib/meta-purchase-event";

/**
 * Meta Conversions API (server-side) sender.
 *
 * Recovers Purchase (and other) events that the browser Pixel loses to
 * iOS ATT, Safari ITP and ad blockers, and boosts Event Match Quality by
 * sending hashed customer data (email/phone/name). Events are deduplicated
 * against the browser Pixel via a shared `event_id`.
 *
 * No-ops silently unless META_CAPI_ACCESS_TOKEN and a pixel/dataset id are
 * configured, so it is safe to deploy before the token exists.
 */

const GRAPH_VERSION = "v21.0";

interface CapiConfig {
  enabled: boolean;
  pixelId: string;
  accessToken: string;
  testEventCode: string;
}

/**
 * Load CAPI config from admin panel settings (siteSettings table), falling
 * back to env vars. Configure it under Dashboard → Settings → Meta Pixel →
 * Conversions API. Env vars are only a deploy-time fallback.
 */
async function loadCapiConfig(): Promise<CapiConfig> {
  const keys = [
    "meta_capi_enabled",
    "meta_capi_pixel_id",
    "meta_capi_access_token",
    "meta_capi_test_event_code",
    "meta_pixel_default_id",
  ];

  let map: Record<string, string> = {};
  try {
    const rows = await db
      .select()
      .from(siteSettings)
      .where(inArray(siteSettings.key, keys));
    map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch (err) {
    console.error("[MetaCAPI] failed to load settings", err);
  }

  return {
    // Enabled unless explicitly turned off in the admin panel.
    enabled: map.meta_capi_enabled !== "false",
    pixelId:
      map.meta_capi_pixel_id ||
      map.meta_pixel_default_id ||
      process.env.META_PIXEL_ID ||
      process.env.NEXT_PUBLIC_DEFAULT_PIXEL_ID ||
      "",
    accessToken:
      map.meta_capi_access_token || process.env.META_CAPI_ACCESS_TOKEN || "",
    testEventCode:
      map.meta_capi_test_event_code || process.env.META_TEST_EVENT_CODE || "",
  };
}

/** SHA-256 hash a normalized string, per Meta's PII hashing spec. */
function hash(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Normalize a Bangladeshi phone to E.164 digits (country code, no +).
 * "01712345678" -> "8801712345678". Falls back to raw digits otherwise.
 */
function normalizePhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("0") && digits.length === 11) {
    digits = "880" + digits.slice(1);
  } else if (digits.length === 10 && digits.startsWith("1")) {
    digits = "880" + digits;
  }
  return digits;
}

function hashPhone(phone: string | null | undefined): string | undefined {
  const normalized = normalizePhone(phone);
  if (!normalized) return undefined;
  return createHash("sha256").update(normalized).digest("hex");
}

/** Read a cookie value out of a raw Cookie header string. */
function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export interface CapiRequestContext {
  cookieHeader?: string;
  userAgent?: string;
  ipAddress?: string;
  sourceUrl?: string;
}

export interface CapiPurchaseInput {
  eventId: string;
  value: number;
  currency: string;
  orderId: string;
  contents: { id: string; quantity: number; item_price: number }[];
  numItems: number;
  customer?: {
    email?: string | null;
    phone?: string | null;
    fullName?: string | null;
  };
}

/** Build the request context from a Hono/Fetch request's headers. */
export function capiContextFromHeaders(headers: Headers): CapiRequestContext {
  const forwarded = headers.get("x-forwarded-for") || "";
  return {
    cookieHeader: headers.get("cookie") || undefined,
    userAgent: headers.get("user-agent") || undefined,
    ipAddress: forwarded.split(",")[0]?.trim() || undefined,
    sourceUrl: headers.get("referer") || undefined,
  };
}

/**
 * Send a server-side Purchase event to Meta. Awaitable but never throws —
 * a CAPI failure must not break checkout. Returns true on a 2xx response.
 */
export async function sendPurchaseEvent(
  input: CapiPurchaseInput,
  ctx: CapiRequestContext = {},
): Promise<boolean> {
  const config = await loadCapiConfig();
  if (!config.enabled || !config.pixelId || !config.accessToken) return false;

  const [firstName, ...rest] = (input.customer?.fullName || "").trim().split(/\s+/);
  const lastName = rest.join(" ");

  // Meta expects each hashed field as an array of hashes.
  const arr = (h: string | undefined) => (h ? [h] : undefined);

  const userData: Record<string, unknown> = {
    em: arr(hash(input.customer?.email)),
    ph: arr(hashPhone(input.customer?.phone)),
    fn: arr(hash(firstName)),
    ln: arr(hash(lastName)),
    fbp: readCookie(ctx.cookieHeader, "_fbp"),
    fbc: readCookie(ctx.cookieHeader, "_fbc"),
    client_ip_address: ctx.ipAddress,
    client_user_agent: ctx.userAgent,
  };
  // Strip undefined keys so we never send empty fields.
  for (const k of Object.keys(userData)) {
    if (userData[k] === undefined) delete userData[k];
  }

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        event_source_url:
          ctx.sourceUrl ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          process.env.NEXT_PUBLIC_APP_URL,
        action_source: "website",
        user_data: userData,
        custom_data: {
          currency: input.currency,
          value: input.value,
          order_id: input.orderId,
          content_type: "product",
          content_ids: input.contents.map((c) => c.id),
          contents: input.contents,
          num_items: input.numItems,
        },
      },
    ],
  };

  if (config.testEventCode) payload.test_event_code = config.testEventCode;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${config.pixelId}/events?access_token=${encodeURIComponent(
        config.accessToken,
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("[MetaCAPI] Purchase failed", res.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[MetaCAPI] Purchase error", err);
    return false;
  }
}

/**
 * Send a server-side Purchase exactly once per order.
 *
 * The real fix for over-counting: before sending, we atomically claim the
 * right to send by stamping `orders.metaPurchaseEventSentAt` only if it is
 * still null (a single conditional UPDATE, so it is race-safe even under
 * concurrent requests). If the claim returns no row, a Purchase was already
 * sent for this order and we skip — so retries, re-processing, or any future
 * status-change hook can never fire a second CAPI Purchase. If the send fails
 * we release the claim so a later attempt can retry.
 *
 * `input.eventId` is ignored here — the dedup key is always
 * `purchaseEventId(orderId)` so it is guaranteed identical to the browser
 * Pixel's `eventID`.
 */
export async function sendPurchaseEventOnce(
  input: CapiPurchaseInput,
  ctx: CapiRequestContext = {},
): Promise<boolean> {
  let claimed: { id: string }[] = [];
  try {
    claimed = await db
      .update(orders)
      .set({ metaPurchaseEventSentAt: new Date() })
      .where(
        and(
          eq(orders.id, input.orderId),
          isNull(orders.metaPurchaseEventSentAt),
        ),
      )
      .returning({ id: orders.id });
  } catch (err) {
    console.error("[MetaCAPI] Purchase claim failed", err);
    return false;
  }

  // Someone already sent (or is sending) the Purchase for this order.
  if (claimed.length === 0) return false;

  const ok = await sendPurchaseEvent(
    { ...input, eventId: purchaseEventId(input.orderId) },
    ctx,
  );

  if (!ok) {
    // Release the claim so a subsequent attempt can retry the send.
    try {
      await db
        .update(orders)
        .set({ metaPurchaseEventSentAt: null })
        .where(eq(orders.id, input.orderId));
    } catch (err) {
      console.error("[MetaCAPI] Purchase claim release failed", err);
    }
  }

  return ok;
}
