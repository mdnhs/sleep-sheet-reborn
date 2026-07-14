import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Figtree, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/provider/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { PixelTrackingProvider } from "@/provider/pixel-tracking-provider";
import { seoConfig, websiteSchema, organizationSchema, structuredDataScript } from "@/lib/seo";
import { getPixelBootstrapConfig } from "@/lib/meta-pixel/server";

const spaceGroteskHeading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
});

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(seoConfig.siteUrl),
  title: {
    default: seoConfig.defaultTitle,
    template: `%s | ${seoConfig.siteName}`,
  },
  description: seoConfig.defaultDescription,
  keywords: ["bedding", "sleep", "mattress", "pillows", "bed sheets", "sleep accessories", "comfort"],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: seoConfig.defaultLocale,
    url: seoConfig.siteUrl,
    siteName: seoConfig.siteName,
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    images: [
      {
        url: seoConfig.defaultImage,
        width: 1200,
        height: 630,
        alt: seoConfig.siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: seoConfig.twitterHandle,
    creator: seoConfig.twitterHandle,
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    images: [seoConfig.defaultImage],
  },
  alternates: {
    canonical: seoConfig.siteUrl,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: seoConfig.siteName,
  },
  applicationName: seoConfig.siteName,
  referrer: "origin-when-cross-origin",
  category: "ecommerce",
  other: {
    "msapplication-TileColor": seoConfig.themeColor,
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport = {
  themeColor: seoConfig.themeColor,
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { enabled: pixelEnabled, pixelId } = await getPixelBootstrapConfig();

  return (
    <html
      lang="bn"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        figtree.variable,
        spaceGroteskHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        {pixelEnabled && pixelId && (
          <>
            {/* Standard Meta base pixel code, rendered synchronously so it's
                present in the initial HTML — Meta's "Check website" scanner
                and non-JS crawlers can't see the client-only pixel that
                PixelTrackingProvider injects after an async settings fetch. */}
            <Script id="meta-pixel-base" strategy="beforeInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixelId}');
                fbq('track', 'PageView');
                window.__metaPixelBootstrapId = '${pixelId}';
              `}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element -- must be a plain <img>: next/image needs JS to render, which defeats a <noscript> pixel fallback */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
        {structuredDataScript("organization", organizationSchema())}
        {structuredDataScript("website", websiteSchema())}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider>
            <Toaster />
            <QueryProvider>
              <NuqsAdapter>
                <PixelTrackingProvider>
                  {children}
                </PixelTrackingProvider>
              </NuqsAdapter>
            </QueryProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
