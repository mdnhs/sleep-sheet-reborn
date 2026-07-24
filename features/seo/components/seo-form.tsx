"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings, useUpdateSettings } from "@/features/settings/api/use-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Search, Users, Bot, Shield, BarChart2 } from "lucide-react";

const seoSchema = z.object({
  seo_site_name: z.string().min(1, "Site name is required"),
  seo_default_title: z.string().min(1, "Default title is required"),
  seo_default_description: z.string().min(1, "Default description is required"),
  seo_default_image: z.string().optional(),
  seo_google_verification: z.string().optional(),
  seo_bing_verification: z.string().optional(),
  google_analytics_id: z.string().optional(),
  ga4_property_id: z.string().optional(),
  gtm_web_id: z.string().optional(),
  gtm_server_id: z.string().optional(),
  gtm_server_url: z.string().optional(),
  seo_twitter_handle: z.string().optional(),
  seo_robots_ai_block: z.boolean(),
});

type SeoFormValues = z.infer<typeof seoSchema>;

export function SeoForm() {
  const { data, isLoading } = useSettings();
  const { mutate, isPending } = useUpdateSettings();

  const form = useForm<SeoFormValues>({
    resolver: zodResolver(seoSchema),
    values: {
      seo_site_name: data?.seo_site_name || "Sleep Sheet",
      seo_default_title: data?.seo_default_title || "Sleep Sheet - Premium Bedding & Sleep Solutions",
      seo_default_description: data?.seo_default_description || "Discover premium bedding, Comforters, mattresses, pillows, and sleep accessories for ultimate comfort.",
      seo_default_image: data?.seo_default_image || "",
      seo_google_verification: data?.seo_google_verification || "",
      seo_bing_verification: data?.seo_bing_verification || "",
      google_analytics_id: data?.google_analytics_id || "",
      ga4_property_id: data?.ga4_property_id || "546802046",
      gtm_web_id: data?.gtm_web_id || "",
      gtm_server_id: data?.gtm_server_id || "",
      gtm_server_url: data?.gtm_server_url || "",
      seo_twitter_handle: data?.seo_twitter_handle || "@sleepsheet2025",
      seo_robots_ai_block: data?.seo_robots_ai_block !== "false",
    },
  });

  function extractGaId(input?: string): string {
    if (!input) return "";
    const trimmed = input.trim();
    const gaMatch = trimmed.match(/G-[A-Z0-9]+/i);
    if (gaMatch) return gaMatch[0].toUpperCase();
    const gtmMatch = trimmed.match(/GTM-[A-Z0-9]+/i);
    if (gtmMatch) return gtmMatch[0].toUpperCase();
    const uaMatch = trimmed.match(/UA-\d+-\d+/i);
    if (uaMatch) return uaMatch[0].toUpperCase();
    return trimmed;
  }

  function onSubmit(values: SeoFormValues) {
    const cleanGaId = extractGaId(values.google_analytics_id);
    mutate({
      seo_site_name: values.seo_site_name,
      seo_default_title: values.seo_default_title,
      seo_default_description: values.seo_default_description,
      seo_default_image: values.seo_default_image || undefined,
      seo_google_verification: values.seo_google_verification || undefined,
      seo_bing_verification: values.seo_bing_verification || undefined,
      google_analytics_id: cleanGaId || undefined,
      ga4_property_id: values.ga4_property_id || undefined,
      gtm_web_id: values.gtm_web_id?.trim() || undefined,
      gtm_server_id: values.gtm_server_id?.trim() || undefined,
      gtm_server_url: values.gtm_server_url?.trim() || undefined,
      seo_twitter_handle: values.seo_twitter_handle || undefined,
      seo_robots_ai_block: values.seo_robots_ai_block ? "true" : "false",
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl flex flex-wrap h-auto gap-1 border-none mb-4">
            <TabsTrigger value="general" className="rounded-xl gap-2 text-xs font-semibold py-2 px-4 cursor-pointer">
              <Globe className="h-4 w-4 text-indigo-500" />
              General SEO
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl gap-2 text-xs font-semibold py-2 px-4 cursor-pointer">
              <BarChart2 className="h-4 w-4 text-emerald-500" />
              Analytics & Verification
            </TabsTrigger>
            <TabsTrigger value="social" className="rounded-xl gap-2 text-xs font-semibold py-2 px-4 cursor-pointer">
              <Users className="h-4 w-4 text-blue-500" />
              Social & Branding
            </TabsTrigger>
            <TabsTrigger value="crawlers" className="rounded-xl gap-2 text-xs font-semibold py-2 px-4 cursor-pointer">
              <Bot className="h-4 w-4 text-purple-500" />
              AI Crawlers
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: General SEO */}
          <TabsContent value="general">
            <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold tracking-tight">General SEO Configuration</h2>
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="seo_site_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Sleep Sheet" className="rounded-xl" />
                      </FormControl>
                      <FormDescription>Used in Open Graph, Twitter Cards, and schema.org markup</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="seo_default_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Meta Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Sleep Sheet - Premium Bedding & Comforters" className="rounded-xl" />
                      </FormControl>
                      <FormDescription>Shown on homepage and as fallback for pages without a custom title</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="seo_default_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Meta Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Discover premium bedding..." className="rounded-xl min-h-[80px]" rows={3} />
                      </FormControl>
                      <FormDescription>Shown in search engine results for the homepage</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="seo_default_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Social Share Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/og-default.jpg" className="rounded-xl" />
                      </FormControl>
                      <FormDescription>Used when no specific image is set for a page (1200×630px recommended)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Analytics & Verification */}
          <TabsContent value="analytics">
            <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-bold tracking-tight">Google Analytics & Search Console</h2>
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="gtm_web_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <span>Google Tag Manager (Web Container ID)</span>
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-md">Web Container</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. GTM-PQ667JWQ" className="rounded-xl font-mono text-sm" />
                      </FormControl>
                      <FormDescription>Your Web Container ID from GTM dashboard (e.g. GTM-PQ667JWQ)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gtm_server_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <span>Google Tag Manager (Server Container ID)</span>
                        <span className="text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold px-2 py-0.5 rounded-md">Server Container</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. GTM-PZQMNK4K" className="rounded-xl font-mono text-sm" />
                      </FormControl>
                      <FormDescription>Your Server Container ID for Server-Side Tracking (e.g. GTM-PZQMNK4K)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gtm_server_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GTM Server Tagging URL (Optional Custom Domain)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. https://sgtm.sleepsheetbd.com" className="rounded-xl font-mono text-sm" />
                      </FormControl>
                      <FormDescription>Custom tagging server endpoint URL if hosting your GTM server container</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="google_analytics_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Analytics (GA4) Measurement ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. G-Y62ZKHQGLV or paste full Google Tag script" className="rounded-xl font-mono text-sm" />
                      </FormControl>
                      <FormDescription>Enter your GA4 Measurement ID (e.g. G-Y62ZKHQGLV)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="seo_google_verification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Search Console Verification Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. abcdef1234567890" className="rounded-xl font-mono text-sm" />
                      </FormControl>
                      <FormDescription>Paste the meta verification code value from Google Search Console</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="seo_bing_verification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bing Webmaster Tools Verification Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. abcdef1234567890" className="rounded-xl font-mono text-sm" />
                      </FormControl>
                      <FormDescription>Paste the meta verification code value from Bing Webmaster Tools</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Social & Branding */}
          <TabsContent value="social">
            <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-base font-bold tracking-tight">Social Media & Branding Cards</h2>
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="seo_twitter_handle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter/X Handle</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="@sleepsheet" className="rounded-xl" />
                      </FormControl>
                      <FormDescription>Used in Twitter Cards attribution</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: AI Crawlers */}
          <TabsContent value="crawlers">
            <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-base font-bold tracking-tight">AI Bots & Search Crawlers Control</h2>
              </div>
              <div>
                <FormField
                  control={form.control}
                  name="seo_robots_ai_block"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-muted/30 p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Block AI Crawlers</span>
                        <span className="text-xs text-muted-foreground">
                          Prevents GPTBot, ChatGPT-User, Google-Extended, and CCBot from crawling your site
                        </span>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending} className="rounded-full text-xs font-semibold gap-2">
            <Shield className="h-4 w-4" />
            {isPending ? "Saving..." : "Save SEO Settings"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
