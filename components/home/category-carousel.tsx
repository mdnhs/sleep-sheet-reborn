"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import ProductCard from "../product/product-card";
import { useGetProducts } from "@/features/product/api/use-get-products";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryCarouselProps {
  categoryLabel?: string;
  categoryValue?: string;
  categoryImage?: string;
  isEven?: boolean;
}

const CategoryCarousel = ({ categoryLabel, categoryValue, categoryImage, isEven = false }: CategoryCarouselProps) => {
  const { data: products, isLoading } = useGetProducts({
    category: categoryLabel,
  });

  if (isLoading) {
    return (
      <section className={`py-6 md:py-10 relative overflow-hidden ${isEven ? 'bg-primary/5 dark:bg-primary/10' : 'bg-background'}`}>
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-row items-end justify-between mb-6">
          <div className="flex items-center gap-3">
            {categoryImage && (
              <div className="relative h-8 w-8 md:h-10 md:w-10 rounded-full overflow-hidden border shadow-sm">
                <Image src={categoryImage} alt={categoryLabel || "Category"} fill sizes="40px" className="object-cover" />
              </div>
            )}
            <h2 className="font-heading text-xl md:text-2xl font-medium text-foreground tracking-tight">
              {categoryLabel}
            </h2>
          </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="hidden sm:inline">View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[3/4] w-full rounded-[2rem]" />
                <Skeleton className="h-5 w-3/4 mt-2 rounded-xl" />
                <Skeleton className="h-5 w-1/4 rounded-xl" />
                <Skeleton className="h-12 w-full rounded-full mt-2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.data.length === 0) {
    return null;
  }

  return (
    <section className={`py-6 md:py-10 border-t border-slate-100 dark:border-slate-800 relative overflow-hidden ${isEven ? 'bg-primary/5 dark:bg-primary/10' : 'bg-background'}`}>
      <div className="container mx-auto px-4 relative">
        <div className="flex flex-row items-end justify-between mb-6">
          <div className="flex items-center gap-3">
            {categoryImage && (
              <div className="relative h-8 w-8 md:h-10 md:w-10 rounded-full overflow-hidden border shadow-sm">
                <Image src={categoryImage} alt={categoryLabel || "Category"} fill sizes="40px" className="object-cover" />
              </div>
            )}
            <h2 className="font-heading text-xl md:text-2xl font-medium text-foreground tracking-tight">
              {categoryLabel}
            </h2>
          </div>
          <Link
            href={`/shop?category=${categoryLabel}`}
            className="group flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
          >
            <span className="hidden sm:inline">View All</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <Carousel
          opts={{
            align: "start",
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4 md:-ml-6">
            {products?.data.map((product, index) => (
              <CarouselItem key={product.id} className="pl-4 md:pl-6 basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                <div className="h-full py-4">
                  <ProductCard product={product as any} priority={index < 2} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:flex items-center justify-end gap-2 mt-6">
            <CarouselPrevious className="relative inset-0 translate-y-0 h-10 w-10 border-border/50 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 dark:hover:bg-slate-700 hover:bg-white hover:text-primary transition-all shadow-sm" />
            <CarouselNext className="relative inset-0 translate-y-0 h-10 w-10 border-border/50 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 dark:hover:bg-slate-700 hover:bg-white hover:text-primary transition-all shadow-sm" />
          </div>
        </Carousel>
      </div>
    </section>
  );
};

export default CategoryCarousel;
