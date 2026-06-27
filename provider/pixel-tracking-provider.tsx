"use client";

import { type ReactNode, useMemo } from "react";
import { PixelProvider } from "@/lib/meta-pixel/provider";
import { useSettings } from "@/features/settings/api/use-settings";

interface PixelTrackingProviderProps {
  children: ReactNode;
}

export function PixelTrackingProvider({ children }: PixelTrackingProviderProps) {
  const { data: settings, isLoading } = useSettings();

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
      enabled={settings?.meta_pixel_enabled !== "false"}
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
