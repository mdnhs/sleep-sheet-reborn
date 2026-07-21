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
    // Send event to internal database traffic API
    await fetch("/api/traffic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, path, label, meta }),
    });

    // Forward event to Google Analytics (gtag) if loaded
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", type, {
        page_path: path,
        event_label: label,
        ...meta,
      });
    }
  } catch {}
}

export function getEventStats(events: TrafficEvent[]) {
  const byType: Record<string, number> = {};
  const byPath: Record<string, number> = {};
  const byBrowser: Record<string, number> = {};
  const byDevice: Record<string, number> = {};
  const byOS: Record<string, number> = {};
  const byLocation: Record<string, number> = {};

  for (const e of events) {
    byType[e.type] = (byType[e.type] || 0) + 1;
    byPath[e.path] = (byPath[e.path] || 0) + 1;

    const b = e.browser || "Unknown Browser";
    byBrowser[b] = (byBrowser[b] || 0) + 1;

    const dev = e.device || "Desktop";
    byDevice[dev] = (byDevice[dev] || 0) + 1;

    // Detect Phone / Computer OS from userAgent
    let os = "Other OS";
    const ua = e.userAgent || "";
    if (/android/i.test(ua)) os = "Android";
    else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
    else if (/windows/i.test(ua)) os = "Windows";
    else if (/mac os x|macintosh/i.test(ua)) os = "macOS";
    else if (/linux/i.test(ua)) os = "Linux";

    byOS[os] = (byOS[os] || 0) + 1;

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

  const topOS = Object.entries(byOS)
    .sort((a, b) => b[1] - a[1]);

  const topLocations = Object.entries(byLocation)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Detailed Unique Locations Map
  const locationMap: Record<
    string,
    {
      locName: string;
      city: string;
      country: string;
      ips: Set<string>;
      hits: number;
      paths: Record<string, number>;
      devices: Record<string, number>;
      lastVisitedAt: string;
    }
  > = {};

  for (const e of events) {
    const locName = e.city && e.country ? `${e.city}, ${e.country}` : e.country || e.ip || "Dhaka, Bangladesh";
    const city = e.city || locName.split(",")[0] || "Dhaka";
    const country = e.country || (locName.includes(",") ? locName.split(",")[1].trim() : "Bangladesh");
    const ip = e.ip || "127.0.0.1";
    const dev = e.device || "Desktop";

    if (!locationMap[locName]) {
      locationMap[locName] = {
        locName,
        city,
        country,
        ips: new Set<string>(),
        hits: 0,
        paths: {},
        devices: {},
        lastVisitedAt: e.createdAt,
      };
    }

    const loc = locationMap[locName];
    loc.ips.add(ip);
    loc.hits += 1;
    loc.paths[e.path] = (loc.paths[e.path] || 0) + 1;
    loc.devices[dev] = (loc.devices[dev] || 0) + 1;

    if (new Date(e.createdAt) > new Date(loc.lastVisitedAt)) {
      loc.lastVisitedAt = e.createdAt;
    }
  }

  const uniqueLocationsList = Object.values(locationMap)
    .map((item) => {
      const topPath = Object.entries(item.paths).sort((a, b) => b[1] - a[1])[0]?.[0] || "/";
      const topDevice = Object.entries(item.devices).sort((a, b) => b[1] - a[1])[0]?.[0] || "Mobile";

      return {
        locName: item.locName,
        city: item.city,
        country: item.country,
        hits: item.hits,
        uniqueIPsCount: item.ips.size,
        topPath,
        topDevice,
        lastVisitedAt: item.lastVisitedAt,
      };
    })
    .sort((a, b) => b.uniqueIPsCount - a.uniqueIPsCount || b.hits - a.hits);

  const byHour: Record<number, number> = {};
  for (const e of events) {
    const hour = new Date(e.createdAt).getHours();
    byHour[hour] = (byHour[hour] || 0) + 1;
  }

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    name: `${i.toString().padStart(2, "0")}:00`,
    value: byHour[i] || 0,
  }));

  return {
    byType,
    byPath,
    topPages,
    topBrowsers,
    topDevices,
    topOS,
    topLocations,
    uniqueLocationsList,
    hourlyData,
  };
}
