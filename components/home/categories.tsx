"use client";

import { useGetCategory } from "@/features/categories/api/use-get-category";
import { useGetCollection } from "@/features/collections/api/use-get-collection";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Categories = () => {
  const { data } = useGetCategory();
  const { data: Collection } = useGetCollection();

  const displayedCategories = data?.categories.slice(0, 3);

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-lg mx-auto mb-12">
          <h1 className="text-3xl font-bold mb-4">Shop by Category</h1>
          <p className="text-muted-foreground">
            Explore our curated collections of premium essentials d esigned for
            modern living
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayedCategories?.map((category) => (
            <Link
              key={category?.value}
              href={`/products?sort=newest&category=${category?.label}`}
              className="group relative rounded-lg overflow-hidden h-80 product-card-hover bg-card"
            >
              <Image
                src={category?.image || ""}
                alt={category?.label as string}
                fill
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent transition-colors duration-500 flex flex-col p-6 text-white justify-end">
                <h1 className="text-lg font-bold">{category?.label}</h1>
                <span className="inline-block font-medium text-sm py-2 border-b-2 border-white w-fit transition-all group-hover:translate-x-2">
                  Shop Now
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
