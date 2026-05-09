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
    return <div className="container mx-auto py-16">Loading...</div>;
  }

  if (!products) {
    return <div className="container mx-auto py-16">No products found</div>;
  }

  return (
    <section className="py-16 md:py-24">
      <div className=" container mx-auto p-4">
        <div className=" flex flex-col md:flex-row items-start justify-between mb-8">
          <div>
            <h2 className=" text-3xl font-bold mb-2">Featured Product</h2>
            <p className=" text-muted-foreground">
              Our most loved products by our customers
            </p>
          </div>
          <Button
            variant="ghost"
            nativeButton={false}
            className="mt-4 md:mt-0"
            render={
              <Link
                href="/products?sort=featured"
                className="flex items-center gap-2"
              />
            }
          >
            View All Products <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products?.data.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProduct;
