import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const NarrowBanner = () => {
  return (
    <section className="py-3 bg-background">
      <div className="container mx-auto px-4">
        <Link
          href="/track-order"
          className="flex items-center justify-between gap-3 rounded-full bg-background border border-primary/20 hover:bg-primary/5 dark:bg-slate-900/40 px-2.5 py-2 sm:px-3 sm:py-2.5 transition-colors group"
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="shrink-0 flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 bg-primary/15 text-sm sm:text-base rounded-full">
              🚚
            </span>
            <p className="text-foreground text-xs sm:text-sm font-medium truncate">
              Already placed an order?{" "}
              <span className="text-muted-foreground font-normal">
                Track it in real-time.
              </span>
            </p>
          </div>

          <span className="shrink-0 flex items-center gap-1 text-primary text-xs sm:text-sm font-bold group-hover:gap-1.5 transition-all">
            Track
            <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      </div>
    </section>
  );
};

export default NarrowBanner;
