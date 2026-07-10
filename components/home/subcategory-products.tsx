"use client";

import React from "react";
import CategoryCarousel from "./category-carousel";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { Skeleton } from "@/components/ui/skeleton";

const SubcategoryProducts = () => {
  const { data: categories, isLoading } = useGetCategories();

  if (isLoading) {
    return (
      <section className="py-6 md:py-10 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-row items-end justify-between mb-6">
            <div>
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[3/4] w-full rounded-[2rem]" />
                <Skeleton className="h-5 w-3/4 mt-2 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  // Filter for subcategories (categories that have a parentId)
  const subcategories = categories.filter((c: any) => c.parentId !== null);

  // If there are no subcategories, maybe fallback to all categories or just render nothing
  const displayCategories = subcategories.length > 0 ? subcategories : categories;

  return (
    <>
      {displayCategories.map((category: any, index: number) => (
        <CategoryCarousel
          key={category.id}
          categoryLabel={category.label}
          categoryValue={category.value}
          isEven={index % 2 !== 0}
        />
      ))}
    </>
  );
};

export default SubcategoryProducts;
