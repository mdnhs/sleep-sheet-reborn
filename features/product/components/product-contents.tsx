"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sortOptions } from "@/lib/utils";
import React, { useEffect } from "react";
import { useGetProducts } from "../api/use-get-products";
import ProductCard from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { useQueryState } from "nuqs";
import { Skeleton } from "@/components/ui/skeleton";

import { MobileFilterSheet } from "./products-sidebar";

// ... inside ProductContents component
function ProductContents() {
  const [category] = useQueryState("category", { defaultValue: "" });
  const [price] = useQueryState("price", { defaultValue: "" });
  const [search] = useQueryState("search", { defaultValue: "" });
  const [sort, setSort] = useQueryState("sort", { defaultValue: "", shallow: false });
  const [page, setPage] = useQueryState("page", { defaultValue: "1", shallow: false });

  const currentPage = parseInt(page);

  const handleSortChange = (value: string | null) => {
    setSort(value || null);
    setPage("1");
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage.toString());
  };

  const { data: products, isLoading } = useGetProducts({
    category: category,
    sort: sort,
    price: price,
    search: search,
    page: page,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  return (
    <div className="w-full">
      <div className="flex flex-row justify-between items-center mb-8 gap-4 pb-4 border-b border-border/50">
        <p className="text-muted-foreground text-sm font-medium">
          Showing{" "}
          <span className="text-foreground">
            {products?.total
              ? `${(currentPage - 1) * 8 + 1} - ${(currentPage - 1) * 8 + products.data.length
              }`
              : "0"}
          </span>{" "}
          of {products?.total || 0} products
        </p>

        <MobileFilterSheet />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-[3/4] w-full rounded-[1.5rem]" />
              <div className="space-y-2 mt-2 px-1">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/4 rounded-md" />
              </div>
              <Skeleton className="h-10 w-full rounded-full mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {products?.data?.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>

          {products?.data.length === 0 && (
            <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px] gap-4 text-center">
              <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center mb-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </div>
              <h3 className="text-2xl font-semibold tracking-tight">No products found</h3>
              <p className="text-muted-foreground max-w-[300px]">Try adjusting your filters or search query to find what you're looking for.</p>
            </div>
          )}
        </>
      )}

      {(products?.total ?? 0) > 0 && !isLoading && (
        <div className="flex items-center justify-end gap-4 mt-10 pb-20">
          <Button
            className="w-[100px]"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage}
          </span>
          <Button
            className="w-[100px]"
            disabled={!products?.hasNextPage}
            onClick={() => handlePageChange(currentPage + 1)}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}

      {/* Floating Bottom Sort Tab */}
      <div className="fixed bottom-26 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center p-1.5 bg-background/80 backdrop-blur-md border border-border/50 rounded-full shadow-2xl">
        {[
          { label: "New Arrival", value: "newest" },
          { label: "Low to High", value: "price-asc" },
          { label: "High to Low", value: "price-desc" },
        ].map((option) => {
          const isActive = (sort || "newest") === option.value;
          return (
            <button
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap ${isActive
                ? "bg-foreground text-background shadow-md scale-105"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ProductContents;
