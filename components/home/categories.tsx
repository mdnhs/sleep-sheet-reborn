"use client";

import { useGetCategory } from "@/features/categories/api/use-get-category";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";

const Categories = () => {
  const { data, isLoading } = useGetCategory();

  const displayedCategories = data?.categories || [];

  if (isLoading) {
    return (
      <section className="py-10 bg-white dark:bg-slate-900 relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="flex gap-4 md:gap-8 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-4 w-[110px] sm:w-[130px] shrink-0 p-2">
                <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 bg-white dark:bg-slate-900 relative overflow-hidden">
      <div className="container mx-auto px-4 relative">
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
          }}
          className="w-full max-w-7xl mx-auto"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {displayedCategories?.map((category) => (
              <CarouselItem
                key={category?.value}
                className="pl-2 md:pl-4 basis-auto"
              >
                <Link
                  href={`/shop?sort=newest&category=${category?.label}`}
                  className="flex flex-col items-center gap-4 group shrink-0 w-[110px] sm:w-[130px] p-2"
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-500 shadow-sm group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.12)] border-2 border-transparent group-hover:border-primary/10">
                    <Image
                      src={category?.image || ""}
                      alt={category?.label as string}
                      fill
                      sizes="112px"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 rounded-full"></div>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs sm:text-[13px] font-medium tracking-wide text-foreground/80 group-hover:text-primary transition-colors duration-300 text-center">
                      {category?.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      ({category?.productCount ?? 0})
                    </span>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="-left-4 lg:-left-12 h-10 w-10 border-border/50 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 dark:hover:bg-slate-700 hover:bg-white hover:text-primary transition-all shadow-sm" />
            <CarouselNext className="-right-4 lg:-right-12 h-10 w-10 border-border/50 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 dark:hover:bg-slate-700 hover:bg-white hover:text-primary transition-all shadow-sm" />
          </div>
        </Carousel>
      </div>
    </section>
  );
};

export default Categories;

