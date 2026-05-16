"use client";

import { useGetCategory } from "@/features/categories/api/use-get-category";
import { useGetCollection } from "@/features/collections/api/use-get-collection";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Categories = () => {
  const { data } = useGetCategory();
  const { data: Collection } = useGetCollection();

  const displayedCategories = data?.categories.slice(0, 5);

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header with extending rule */}
        <div className="flex items-end gap-8 mb-14">
          <div className="shrink-0">
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
              Collections
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground mt-2">
              Shop by Category
            </h2>
          </div>
          <div className="flex-1 h-px bg-border mb-2 hidden md:block" />
          <Link
            href="/products"
            className="shrink-0 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors mb-2 hidden md:flex items-center gap-1.5"
          >
            All Products <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {displayedCategories?.map((category, index) => (
            <Link
              key={category?.value}
              href={`/products?sort=newest&category=${category?.label}`}
              className={`group relative overflow-hidden bg-secondary ${
                index === 0
                  ? "col-span-2 md:col-span-1 md:row-span-2 h-72 md:h-full"
                  : "col-span-1 h-56 md:h-56"
              }`}
            >
              <Image
                src={category?.image || ""}
                alt={category?.label as string}
                fill
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

              {/* Bottom label */}
              <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
                <div>
                  <h3 className="text-white font-heading text-xl font-light">
                    {category?.label}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-white/70 text-xs uppercase tracking-wider mt-1.5 group-hover:text-white transition-colors">
                    Explore
                    <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
