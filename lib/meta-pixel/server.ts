import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { isValidPixelId } from "./pixel-mapping";
import { STATIC_FALLBACK_PIXEL_ID } from "./config";

export interface PixelBootstrapConfig {
  enabled: boolean;
  pixelId: string | null;
}

/**
 * Server-only read used to render the Meta base pixel code synchronously
 * in the initial HTML (see app/layout.tsx). Meta's "Check website" scanner
 * and the noscript fallback both need the pixel present at first paint —
 * waiting on the client-side settings fetch (see pixel-tracking-provider.tsx)
 * means the pixel never appears in time for crawlers that don't run a full
 * client-side session.
 */
export async function getPixelBootstrapConfig(): Promise<PixelBootstrapConfig> {
  try {
    const rows = await db
      .select()
      .from(siteSettings)
      .where(inArray(siteSettings.key, ["meta_pixel_enabled", "meta_pixel_default_id"]));

    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const enabled = map.meta_pixel_enabled !== "false";
    const rawPixelId =
      map.meta_pixel_default_id ||
      process.env.NEXT_PUBLIC_DEFAULT_PIXEL_ID ||
      STATIC_FALLBACK_PIXEL_ID;
    const pixelId = isValidPixelId(rawPixelId) ? rawPixelId : null;

    return { enabled, pixelId };
  } catch {
    // DB unreachable at build/request time — still fall back to the
    // hardcoded static ID so the pixel keeps firing.
    return { enabled: true, pixelId: STATIC_FALLBACK_PIXEL_ID };
  }
}
