"use client";

import { type ReactNode, useMemo } from "react";
import { PixelProvider } from "@/lib/meta-pixel/provider";
import { useSettings } from "@/features/settings/api/use-settings";

interface PixelTrackingProviderProps {
  children: ReactNode;
}

export function PixelTrackingProvider({ children }: PixelTrackingProviderProps) {
  const { data: settings, isLoading } = useSettings();

  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- the compiler's inferred dep would be the whole `settings` object (less precise); the explicit `settings?.meta_pixel_mappings` dep is correct as written.
  const pageMappings = useMemo(() => {
    if (!settings?.meta_pixel_mappings) return undefined;
    try {
      const parsed = JSON.parse(settings.meta_pixel_mappings);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as Record<string, string>;
      }
    } catch {
      /* invalid JSON, fall back to static mappings */
    }
    return undefined;
  }, [settings?.meta_pixel_mappings]);

  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <PixelProvider
      // Explicitly opt-in. This read `!== "false"`, which turns the browser
      // Pixel ON whenever the setting is missing, empty, misspelt, or the
      // whole /api/settings fetch fails — and the GTM container already
      // carries its own Meta Pixel base code plus ViewContent, AddToCart,
      // InitiateCheckout, Purchase and Search tags. Failing open there means
      // every one of those events is counted twice, and a second, unmatched
      // Purchase breaks the event_id deduplication the server CAPI relies on.
      // The only thing standing between that and production was
      // meta_pixel_default_id happening to be empty.
      enabled={settings?.meta_pixel_enabled === "true"}
      defaultPixelId={settings?.meta_pixel_default_id || undefined}
      debug={
        settings?.meta_pixel_debug === "true"
          ? true
          : settings?.meta_pixel_debug === "false"
            ? false
            : undefined
      }
      pageMappings={pageMappings}
    >
      {children}
    </PixelProvider>
  );
}
