import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { setActivityMeta, type ActivityChange } from "@/features/activity/server/log-activity";

// Credentials that must never leave the server through the public GET.
// The public endpoint exposes only a "<key>_set" flag for each so the admin
// UI can show configured state; raw values are served by /secrets below.
// (cloudinary_cloud_name stays public — it is visible in every image URL.)
const SECRET_SETTING_KEYS = [
  "meta_capi_access_token",
  "steadfast_api_key",
  "steadfast_secret_key",
  "cloudinary_api_key",
  "cloudinary_api_secret",
] as const;

// Safety net for credential-shaped rows that aren't in the list above (the
// DB contains orphaned logins like fraud_steadfast_* / fraud_pathao_* from
// older versions). Anything matching this never leaves the public GET.
const SECRET_KEY_PATTERN = /password|secret|api_key|token|_pass$|^fraud_/i;

const isSecretKey = (key: string) =>
  (SECRET_SETTING_KEYS as readonly string[]).includes(key) ||
  SECRET_KEY_PATTERN.test(key);

const app = new Hono()

  .get("/", async (c) => {
    const settings = await db.select().from(siteSettings);
    const map: Record<string, string> = {};
    const secretValues: Record<string, string> = {};
    for (const { key, value } of settings) {
      if (isSecretKey(key)) secretValues[key] = value;
      else map[key] = value;
    }
    // Configured-state flags so the admin UI can indicate presence without
    // ever seeing the raw values on this public endpoint.
    for (const key of SECRET_SETTING_KEYS) {
      map[`${key}_set`] = secretValues[key] ? "true" : "false";
    }
    // Shared-cache only (s-maxage): the CDN absorbs repeat traffic while
    // browsers always revalidate, so admin edits still show up quickly.
    c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
    return c.json(map);
  })

  // Admin-only: returns the raw credential values so a logged-in admin can
  // view and edit them. Kept off the public GET above.
  .get("/secrets", sessionMiddleware, async (c) => {
    const user = c.get("user");
    if (!hasPermission(user, PERMISSIONS.MANAGE_SETTINGS)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const rows = await db.query.siteSettings.findMany({
      where: inArray(siteSettings.key, [...SECRET_SETTING_KEYS]),
    });
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const secrets = Object.fromEntries(
      SECRET_SETTING_KEYS.map((key) => [key, byKey[key] ?? ""]),
    ) as Record<(typeof SECRET_SETTING_KEYS)[number], string>;
    return c.json(secrets);
  })

  .patch(
    "/",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        shipping_inside_dhaka: z.coerce.number().min(0).optional(),
        shipping_outside_dhaka: z.coerce.number().min(0).optional(),
        currency: z.string().min(1).max(10).optional(),
        payment_method_card: z.enum(["true", "false"]).optional(),
        payment_method_cod: z.enum(["true", "false"]).optional(),
        payment_method_due: z.enum(["true", "false"]).optional(),
        pos_payment_methods: z.string().optional(),
        meta_pixel_enabled: z.enum(["true", "false"]).optional(),
        meta_pixel_default_id: z.string().optional(),
        meta_pixel_debug: z.enum(["true", "false"]).optional(),
        meta_pixel_mappings: z.string().optional(),
        meta_capi_enabled: z.enum(["true", "false"]).optional(),
        meta_capi_pixel_id: z.string().optional(),
        meta_capi_access_token: z.string().optional(),
        meta_capi_test_event_code: z.string().optional(),
        seo_site_name: z.string().optional(),
        seo_default_title: z.string().optional(),
        seo_default_description: z.string().optional(),
        seo_default_image: z.string().optional(),
        seo_google_verification: z.string().optional(),
        seo_bing_verification: z.string().optional(),
        seo_twitter_handle: z.string().optional(),
        seo_robots_ai_block: z.enum(["true", "false"]).optional(),
        cloudinary_cloud_name: z.string().optional(),
        cloudinary_api_key: z.string().optional(),
        cloudinary_api_secret: z.string().optional(),
        steadfast_api_key: z.string().optional(),
        steadfast_secret_key: z.string().optional(),
        site_name: z.string().optional(),
        logo_url: z.string().optional(),
        hero_title: z.string().optional(),
        hero_subtitle: z.string().optional(),
        hero_cta_text: z.string().optional(),
        hero_cta_link: z.string().optional(),
        hero_bg_image: z.string().optional(),
        hero_slides: z.string().optional(),
        promo_banners: z.string().optional(),
        feature_1_title: z.string().optional(),
        feature_1_desc: z.string().optional(),
        feature_2_title: z.string().optional(),
        feature_2_desc: z.string().optional(),
        feature_3_title: z.string().optional(),
        feature_3_desc: z.string().optional(),
        feature_4_title: z.string().optional(),
        feature_4_desc: z.string().optional(),
        newsletter_title: z.string().optional(),
        newsletter_subtitle: z.string().optional(),
        footer_brand_desc: z.string().optional(),
        footer_email: z.string().optional(),
        footer_phone: z.string().optional(),
        social_facebook: z.string().optional(),
        social_instagram: z.string().optional(),
        social_twitter: z.string().optional(),
        social_youtube: z.string().optional(),
        footer_copyright: z.string().optional(),
      })
    ),
    async (c) => {
      const user = c.get("user");
      if (!hasPermission(user, PERMISSIONS.MANAGE_SETTINGS)) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const body = c.req.valid("json");
      const updates = Object.entries(body).filter(([, v]) => v !== undefined) as [string, any][];

      const changedKeys = updates.map(([key]) => key);
      const before = changedKeys.length
        ? await db.query.siteSettings.findMany({ where: inArray(siteSettings.key, changedKeys) })
        : [];
      const beforeByKey = Object.fromEntries(before.map((r) => [r.key, r.value]));

      await Promise.all(
        updates.map(([key, value]) =>
          db.insert(siteSettings)
            .values({ key, value: String(value) })
            .onConflictDoUpdate({
              target: siteSettings.key,
              set: { value: String(value), updatedAt: new Date() },
            })
        )
      );

      // Never log raw secret values — show only that a credential changed.
      const prettifyKey = (key: string) =>
        key.split("_").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
      const changes: ActivityChange[] = updates
        .filter(([key, value]) => String(value) !== (beforeByKey[key] ?? ""))
        .map(([key, value]) => {
          if (isSecretKey(key)) {
            return { label: prettifyKey(key), from: beforeByKey[key] ? "(set)" : "(empty)", to: "(updated)" };
          }
          return { label: prettifyKey(key), from: beforeByKey[key] ?? "(empty)", to: String(value) };
        });

      setActivityMeta(c, {
        name: changes.length === 1 ? changes[0].label : `${changes.length} settings`,
        changes,
      });

      return c.json({ success: true });
    }
  );

export default app;
