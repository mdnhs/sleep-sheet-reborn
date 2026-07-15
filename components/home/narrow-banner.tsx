import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const NarrowBanner = () => {
  return (
    <section className="py-6 bg-background">
      <div className="container mx-auto px-4">
        <Link
          href="/track-order"
          className="block relative overflow-hidden rounded-xl border border-primary/15 bg-primary/5 hover:bg-primary/10 transition-colors group"
        >
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 px-4 md:px-6 min-h-[50px] gap-2 sm:gap-4">
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
              <span className="shrink-0 mt-0.5 sm:mt-0 flex items-center justify-center h-5 sm:h-6 px-1.5 sm:px-2 bg-primary text-primary-foreground text-[9px] sm:text-[10px] uppercase font-bold tracking-widest rounded-sm">
                Track
              </span>
              <h2 className="text-foreground text-xs sm:text-sm md:text-[15px] font-medium tracking-tight leading-snug">
                Already placed an order? <span className="font-bold">Track its status</span> in real-time.
              </h2>
            </div>

            <div className="shrink-0 flex items-center gap-1.5 text-primary text-[10px] sm:text-xs font-semibold uppercase tracking-wider group-hover:text-primary/80 transition-colors self-end sm:self-auto">
              <span className="inline">Track Order</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default NarrowBanner;
