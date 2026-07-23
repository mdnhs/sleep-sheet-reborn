import type { Metadata } from "next";
import { Geist_Mono, Figtree, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/provider/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { PixelTrackingProvider } from "@/provider/pixel-tracking-provider";
import { seoConfig, websiteSchema, organizationSchema, structuredDataScript } from "@/lib/seo";

// Only two fonts are on the storefront critical path: Figtree (body) and
// Space Grotesk (headings). Both preload. Geist Sans was previously loaded but
// its CSS variable is never referenced anywhere — removed entirely. Geist Mono
// is used only on dashboard/checkout screens (the `font-mono` class), so it is
// kept available but NOT preloaded, freeing bandwidth for the LCP image.
const spaceGroteskHeading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(seoConfig.siteUrl),
  title: {
    default: seoConfig.defaultTitle,
    template: `%s | ${seoConfig.siteName}`,
  },
  description: seoConfig.defaultDescription,
  keywords: [
    "comforter price in Bangladesh",
    "bed sheet price in Bangladesh",
    "comforter set",
    "twill cotton comforter",
    "bed sheet online Bangladesh",
    "pillow cover",
    "cash on delivery bedding",
    "online shopping Bangladesh",
    "bedding",
    "sleep accessories",
  ],
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

import GoogleAnalytics from "@/components/google-analytics";
import SeoVerification from "@/components/seo-verification";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistMono.variable,
        "font-sans",
        figtree.variable,
        spaceGroteskHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
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
              <SeoVerification />
              <GoogleAnalytics />
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
