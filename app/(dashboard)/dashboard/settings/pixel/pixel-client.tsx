"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSettings, useUpdateSettings, useSettingsSecrets } from "@/features/settings/api/use-settings";
import { isValidPixelId } from "@/lib/meta-pixel/pixel-mapping";
import { Loader2, Eye, EyeOff, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const pixelSchema = z.object({
  meta_pixel_enabled: z.enum(["true", "false"]),
  meta_pixel_default_id: z.string().optional(),
  meta_pixel_debug: z.enum(["true", "false"]),
});

type PixelFormValues = z.infer<typeof pixelSchema>;

const capiSchema = z.object({
  meta_capi_enabled: z.enum(["true", "false"]),
  meta_capi_pixel_id: z.string().optional(),
  meta_capi_access_token: z.string().optional(),
  meta_capi_test_event_code: z.string().optional(),
});

type CapiFormValues = z.infer<typeof capiSchema>;

interface PageMapping {
  page: string;
  pixelId: string;
}

function parseMappings(raw?: string): PageMapping[] {
  if (!raw) return [];
  try {
    const obj = JSON.parse(raw);
    if (typeof obj === "object" && obj !== null) {
      return Object.entries(obj).map(([page, pixelId]) => ({
        page,
        pixelId: String(pixelId),
      }));
    }
  } catch {
    /* ignore */
  }
  return [];
}

function serializeMappings(mappings: PageMapping[]): string {
  const obj: Record<string, string> = {};
  for (const m of mappings) {
    if (m.page.trim()) {
      obj[m.page.trim()] = m.pixelId.trim();
    }
  }
  return JSON.stringify(obj);
}

export function PixelSettings() {
  const { data, isLoading } = useSettings();
  const { data: secrets } = useSettingsSecrets();
  // Separate mutation per section so each Save button has its own loading
  // state and they don't spin together.
  const generalMutation = useUpdateSettings();
  const mappingsMutation = useUpdateSettings();
  const capiMutation = useUpdateSettings();

  const [mappings, setMappings] = useState<PageMapping[]>([]);
  const [newPage, setNewPage] = useState("");
  const [newPixelId, setNewPixelId] = useState("");
  const [showToken, setShowToken] = useState(false);

  const form = useForm<PixelFormValues>({
    resolver: zodResolver(pixelSchema),
    defaultValues: {
      meta_pixel_enabled: "true",
      meta_pixel_default_id: "",
      meta_pixel_debug: "false",
    },
  });

  const capiForm = useForm<CapiFormValues>({
    resolver: zodResolver(capiSchema),
    defaultValues: {
      meta_capi_enabled: "true",
      meta_capi_pixel_id: "",
      meta_capi_access_token: "",
      meta_capi_test_event_code: "",
    },
  });

  const tokenSet = data?.meta_capi_access_token_set === "true";

  useEffect(() => {
    if (data) {
      form.reset({
        meta_pixel_enabled: data.meta_pixel_enabled !== "false" ? "true" : "false",
        meta_pixel_default_id: data.meta_pixel_default_id || "",
        meta_pixel_debug: data.meta_pixel_debug === "true" ? "true" : "false",
      });
      capiForm.reset({
        meta_capi_enabled: data.meta_capi_enabled !== "false" ? "true" : "false",
        meta_capi_pixel_id: data.meta_capi_pixel_id || "",
        meta_capi_access_token: "",
        meta_capi_test_event_code: data.meta_capi_test_event_code || "",
      });
      setMappings(parseMappings(data.meta_pixel_mappings));
    }
  }, [data, form, capiForm]);

  // Prefill the saved token (admin-only endpoint) once it loads, so it is
  // visible/editable rather than blank.
  useEffect(() => {
    if (secrets?.meta_capi_access_token) {
      capiForm.setValue("meta_capi_access_token", secrets.meta_capi_access_token);
    }
  }, [secrets, capiForm]);

  const handleSaveCapi = useCallback(
    (values: CapiFormValues) => {
      const payload: CapiFormValues = { ...values };
      // Don't overwrite the saved token with a blank field.
      if (!payload.meta_capi_access_token?.trim()) {
        delete payload.meta_capi_access_token;
      }
      capiMutation.mutate(payload);
    },
    [capiMutation],
  );

  const handleAddMapping = useCallback(() => {
    const page = newPage.trim();
    const pixelId = newPixelId.trim();

    if (!page) {
      toast.error("Page name is required");
      return;
    }
    if (!pixelId) {
      toast.error("Pixel ID is required");
      return;
    }
    if (!isValidPixelId(pixelId)) {
      toast.error("Invalid Pixel ID — must be 15-16 digits");
      return;
    }
    if (mappings.some((m) => m.page === page)) {
      toast.error(`Page "${page}" already has a mapping`);
      return;
    }

    setMappings((prev) => [...prev, { page, pixelId }]);
    setNewPage("");
    setNewPixelId("");
  }, [newPage, newPixelId, mappings]);

  const handleRemoveMapping = useCallback((page: string) => {
    setMappings((prev) => prev.filter((m) => m.page !== page));
  }, []);

  const handleSaveMappings = useCallback(() => {
    const invalid = mappings.filter((m) => !isValidPixelId(m.pixelId));
    if (invalid.length > 0) {
      toast.error(`Invalid Pixel IDs: ${invalid.map((m) => m.page).join(", ")}`);
      return;
    }
    mappingsMutation.mutate({ meta_pixel_mappings: serializeMappings(mappings) });
  }, [mappings, mappingsMutation]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meta Pixel</h1>
        <p className="text-muted-foreground text-sm">
          Track conversions from multiple Facebook Pages with per-pixel attribution
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="flex flex-nowrap items-center h-9 w-fit gap-1 bg-slate-100 dark:bg-muted/40 p-1 rounded-full">
          <TabsTrigger value="general" className="shrink-0 rounded-full px-4 h-7 text-xs font-semibold cursor-pointer transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">General</TabsTrigger>
          <TabsTrigger value="mappings" className="shrink-0 rounded-full px-4 h-7 text-xs font-semibold cursor-pointer transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">Page Mappings</TabsTrigger>
          <TabsTrigger value="capi" className="shrink-0 rounded-full px-4 h-7 text-xs font-semibold cursor-pointer transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">Conversions API</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
            <h2 className="text-base font-bold tracking-tight">General Settings</h2>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full rounded-2xl" />
                <Skeleton className="h-10 w-full rounded-2xl" />
                <Skeleton className="h-10 w-full rounded-2xl" />
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((values) => generalMutation.mutate(values))}
                  className="space-y-6"
                >
                  <FormField
                    name="meta_pixel_enabled"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-muted/30 p-4">
                        <div className="flex flex-col">
                          <FormLabel className="text-sm font-semibold">
                            Pixel Tracking
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Enable or disable all Meta Pixel tracking
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value === "true"}
                            onCheckedChange={(checked) =>
                              field.onChange(checked ? "true" : "false")
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="meta_pixel_debug"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-muted/30 p-4">
                        <div className="flex flex-col">
                          <FormLabel className="text-sm font-semibold">
                            Debug Mode
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Log pixel attribution, events, and errors to browser console
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value === "true"}
                            onCheckedChange={(checked) =>
                              field.onChange(checked ? "true" : "false")
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="meta_pixel_default_id"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">
                          Default Pixel ID
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Fallback pixel when no URL attribution is detected (15-16 digit ID)
                        </FormDescription>
                        <FormControl>
                          <Input
                            placeholder="000000000000000"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={generalMutation.isPending} className="gap-2 rounded-full text-xs font-semibold">
                      {generalMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save General Settings
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </TabsContent>

        <TabsContent value="mappings">
          <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
            <div>
              <h2 className="text-base font-bold tracking-tight">Page Mappings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Map Facebook Page names to Meta Pixel IDs. Visitors from ads with{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">?page=&lt;name&gt;</code>{" "}
                will be attributed to the mapped Pixel.
              </p>
            </div>
            <div className="space-y-4">
              {mappings.length > 0 && (
                <div className="space-y-2">
                  {mappings.map((m) => (
                    <div
                      key={m.page}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-muted/30 px-4 py-3"
                    >
                      <code className="text-xs font-semibold min-w-[100px]">{m.page}</code>
                      <span className="text-muted-foreground">&rarr;</span>
                      <code className="text-xs bg-slate-200/60 dark:bg-slate-800 px-2 py-1 rounded-full font-mono flex-1 text-slate-800 dark:text-slate-200 border-none">
                        {m.pixelId}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMapping(m.page)}
                        className="h-8 w-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {mappings.length === 0 && (
                <div className="flex items-center gap-2 rounded-2xl border border-dashed py-8 text-xs font-medium text-muted-foreground justify-center">
                  <AlertCircle className="h-4 w-4" />
                  No page mappings configured. Add one below.
                </div>
              )}

              <div className="flex items-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Page Name</label>
                  <Input
                    placeholder="page_a"
                    value={newPage}
                    onChange={(e) => setNewPage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMapping())}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Pixel ID</label>
                  <Input
                    placeholder="000000000000000"
                    value={newPixelId}
                    onChange={(e) => setNewPixelId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMapping())}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddMapping}
                  className="gap-1.5 shrink-0 rounded-full text-xs font-semibold border bg-slate-50 dark:bg-muted/40"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={handleSaveMappings}
                  disabled={mappingsMutation.isPending}
                  className="gap-2 rounded-full text-xs font-semibold"
                >
                  {mappingsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Mappings
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="capi">
          <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
            <div>
              <h2 className="text-base font-bold tracking-tight">Conversions API (Server-Side)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sends Purchase events server-side so Meta still receives them when
                the browser Pixel is blocked (iOS, ad blockers). Deduplicated with
                the Pixel automatically. Get the token in Events Manager &rarr;
                Settings &rarr; Conversions API.
              </p>
            </div>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full rounded-2xl" />
                <Skeleton className="h-10 w-full rounded-2xl" />
                <Skeleton className="h-10 w-full rounded-2xl" />
              </div>
            ) : (
              <Form {...capiForm}>
                <form
                  onSubmit={capiForm.handleSubmit(handleSaveCapi)}
                  className="space-y-6"
                >
                  <FormField
                    name="meta_capi_enabled"
                    control={capiForm.control}
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-muted/30 p-4">
                        <div className="flex flex-col">
                          <FormLabel className="text-sm font-semibold">
                            Conversions API
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Enable server-side Purchase events
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value === "true"}
                            onCheckedChange={(checked) =>
                              field.onChange(checked ? "true" : "false")
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="meta_capi_pixel_id"
                    control={capiForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">
                          Dataset / Pixel ID
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Leave blank to reuse the Default Pixel ID above
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="000000000000000" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="meta_capi_access_token"
                    control={capiForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">
                          Access Token
                        </FormLabel>
                        <FormDescription className="text-xs">
                          {tokenSet
                            ? "A token is saved. Leave blank to keep it, or paste a new one to replace."
                            : "Paste the Conversions API access token."}
                        </FormDescription>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showToken ? "text" : "password"}
                              autoComplete="off"
                              placeholder={tokenSet ? "•••••••••• (saved)" : "EAAG..."}
                              className="pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowToken((v) => !v)}
                              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                              aria-label={showToken ? "Hide token" : "Show token"}
                              tabIndex={-1}
                            >
                              {showToken ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="meta_capi_test_event_code"
                    control={capiForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">
                          Test Event Code (optional)
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Set only while verifying in the Test Events tab. Clear it
                          for production traffic.
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="TEST12345" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={capiMutation.isPending} className="gap-2 rounded-full text-xs font-semibold">
                      {capiMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save Conversions API
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
