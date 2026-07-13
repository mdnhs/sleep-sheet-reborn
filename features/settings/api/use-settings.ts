"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await client.api.settings.$get();
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json() as Promise<Record<string, string>>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Admin-only: fetches secret values (e.g. the CAPI token) that the public
// settings endpoint intentionally omits.
export function useSettingsSecrets() {
  return useQuery({
    queryKey: ["settings", "secrets"],
    queryFn: async () => {
      const res = await client.api.settings.secrets.$get();
      if (!res.ok) throw new Error("Failed to fetch settings secrets");
      return res.json() as Promise<{ meta_capi_access_token: string }>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      shipping_inside_dhaka?: number;
      shipping_outside_dhaka?: number;
      currency?: string;
      payment_method_card?: "true" | "false";
      payment_method_cod?: "true" | "false";
      payment_method_due?: "true" | "false";
      pos_payment_methods?: string;
      meta_pixel_enabled?: "true" | "false";
      meta_pixel_default_id?: string;
      meta_pixel_debug?: "true" | "false";
      meta_pixel_mappings?: string;
      meta_capi_enabled?: "true" | "false";
      meta_capi_pixel_id?: string;
      meta_capi_access_token?: string;
      meta_capi_test_event_code?: string;
      seo_site_name?: string;
      seo_default_title?: string;
      seo_default_description?: string;
      seo_default_image?: string;
      seo_google_verification?: string;
      seo_bing_verification?: string;
      seo_twitter_handle?: string;
      seo_robots_ai_block?: "true" | "false";
      cloudinary_cloud_name?: string;
      cloudinary_api_key?: string;
      cloudinary_api_secret?: string;
      steadfast_api_key?: string;
      steadfast_secret_key?: string;
      smtp_email_user?: string;
      smtp_email_pass?: string;
      site_name?: string;
      logo_url?: string;
      hero_title?: string;
      hero_subtitle?: string;
      hero_cta_text?: string;
      hero_cta_link?: string;
      hero_bg_image?: string;
      hero_slides?: string;
      feature_1_title?: string;
      feature_1_desc?: string;
      feature_2_title?: string;
      feature_2_desc?: string;
      feature_3_title?: string;
      feature_3_desc?: string;
      feature_4_title?: string;
      feature_4_desc?: string;
      newsletter_title?: string;
      newsletter_subtitle?: string;
      footer_brand_desc?: string;
      footer_email?: string;
      footer_phone?: string;
      social_facebook?: string;
      social_instagram?: string;
      social_twitter?: string;
      social_youtube?: string;
      footer_copyright?: string;
    }) => {
      const res = await client.api.settings.$patch({ json: data });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save settings");
    },
  });
}
