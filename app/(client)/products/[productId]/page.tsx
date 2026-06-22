"use client";
import FeaturedProduct from "@/components/home/featured-product";
import { useGetProduct } from "@/features/product/api/use-get-product";
import ProductPicker from "@/features/product/components/product-picker";
import { ProductStatus } from "@/features/product/components/product-status";
import { ProductAccordion } from "@/features/product/components/product-accordion";
import { ProductReviews } from "@/features/product/components/product-reviews";
import ProductTag from "@/features/product/components/product-tags";
import SwitchImage from "@/features/product/components/switch-image";
import { useProductId } from "@/features/product/hooks/use-product-id";
import { RotateCw, Truck, Tag, Package, CalendarClock } from "lucide-react";
import React from "react";
import { useCurrency } from "@/hooks/use-currency";
import Link from "next/link";

function ProductDetailPage() {
  const id = useProductId();
  const { data: product, isLoading } = useGetProduct({ id });
  const { formatAmount } = useCurrency();

  if (isLoading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <div className="container mx-auto px-4 py-2 lg:py-8">
        {/* Breadcrumbs */}
        <div className="hidden lg:block mb-8">
          <Link href="/" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 18-6-6 6-6" /></svg>
            Home
            <span className="mx-2 text-border">•</span>
            <span className="text-foreground">Product details</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16">
          {/* Left Column: Image Gallery */}
          <div>
            <SwitchImage product={product} />
          </div>

          {/* Right Column: Product Info */}
          <div className="flex flex-col pt-0 lg:pt-2">

            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2 lg:mb-3">
              <h1 className="font-heading text-xl lg:text-4xl font-semibold tracking-tight text-foreground">
                {product.name}
              </h1>
            </div>

            <div className="mb-2 lg:mb-4 inline-flex items-center gap-2 border border-border rounded-full px-3 py-1 sm:px-4 bg-background w-fit max-w-full">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                Order in <span className="font-semibold text-foreground">02:30:25</span> to get next day delivery
              </p>
            </div>

            <ProductPicker product={product} />

            <div className="mt-4">
              <ProductAccordion product={product} />
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <ProductReviews product={product} />
      </div>

      <div className="mt-20 pt-16 bg-white border-t border-border/50">
        <div className="container mx-auto px-4 mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-center text-foreground tracking-tight">You might also like</h2>
        </div>
        <FeaturedProduct />
      </div>
    </div>
  );
}

export default ProductDetailPage;
