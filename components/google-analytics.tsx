"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useSettings } from "@/features/settings/api/use-settings";

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const { data: settings } = useSettings();

  // Prevent GTM container from loading on dashboard and its subroutes
  if (pathname?.startsWith("/dashboard")) return null;

  // GTM Web Container ID from DB settings (fallback to env)
  const gtmWebId =
    settings?.gtm_web_id?.trim() ||
    process.env.NEXT_PUBLIC_GTM_ID ||
    "";

  if (!gtmWebId) return null;

  return (
    <>
      {/* Google Tag Manager (Web Container) */}
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
