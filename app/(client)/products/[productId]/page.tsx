"use client";
import FeaturedProduct from "@/components/home/featured-product";
import { useGetProduct } from "@/features/product/api/use-get-product";
import ProductPicker from "@/features/product/components/product-picker";
import { ProductStatus } from "@/features/product/components/product-status";
import { ProductAccordion } from "@/features/product/components/product-accordion";
import { ProductReviews } from "@/features/product/components/product-reviews";
import ProductTag from "@/features/product/components/product-tags";
import { OrderCountdown } from "@/features/product/components/order-countdown";
import SwitchImage from "@/features/product/components/switch-image";
import { useProductId } from "@/features/product/hooks/use-product-id";
import { RotateCw, Truck, Tag, Package, CalendarClock } from "lucide-react";
import React from "react";
import { useCurrency } from "@/hooks/use-currency";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

function ProductSkeleton() {
  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <div className="container mx-auto px-4 py-2 lg:py-8">
        {/* Breadcrumbs */}
        <div className="hidden lg:block mb-8">
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16">
          {/* Left Column: Image Gallery Skeleton */}
          <div className="relative w-full rounded-[2rem] sm:rounded-[2.5rem] bg-secondary/20 overflow-hidden shadow-sm h-[280px] sm:h-[400px] lg:h-[550px]">
            <Skeleton className="w-full h-full rounded-none" />
            
            {/* Thumbnails Overlay */}
            <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex justify-center gap-2 sm:gap-3 px-4 z-10">
              {[...Array(3)].map((_, index) => (
                <Skeleton 
                  key={index} 
                  className={`aspect-[4/5] w-16 sm:w-24 md:w-28 rounded-lg sm:rounded-2xl ${index === 0 ? 'ring-2 ring-white border-none' : 'border-2 border-transparent'}`} 
                />
              ))}
            </div>
          </div>

          {/* Right Column: Product Info Skeleton */}
          <div className="flex flex-col pt-0 lg:pt-2 space-y-6">
            {/* Title */}
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>

            {/* Delivery Badge */}
            <Skeleton className="h-8 w-72 rounded-full" />

            {/* Select Color */}
            <div className="space-y-3 pt-2">
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-20 rounded-full" />
                ))}
              </div>
            </div>

            {/* Select Size */}
            <div className="space-y-3 pt-2">
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-20 rounded-full" />
                ))}
              </div>
            </div>

            {/* Quantity, Price, Wishlist Row */}
            <div className="flex items-center justify-between pt-4 pb-2">
              <Skeleton className="h-12 w-28 rounded-full" />
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>

            {/* Action Buttons Row 1 */}
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-14 w-full rounded-full" />
              <Skeleton className="h-14 w-full rounded-full" />
            </div>

            {/* Action Buttons Row 2 */}
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full rounded-full" />
              <Skeleton className="h-12 w-full rounded-full" />
            </div>

            {/* Accordion area */}
            <div className="space-y-4 pt-6">
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetailPage() {
  const id = useProductId();
  const { data: product, isLoading } = useGetProduct({ id });
  const { formatAmount } = useCurrency();

  if (isLoading) return <ProductSkeleton />;
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

            <OrderCountdown />

            <ProductPicker product={product} />

            <div className="mt-4">
              <ProductAccordion product={product} />
            </div>
          </div>
        </div>

        {/* Full-width Details Section */}
        <div className="mt-16 border-t border-border/60 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Description & Fit</h2>
              <div 
                className="prose prose-sm md:prose-base dark:prose-invert text-muted-foreground leading-relaxed max-w-none" 
                dangerouslySetInnerHTML={{ __html: product.description || "" }} 
              />
            </div>

            {/* Product Features */}
            {product.features && product.features.length > 0 && (
              <div className="pt-6 border-t border-border/40">
                <h2 className="text-xl font-bold text-foreground mb-4">Product Features</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 list-disc pl-5 text-muted-foreground text-sm">
                  {product.features.map((feature, i) => (
                    <li key={i} className="leading-relaxed">{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="pt-6 border-t border-border/40">
                <h2 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Product Tags</h2>
                <ProductTag tags={product.tags} />
              </div>
            )}
          </div>

          {/* Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="bg-secondary/10 border border-border/50 rounded-3xl p-6 md:p-8 h-fit">
              <h2 className="text-xl font-bold text-foreground mb-4">Specifications</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border/50">
                  <tbody className="divide-y divide-border/40">
                    {product.specifications.map((spec, i) => (
                      <tr key={i} className="hover:bg-secondary/10 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-sm text-foreground w-1/3 leading-normal">
                          {spec.key}
                        </td>
                        <td className="py-3 text-sm text-muted-foreground leading-normal">
                          {spec.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
