"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useSettings } from "@/features/settings/api/use-settings";

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

function extractMeasurementId(input?: string | null): string {
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

function GoogleAnalyticsTracker({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!gaId || typeof window === "undefined" || !window.gtag) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    window.gtag("config", gaId, {
      page_path: url,
    });
  }, [pathname, searchParams, gaId]);

  return null;
}

export default function GoogleAnalytics() {
  const { data: settings } = useSettings();

  const gaId = extractMeasurementId(
    settings?.google_analytics_id ||
    process.env.NEXT_PUBLIC_GA_ID ||
    ""
  );

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsTracker gaId={gaId} />
      </Suspense>
    </>
  );
}
