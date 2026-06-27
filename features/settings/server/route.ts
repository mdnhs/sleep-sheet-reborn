import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";

const app = new Hono()

  .get("/", async (c) => {
    const settings = await db.select().from(siteSettings);
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return c.json(map);
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
        smtp_email_user: z.string().optional(),
        smtp_email_pass: z.string().optional(),
        site_name: z.string().optional(),
        logo_url: z.string().optional(),
        hero_title: z.string().optional(),
        hero_subtitle: z.string().optional(),
        hero_cta_text: z.string().optional(),
        hero_cta_link: z.string().optional(),
        hero_bg_image: z.string().optional(),
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
      if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const body = c.req.valid("json");
      const updates = Object.entries(body).filter(([, v]) => v !== undefined) as [string, any][];

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

      return c.json({ success: true });
    }
  );

export default app;
