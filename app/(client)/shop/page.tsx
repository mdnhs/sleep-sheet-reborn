import ProductContents from "@/features/product/components/product-contents";
import ProductSidebar from "@/features/product/components/products-sidebar";
import React, { Suspense } from "react";
import { seoConfig, generateMetadata, webpageSchema, structuredDataScript } from "@/lib/seo";

import { getPublicProducts } from "@/lib/prefetch-home";

export const metadata = generateMetadata({
  title: "All Products",
  description: `Browse our complete collection of comforter sets, bed sheets, and pillow covers online in Bangladesh. 100% twill cotton fabric, cash on delivery at ${seoConfig.siteName}.`,
  canonical: `${seoConfig.siteUrl}/shop`,
})

async function ProductsPage() {
  const productsRes = await getPublicProducts().catch(() => null);
  const products = productsRes?.data || [];

  return (
    <div className="w-full bg-primary/5 dark:bg-primary/10 min-h-screen">
      <div className="container mx-auto py-4 px-4 min-h-[80vh]">
        {structuredDataScript("collection-page", webpageSchema(
          "All Products | " + seoConfig.siteName,
          "Browse our complete collection of premium bedding, mattresses, pillows, and sleep accessories.",
          `${seoConfig.siteUrl}/shop`,
        ))}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar */}
          <Suspense fallback={<div className="w-full lg:w-64 shrink-0 h-96 bg-muted animate-pulse rounded-lg" />}>
            <ProductSidebar />
          </Suspense>
  
          {/* Main Content */}
          <div className="flex-1 w-full">
            <Suspense fallback={<div className="w-full h-96 bg-muted animate-pulse rounded-lg" />}>
              <ProductContents initialProducts={products} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>);
}

export default ProductsPage;
