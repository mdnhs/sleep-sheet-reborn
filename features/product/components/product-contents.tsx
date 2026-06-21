"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryParams } from "@/hooks/use-query-parms";
import { sortOptions } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { useGetProducts } from "../api/use-get-products";
import ProductCard from "@/components/product/product-card";
import { Button } from "@/components/ui/button";

function ProductContents() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort");
  const currentPage = parseInt(searchParams.get("page") || "1");

  const handleSortChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/products?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/products?${params.toString()}`);
  };

  const { getAllParams } = useQueryParams();
  const { category, sort, price } = getAllParams();
  const { data: products, isLoading } = useGetProducts({
    category: category,
    sort: sort,
    price: price,
    page: currentPage.toString(),
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <p className="text-muted-foreground text-sm">
          Showing{" "}
          {products?.total
            ? `${(currentPage - 1) * 8 + 1} - ${
                (currentPage - 1) * 8 + products.data.length
              } of ${products.total} products`
            : "0 Products"}
        </p>

        <div className="flex flex-row items-center gap-4">
          <label className="text-sm">Sort by:</label>
          <Select value={currentSort || ""} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select sort" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className=" grid grid-cols-2 lg:grid-cols-4 gap-6">
        {products?.data?.map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index < 4} />
        ))}
      </div>
      {products?.data.length === 0 && (
        <div className="flex items-center justify-center w-full h-full min-h-[300px]">
          <p className=" text-2xl font-bold"> No products found.</p>
        </div>
      )}
      {isLoading && (
        <div className="flex items-center justify-center w-full h-full min-h-[300px]">
          <p className=" text-2xl font-bold"> Loading...</p>
        </div>
      )}
      {(products?.total ?? 0) > 0 && !isLoading && (
        <div className="flex items-center justify-end gap-4 mt-10">
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
    </div>
  );
}

export default ProductContents;
