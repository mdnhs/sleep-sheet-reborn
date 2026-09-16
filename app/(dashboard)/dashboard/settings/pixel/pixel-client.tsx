"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, useUpdateSettings, useSettingsSecrets } from "@/features/settings/api/use-settings";
import { Loader2, Eye, EyeOff } from "lucide-react";

const capiSchema = z.object({
  meta_capi_enabled: z.enum(["true", "false"]),
  meta_capi_pixel_id: z.string().optional(),
  meta_capi_access_token: z.string().optional(),
  meta_capi_test_event_code: z.string().optional(),
});

type CapiFormValues = z.infer<typeof capiSchema>;

export function PixelSettings() {
  const { data, isLoading } = useSettings();
  const { data: secrets } = useSettingsSecrets();
  const capiMutation = useUpdateSettings();

  const [showToken, setShowToken] = useState(false);

  const capiForm = useForm<CapiFormValues>({
    resolver: zodResolver(capiSchema),
    defaultValues: {
      meta_capi_enabled: "false",
      meta_capi_pixel_id: "",
      meta_capi_access_token: "",
      meta_capi_test_event_code: "",
    },
  });

  const tokenSet = data?.meta_capi_access_token_set === "true";

  useEffect(() => {
    if (data) {
      capiForm.reset({
        meta_capi_enabled: data.meta_capi_enabled === "true" ? "true" : "false",
        meta_capi_pixel_id: data.meta_capi_pixel_id || "",
        meta_capi_access_token: "",
        meta_capi_test_event_code: data.meta_capi_test_event_code || "",
      });
    }
  }, [data, capiForm]);

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

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meta Conversions API</h1>
        <p className="text-muted-foreground text-sm">
          Server-side event tracking configuration (Browser Meta Pixel is managed via Google Tag Manager)
        </p>
      </div>

      <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
        <div>
          <h2 className="text-base font-bold tracking-tight">Conversions API (Server-Side)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sends Purchase events server-side directly to Meta if enabled. Deduplicated with
            GTM events automatically using shared event_id. (Note: If your GTM Server Container already handles CAPI via Stape, you can leave this disabled).
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
                        Enable direct server-side Purchase events from Next.js server
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
                      Enter your Meta Pixel or Dataset ID
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
                        : "Paste the Conversions API access token from Events Manager."}
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
    </div>
  );
}
export default PixelSettings;
