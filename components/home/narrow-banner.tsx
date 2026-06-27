import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const NarrowBanner = () => {
  return (
    <section className="py-6 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <Link
          href="/products?category=combos"
          className="block relative overflow-hidden rounded-xl border border-orange-100 bg-orange-50/50 hover:bg-orange-50 transition-colors group"
        >
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 px-4 md:px-6 min-h-[50px] gap-2 sm:gap-4">
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
              <span className="shrink-0 mt-0.5 sm:mt-0 flex items-center justify-center h-5 sm:h-6 px-1.5 sm:px-2 bg-orange-600 text-white text-[9px] sm:text-[10px] uppercase font-bold tracking-widest rounded-sm">
                Offer
              </span>
              <h2 className="text-orange-900 text-xs sm:text-sm md:text-[15px] font-medium tracking-tight leading-snug">
                Get <span className="font-bold">50% off</span> on all combo purchases this week.
              </h2>
            </div>

            <div className="shrink-0 flex items-center gap-1.5 text-orange-600 text-[10px] sm:text-xs font-semibold uppercase tracking-wider group-hover:text-orange-700 transition-colors self-end sm:self-auto">
              <span className="inline">Shop Combos</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default NarrowBanner;
