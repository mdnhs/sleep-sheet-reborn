"use client";

import { useGetCategory } from "@/features/categories/api/use-get-category";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Categories = () => {
  const { data } = useGetCategory();

  const displayedCategories = data?.categories || [];

  return (
    <section className="py-6 bg-white">
      <div className="container mx-auto px-4">
        {/* Horizontal scrollable container for categories */}
        <div className="flex gap-4 md:gap-8 overflow-x-auto pb-6 scrollbar-hide snap-x justify-start lg:justify-center">
          {displayedCategories?.map((category) => (
            <Link
              key={category?.value}
              href={`/products?sort=newest&category=${category?.label}`}
              className="flex flex-col items-center gap-4 group shrink-0 snap-center w-[110px] sm:w-[130px]"
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#f8f9fa] flex items-center justify-center relative overflow-hidden transition-all duration-300 shadow-sm group-hover:shadow-md border border-slate-100">
                <Image
                  src={category?.image || ""}
                  alt={category?.label as string}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <span className="text-xs sm:text-sm font-bold text-center text-slate-800 transition-colors">
                {category?.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

    </section>
  );
};

export default Categories;

