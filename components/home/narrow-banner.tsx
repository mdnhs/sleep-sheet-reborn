import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const NarrowBanner = () => {
  return (
    <section className="py-6 bg-background">
      <div className="container mx-auto px-4">
        <Link
          href="/track-order"
          className="block relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 hover:bg-primary/15 shadow-sm hover:shadow-md transition-all group"
        >
          {/* Decorative glow accents */}
          <div className="absolute -top-8 -right-4 h-28 w-28 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 left-1/4 h-24 w-24 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 px-5 md:px-8 min-h-16 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="shrink-0 flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 bg-white text-xl sm:text-2xl rounded-full shadow-md group-hover:scale-110 transition-transform duration-300">
                🚚
              </span>
              <h2 className="text-foreground text-sm sm:text-base md:text-lg font-semibold tracking-tight leading-snug">
                Already placed an order?{" "}
                <span className="font-extrabold text-primary underline decoration-2 underline-offset-4">
                  Track its status
                </span>{" "}
                in real-time.
              </h2>
            </div>

            <div className="shrink-0 flex items-center gap-2 bg-primary text-primary-foreground text-xs sm:text-sm font-bold uppercase tracking-wider px-4 py-2 sm:px-5 sm:py-2.5 rounded-full shadow-sm group-hover:gap-3 transition-all self-end sm:self-auto">
              <span>Track Order</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default NarrowBanner;
