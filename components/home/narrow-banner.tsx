import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const NarrowBanner = () => {
  return (
    <section className="py-2 bg-white">
      <div className="container mx-auto px-4">
        <Link href="/products?category=combos" className="block relative overflow-hidden rounded-2xl bg-[#fff5f0] group">
          {/* Faint background text matching the "50%" in the image */}
          <div className="absolute right-[30%] top-1/2 -translate-y-1/2 text-[#ffe4d6] font-black text-9xl leading-none select-none pointer-events-none -rotate-12 opacity-70">
            50%
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between py-4 px-6 md:px-8 lg:pr-64 min-h-[80px] gap-4">
            <div className="max-w-2xl">
              <h2 className="text-[#e25c27] text-lg md:text-xl font-bold mb-1 tracking-tight">
                In store or online your comfort & sleep is our top priority
              </h2>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                The only bedding brand that makes your life easier, helps you sleep better and wake up refreshed every single day.
              </p>
            </div>
            
            {/* Optional call to action arrow */}
            <div className="shrink-0 hidden md:flex items-center justify-center h-12 w-12 rounded-full bg-white text-[#e25c27] shadow-sm group-hover:scale-110 transition-transform">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
          
          {/* Decorative shapes to simulate the illustrations on the right */}
          <div className="absolute right-0 top-0 bottom-0 w-64 pointer-events-none hidden lg:block">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#ffddc2] rounded-full mix-blend-multiply opacity-70 blur-2xl"></div>
            <div className="absolute right-12 -bottom-12 w-48 h-48 bg-[#ffc4a3] rounded-full mix-blend-multiply opacity-50 blur-2xl"></div>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default NarrowBanner;
