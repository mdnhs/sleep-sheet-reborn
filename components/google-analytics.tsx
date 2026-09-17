"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useSettings } from "@/features/settings/api/use-settings";

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }
}

const DEFAULT_GTM_ID = "GTM-PQ667JWQ";

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const { data: settings } = useSettings();

  // Prevent GTM container from loading on dashboard and its subroutes
  const isDashboard = pathname?.startsWith("/dashboard");

  // GTM Web Container ID from DB settings (fallback to env or production default)
  const gtmWebId =
    settings?.gtm_web_id?.trim() ||
    process.env.NEXT_PUBLIC_GTM_ID ||
    DEFAULT_GTM_ID;

  // Ensure GTM script is injected reliably on the storefront without waiting
  // for async API responses or relying on Next.js Script's delayed hydration.
  useEffect(() => {
    if (isDashboard || typeof window === "undefined" || !gtmWebId) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function () {
        (window.dataLayer as unknown as unknown[]).push(arguments);
      };

    const scriptId = `gtm-script-${gtmWebId}`;
    if (!document.getElementById(scriptId)) {
      window.dataLayer.push({
        "gtm.start": new Date().getTime(),
        event: "gtm.js",
      });
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmWebId}`;
      document.head.appendChild(script);
    }
  }, [isDashboard, gtmWebId]);

  if (isDashboard) return null;

  return (
    <>
      {/* Fallback Next.js Script tag for SSR markup */}
      <Script id="google-tag-manager" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmWebId}');
        `}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmWebId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}
