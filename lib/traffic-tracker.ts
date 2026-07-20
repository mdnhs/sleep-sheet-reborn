"use client";

export type TrafficEventType =
  | "page_view"
  | "product_view"
  | "add_to_cart"
  | "buy_now"
  | "search"
  | "wishlist_add"
  | "checkout_start"
  | "order_complete";

export interface TrafficEvent {
  id: string;
  type: string;
  path: string;
  label: string | null;
  meta: Record<string, string | number | boolean> | null;
  ip?: string | null;
  userAgent?: string | null;
  browser?: string | null;
  device?: string | null;
  country?: string | null;
  city?: string | null;
  createdAt: string;
}

export async function trackEvent(
  type: TrafficEventType,
  path: string,
  label?: string,
  meta?: Record<string, string | number | boolean>
) {
  try {
    await fetch("/api/traffic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, path, label, meta }),
    });
  } catch {}
}

export function getEventStats(events: TrafficEvent[]) {
  const byType: Record<string, number> = {};
  const byPath: Record<string, number> = {};
  const byBrowser: Record<string, number> = {};
  const byDevice: Record<string, number> = {};
  const byLocation: Record<string, number> = {};

  for (const e of events) {
    byType[e.type] = (byType[e.type] || 0) + 1;
    byPath[e.path] = (byPath[e.path] || 0) + 1;

    const b = e.browser || "Unknown Browser";
    byBrowser[b] = (byBrowser[b] || 0) + 1;

    const dev = e.device || "Desktop";
    byDevice[dev] = (byDevice[dev] || 0) + 1;

    const loc = e.city && e.country ? `${e.city}, ${e.country}` : e.country || e.ip || "Unknown Location";
    byLocation[loc] = (byLocation[loc] || 0) + 1;
  }

  const topPages = Object.entries(byPath)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topBrowsers = Object.entries(byBrowser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topDevices = Object.entries(byDevice)
    .sort((a, b) => b[1] - a[1]);

  const topLocations = Object.entries(byLocation)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const byHour: Record<number, number> = {};
  for (const e of events) {
    const hour = new Date(e.createdAt).getHours();
    byHour[hour] = (byHour[hour] || 0) + 1;
  }

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    name: `${i.toString().padStart(2, "0")}:00`,
    value: byHour[i] || 0,
  }));

  return { byType, byPath, topPages, topBrowsers, topDevices, topLocations, hourlyData };
}
