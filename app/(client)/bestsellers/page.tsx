import ProductContents from "@/features/product/components/product-contents";
import ProductSidebar from "@/features/product/components/products-sidebar";
import React, { Suspense } from "react";
import { seoConfig, generateMetadata, webpageSchema, structuredDataScript } from "@/lib/seo";

export const metadata = generateMetadata({
  title: "Bestsellers",
  description: `Shop our bestselling comforter sets, bed sheets, and pillow covers at ${seoConfig.siteName}. 100% twill cotton fabric, cash on delivery.`,
  canonical: `${seoConfig.siteUrl}/bestsellers`,
})

function BestsellersPage() {
  return (
    <div className="w-full bg-primary/5 dark:bg-primary/10 min-h-screen">
      <div className="container mx-auto py-4 px-4 min-h-[80vh]">
        {structuredDataScript("collection-page", webpageSchema(
          "Bestsellers | " + seoConfig.siteName,
          "Shop our bestselling comforter sets, bed sheets, and pillow covers.",
          `${seoConfig.siteUrl}/bestsellers`,
        ))}

        <div className="mb-4">
          <h1 className="font-heading text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
            Bestsellers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Our most-ordered comforter sets and bed sheets, ranked by real sales.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar */}
          <Suspense fallback={<div className="w-full lg:w-64 shrink-0 h-96 bg-muted animate-pulse rounded-lg" />}>
            <ProductSidebar />
          </Suspense>

          {/* Main Content — defaults to sort=bestselling, ranked by total
              units sold from real, non-cancelled orders (see the
              salesSubquery in features/product/server/route.ts). */}
          <div className="flex-1 w-full">
            <Suspense fallback={<div className="w-full h-96 bg-muted animate-pulse rounded-lg" />}>
              <ProductContents initialSort="bestselling" />
            </Suspense>
          </div>
        </div>
      </div>
    </div>);
}

export default BestsellersPage;
