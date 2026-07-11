"use client";
import CategoryLoading from "@/components/loading/category-loading";
import { Button } from "@/components/ui/button";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useCurrency } from "@/hooks/use-currency";
import { Funnel, RefreshCcw } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useQueryState } from "nuqs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";





export function MobileFilterSheet({ side = "bottom" }: { side?: "bottom" | "left" | "right" }) {
  const [category] = useQueryState("category", { defaultValue: "", shallow: false });
  const [price] = useQueryState("price", { defaultValue: "", shallow: false });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const activeCategory = category || "All";
  const selectedPrice = price || null;

  return (
    <div>
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
        <SheetContent 
          side={side} 
          className={side === "bottom" 
            ? "h-[70vh] data-[side=bottom]:h-[70vh] rounded-t-[2rem] px-6 py-8" 
            : "w-full sm:max-w-md px-6 py-8"
          }
        >
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
  
  // URL States
  const [categoryParam, setCategoryParam] = useQueryState("category", { defaultValue: "", shallow: false });
  const [minPrice, setMinPrice] = useQueryState("minPrice", { defaultValue: "", shallow: false });
  const [maxPrice, setMaxPrice] = useQueryState("maxPrice", { defaultValue: "", shallow: false });
  
  // Local states
  const [localPrice, setLocalPrice] = useState<number[]>([
    minPrice ? parseInt(minPrice) : 0, 
    maxPrice ? parseInt(maxPrice) : 5000
  ]);

  const { data: categories = [], isLoading: isCategoryListLoading } = useGetCategories();

  const selectedCategories = categoryParam ? categoryParam.split(",").filter(Boolean) : [];

  // Update slider local state, debounce URL update
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinPrice(localPrice[0] > 0 ? localPrice[0].toString() : null);
      setMaxPrice(localPrice[1] < 5000 ? localPrice[1].toString() : null);
    }, 500);
    return () => clearTimeout(timer);
  }, [localPrice, setMinPrice, setMaxPrice]);

  const toggleCategory = (label: string) => {
    const newCategories = selectedCategories.includes(label)
      ? selectedCategories.filter(c => c !== label)
      : [...selectedCategories, label];
    
    setCategoryParam(newCategories.length > 0 ? newCategories.join(",") : null);
  };

  const handleResetCategories = () => {
    setCategoryParam(null);
  };

  const parentCategories = categories.filter(c => !c.parentId);

  return (
    <div className="space-y-10">
      {/* Price Range */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-6 flex items-center gap-2">
          <span className="text-muted-foreground">{symbol}</span> Price Range
        </h3>
        <div className="px-2">
          <Slider
            min={0}
            max={5000}
            step={50}
            value={localPrice}
            onValueChange={(val) => setLocalPrice(val as number[])}
            className="mb-4"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mt-4">
            <span>{localPrice[0].toLocaleString()} {symbol}</span>
            <span>{localPrice[1].toLocaleString()} {symbol}</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg text-foreground flex items-center gap-2">
            <span className="text-muted-foreground rotate-45 text-sm font-light">⬣</span> Categories
          </h3>
          <button 
            onClick={handleResetCategories}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Reset categories"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
        
        {isCategoryListLoading ? (
          <CategoryLoading />
        ) : (
          <div className="flex flex-col gap-4">
            {parentCategories.map((parent) => {
              const children = categories.filter(c => c.parentId === parent.id);
              return (
                <div key={parent.id} className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox 
                      checked={selectedCategories.includes(parent.label)}
                      onCheckedChange={() => toggleCategory(parent.label)}
                      className="border-muted-foreground/30 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500 rounded-sm"
                    />
                    <span className="text-sm font-medium text-foreground group-hover:text-rose-500 transition-colors">
                      {parent.label}
                    </span>
                  </label>
                  
                  {children.length > 0 && (
                    <div className="flex flex-col gap-3 pl-7 border-l-2 border-muted/50 ml-2">
                      {children.map(child => (
                        <label key={child.id} className="flex items-center gap-3 cursor-pointer group">
                          <Checkbox 
                            checked={selectedCategories.includes(child.label)}
                            onCheckedChange={() => toggleCategory(child.label)}
                            className="border-muted-foreground/30 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500 rounded-sm"
                          />
                          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                            {child.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
