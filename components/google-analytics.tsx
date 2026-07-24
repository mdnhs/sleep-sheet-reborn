"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useSettings } from "@/features/settings/api/use-settings";

import { initAnalytics, trackPageView } from "@/lib/analytics";

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
    if (!gaId || typeof window === "undefined") return;

    // Initialize David Wells' analytics instance with @analytics/google-analytics plugin
    initAnalytics(gaId);

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    // Track page views via David Wells analytics library
    trackPageView(url, gaId);

    if (window.gtag) {
      window.gtag("config", gaId, {
        page_path: url,
      });
    }
  }, [pathname, searchParams, gaId]);

  return null;
}

export default function GoogleAnalytics() {
  const { data: settings } = useSettings();

  // Extract GTM Web Container ID
  const rawGtmWebId = settings?.gtm_web_id?.trim();
  const rawGaId = settings?.google_analytics_id?.trim() || process.env.NEXT_PUBLIC_GA_ID || "";
  
  const gtmWebId = rawGtmWebId || (rawGaId.startsWith("GTM-") ? rawGaId : "");
  const gtmServerId = settings?.gtm_server_id?.trim();
  const gtmServerUrl = settings?.gtm_server_url?.trim().replace(/\/$/, "");

  const gaId = extractMeasurementId(rawGaId);

  const gtmDomain = gtmServerUrl || "https://www.googletagmanager.com";

  return (
    <>
      {/* Google Tag Manager (Web Container / Server Tagging URL) */}
      {gtmWebId && (
        <>
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              ${gtmServerId ? `window.dataLayer.push({ 'gtm.serverContainerId': '${gtmServerId}' });` : ''}
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              '${gtmDomain}/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmWebId}');
            `}
          </Script>
          <noscript>
            <iframe
              src={`${gtmDomain}/ns.html?id=${gtmWebId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      )}

      {/* Google Analytics (GA4) fallback if GA ID is present */}
      {gaId && !gaId.startsWith("GTM-") && (
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
        </>
      )}

      {gaId && (
        <Suspense fallback={null}>
          <GoogleAnalyticsTracker gaId={gaId} />
        </Suspense>
      )}
    </>
  );
}
