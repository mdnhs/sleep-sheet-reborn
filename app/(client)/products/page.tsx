import ProductContents from "@/features/product/components/product-contents";
import ProductSidebar from "@/features/product/components/products-sidebar";
import React, { Suspense } from "react";

function ProductsPage() {
  return (
    <div className="container mx-auto py-4 px-4 min-h-[80vh]">
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
