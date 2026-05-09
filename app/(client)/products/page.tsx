import ProductContents from "@/features/product/components/product-contents";
import ProductSidebar from "@/features/product/components/products-sidebar";
import React, { Suspense } from "react";

function ProductsPage() {
  return (
    <div className=" container mx-auto py-16 px-4">
      <h1 className=" text-3xl font-bold inline-block mb-1">
        Shop All Products
      </h1>
      <p className=" text-muted-foreground font-medium">
        Browse our collection of our premium essentials
      </p>
      <div className=" flex flex-col md:flex-row gap-6 mt-8">
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
