import ProductContents from "@/features/product/components/product-contents";
import ProductSidebar from "@/features/product/components/products-sidebar";
import React, { Suspense } from "react";
import { seoConfig, generateMetadata, webpageSchema, structuredDataScript } from "@/lib/seo";

export const metadata = generateMetadata({
  title: "New Arrivals",
  description: `Shop the latest comforter sets, bed sheets, and pillow covers just added to ${seoConfig.siteName}. 100% twill cotton fabric, cash on delivery.`,
  canonical: `${seoConfig.siteUrl}/new-arrivals`,
})

function NewArrivalsPage() {
  return (
    <div className="w-full bg-primary/5 dark:bg-primary/10 min-h-screen">
      <div className="container mx-auto py-4 px-4 min-h-[80vh]">
        {structuredDataScript("collection-page", webpageSchema(
          "New Arrivals | " + seoConfig.siteName,
          "Shop the latest comforter sets, bed sheets, and pillow covers just added.",
          `${seoConfig.siteUrl}/new-arrivals`,
        ))}

        <div className="mb-4">
          <h1 className="font-heading text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
            New Arrivals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            The latest comforter sets and bed sheets, freshly added.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar */}
          <Suspense fallback={<div className="w-full lg:w-64 shrink-0 h-96 bg-muted animate-pulse rounded-lg" />}>
            <ProductSidebar />
          </Suspense>

          {/* Main Content — defaults to newest-first (see products server
              route's sort=newest, which orders by createdAt desc, matching
              this page's whole purpose). */}
          <div className="flex-1 w-full">
            <Suspense fallback={<div className="w-full h-96 bg-muted animate-pulse rounded-lg" />}>
              <ProductContents />
            </Suspense>
          </div>
        </div>
      </div>
    </div>);
}

export default NewArrivalsPage;
