"use client";
import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "../product/product-card";
import { useGetProducts } from "@/features/product/api/use-get-products";

const FeaturedProduct = () => {
  const { data: products, isLoading } = useGetProducts({
    sort: "featured",
  });

  if (isLoading) {
    return (
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-3/4 bg-secondary animate-pulse rounded-sm"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products) {
    return null;
  }

  return (
    <section className="py-20 md:py-28 bg-secondary/20">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
              Handpicked
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground mt-2">
              Featured Products
            </h2>
          </div>
          <Button
            variant="ghost"
            nativeButton={false}
            className="rounded-none px-0 text-sm font-medium gap-2 hover:bg-transparent hover:text-primary transition-colors group"
            render={
              <Link
                href="/products?sort=featured"
                className="flex items-center gap-2"
              />
            }
          >
            View All Products
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {products?.data.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProduct;
