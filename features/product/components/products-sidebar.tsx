"use client";
import CategoryLoading from "@/components/loading/category-loading";
import { Button } from "@/components/ui/button";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useCurrency } from "@/hooks/use-currency";
import { Funnel } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useQueryState } from "nuqs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const PRICE_RANGES = [
  { value: "under-50", min: 0, max: 49, threshold: 50 },
  { value: "50-100", min: 50, max: 100, low: 50, high: 100 },
  { value: "100-200", min: 100, max: 200, low: 100, high: 200 },
  { value: "200+", min: 200, max: null, threshold: 200 },
];



export function MobileFilterSheet() {
  const [category] = useQueryState("category", { defaultValue: "", shallow: false });
  const [price] = useQueryState("price", { defaultValue: "", shallow: false });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const activeCategory = category || "All";
  const selectedPrice = price || null;

  return (
    <div className="lg:hidden">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger
          render={
            <Button
              variant="outline"
              className="h-10 rounded-full border-border/50 shadow-sm bg-background/50 backdrop-blur-sm text-foreground hover:bg-background px-4 sm:px-6"
            />
          }
        >
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Funnel className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            <span className="sm:hidden">Filter</span>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {(activeCategory !== "All" || selectedPrice) && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] text-background font-bold">
                {(activeCategory !== "All" ? 1 : 0) + (selectedPrice ? 1 : 0)}
              </span>
            )}
          </div>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[70vh] data-[side=bottom]:h-[70vh] rounded-t-[2rem] px-6 py-8">
          <SheetHeader className="mb-8 px-0 text-left">
            <SheetTitle className="font-heading text-2xl font-semibold">Filters</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto h-full pb-0 no-scrollbar">
            <ProductSidebarContent />

            <div className="sticky bottom-0 mt-8 pt-4 pb-8 bg-background border-t border-border/50">
              <Button
                className="w-full h-14 rounded-full text-base font-semibold shadow-xl shadow-foreground/10"
                onClick={() => setIsSheetOpen(false)}
              >
                View Results
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function ProductSidebarContent() {
  const { symbol } = useCurrency();
  const [category, setCategory] = useQueryState("category", { defaultValue: "", shallow: false });
  const [price, setPrice] = useQueryState("price", { defaultValue: "", shallow: false });
  const { data: categories = [], isLoading: isCategoryListLoading } = useGetCategories();

  const categoryList = [{ label: "All" }, ...categories];
  const activeCategory = category || "All";
  const selectedPrice = price || null;

  const handleCategoryClick = (cat: string) => {
    setCategory(cat === "All" ? null : cat);
  };

  const handlePriceChange = (value: string) => {
    setPrice(selectedPrice === value ? null : value);
  };

  return (
    <div className="space-y-10">
      {/* Categories */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Categories</h3>
        <div className="flex flex-col gap-1.5">
          {categoryList.map((cat) => {
            const isActive = activeCategory === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => handleCategoryClick(cat.label)}
                className={`flex items-center w-full px-3 py-2 rounded-xl text-sm transition-all duration-300 ${isActive
                    ? "bg-foreground text-background font-medium shadow-md shadow-foreground/10"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
        {isCategoryListLoading && <CategoryLoading />}
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Price Range</h3>
        <div className="flex flex-col gap-3">
          {PRICE_RANGES.map((range) => {
            const label =
              range.max === null
                ? `${symbol}${range.min}+`
                : range.min === 0
                  ? `Under ${symbol}${range.max}`
                  : `${symbol}${range.min} – ${symbol}${range.max}`;
            const isActive = selectedPrice === range.value;

            return (
              <button
                key={range.value}
                onClick={() => handlePriceChange(range.value)}
                className="flex items-center gap-3 text-left group"
              >
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isActive ? "border-foreground bg-foreground" : "border-border group-hover:border-foreground/50"
                    }`}
                >
                  {isActive && <div className="w-2 h-2 rounded-full bg-background" />}
                </div>
                <span className={`text-sm transition-colors ${isActive ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProductSidebar() {
  return (
    <aside className="hidden lg:block w-64 shrink-0 space-y-8 sticky top-24 pr-6">
      <ProductSidebarContent />
    </aside>
  );
}

export default ProductSidebar;
