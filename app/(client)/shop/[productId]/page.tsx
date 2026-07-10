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
import { seoConfig, productSchema, breadcrumbSchema, structuredDataScript } from "@/lib/seo";

function ProductSkeleton() {
  return (
    <div className="bg-primary/5 dark:bg-primary/10 min-h-screen">
      <div className="container mx-auto px-4 py-2 lg:py-8">
        <div className="hidden lg:block mb-8">
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16">
          <div className="relative w-full rounded-[2rem] sm:rounded-[2.5rem] bg-secondary/20 overflow-hidden shadow-sm h-[280px] sm:h-[400px] lg:h-[550px]">
            <Skeleton className="w-full h-full rounded-none" />
            <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex justify-center gap-2 sm:gap-3 px-4 z-10">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] w-16 sm:w-24 md:w-28 rounded-lg sm:rounded-2xl" />
              ))}
            </div>
          </div>

          <div className="flex flex-col pt-0 lg:pt-2">
            <Skeleton className="h-10 w-full rounded-xl mb-3" />
            <Skeleton className="h-8 w-72 rounded-full mb-6" />
            <div className="space-y-3 mb-6">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-9 w-16 rounded-full" />
                ))}
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-9 w-16 rounded-full" />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-4 border-y border-border/40 mb-4">
              <Skeleton className="h-10 w-28 rounded-full" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Skeleton className="h-14 w-full rounded-full" />
              <Skeleton className="h-14 w-full rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Skeleton className="h-12 w-full rounded-full" />
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className={`w-full rounded-2xl ${i === 0 ? 'h-28' : 'h-14'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-border/60 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <Skeleton className="h-6 w-44 mb-4" />
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className={`h-4 w-full ${i === 5 ? 'w-3/4' : ''}`} />
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-border/40">
              <Skeleton className="h-6 w-44 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          </div>
          <div className="bg-secondary/10 border border-border/50 rounded-3xl p-6 md:p-8">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-20 pt-16 bg-white dark:bg-slate-900 border-t border-border/50">
        <div className="container mx-auto px-4 mb-8">
          <Skeleton className="h-8 w-64 mx-auto" />
        </div>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-3xl" />
            ))}
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

  const categoryLabel = product.categoryLabel || product.category || "Products"
  const categorySlug = product.category || "products"
  const productBreadcrumbs = [
    { name: "Home", url: "/" },
    { name: categoryLabel, url: `/shop?category=${encodeURIComponent(categoryLabel)}` },
    { name: product.name, url: `/shop/${id}` },
  ]

  return (
    <div className="bg-primary/5 dark:bg-primary/10 min-h-screen">
      {structuredDataScript("product", productSchema({
        id,
        name: product.name,
        description: product.description,
        slug: id,
        price: product.price,
        currency: "BDT",
        sku: product.sku,
        category: product.category,
        images: product.images,
        rating: product.rating,
        reviewCount: product.reviewCount,
        availability: product.stock > 0 ? "InStock" : "OutOfStock",
        url: `${seoConfig.siteUrl}/shop/${id}`,
      }))}
      {structuredDataScript("breadcrumbs", breadcrumbSchema(productBreadcrumbs))}
      <div className="container mx-auto px-4 py-2 lg:py-8">
        <div className="hidden lg:flex items-center gap-0 mb-8 text-xs text-muted-foreground font-medium">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 18-6-6 6-6" /></svg>
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span className="mx-2 text-border">•</span>
          <Link href={`/shop?category=${encodeURIComponent(categoryLabel)}`} className="hover:text-foreground transition-colors">{categoryLabel}</Link>
          <span className="mx-2 text-border">•</span>
          <span className="text-foreground">{product.name}</span>
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

      <div className="mt-20 pt-16 bg-white dark:bg-slate-900 border-t border-border/50">
        <div className="container mx-auto px-4 mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-center text-foreground tracking-tight">You might also like</h2>
        </div>
        <FeaturedProduct />
      </div>
    </div>
  );
}

export default ProductDetailPage;
