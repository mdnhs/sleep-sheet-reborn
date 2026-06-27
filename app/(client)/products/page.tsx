import ProductContents from "@/features/product/components/product-contents";
import ProductSidebar from "@/features/product/components/products-sidebar";
import React, { Suspense } from "react";
import { seoConfig, generateMetadata, webpageSchema, structuredDataScript } from "@/lib/seo";

export const metadata = generateMetadata({
  title: "All Products",
  description: `Browse our complete collection of premium bedding, mattresses, pillows, and sleep accessories at ${seoConfig.siteName}.`,
  canonical: `${seoConfig.siteUrl}/products`,
})

function ProductsPage() {
  return (
    <div className="container mx-auto py-4 px-4 min-h-[80vh]">
      {structuredDataScript("collection-page", webpageSchema(
        "All Products | " + seoConfig.siteName,
        "Browse our complete collection of premium bedding, mattresses, pillows, and sleep accessories.",
        `${seoConfig.siteUrl}/products`,
      ))}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <Suspense
          fallback={
            <div className="p-4 text-center text-muted-foreground">
              Loading products...
            </div>
          }
        >
          <ProductSidebar />
          <ProductContents />
        </Suspense>
      </div>
    </div>
  );
}

export default ProductsPage;
