import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="container mx-auto px-4 pb-4 md:pb-8 pt-2 max-w-7xl min-h-[80vh]">
      {/* Checkout Steps Skeleton */}
      <div className="w-full flex justify-center mb-6 md:mb-10 mt-2 md:mt-4">
        <Skeleton className="h-10 md:h-12 w-64 md:w-96 rounded-full" />
      </div>

      <div className="flex flex-col-reverse lg:flex-row items-start gap-6 lg:gap-10 mt-2 md:mt-4">
        {/* Left Column (Shipping Form Skeleton) */}
        <div className="w-full lg:w-[55%]">
          <div className="bg-background border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 md:p-8 w-full ring-0">
            {/* Form Title */}
            <div className="space-y-2 mb-8">
              <Skeleton className="h-8 w-48 rounded-xl" />
              <Skeleton className="h-4 w-64 rounded-lg" />
            </div>

            {/* Inputs */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-14 w-full rounded-2xl" />
              </div>
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>

            {/* Next Button */}
            <div className="flex justify-end pt-8">
              <Skeleton className="h-14 w-full md:w-40 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right Column (Order Summary Skeleton) */}
        <div className="w-full lg:w-[45%] lg:sticky lg:top-24">
          <div className="bg-background border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 md:p-8 w-full ring-0">
            <Skeleton className="h-8 w-40 rounded-xl mb-6" />

            {/* Cart Items */}
            <div className="space-y-6 mb-8">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
                  <div className="flex flex-col gap-2 flex-1">
                    <Skeleton className="h-5 w-full rounded-lg" />
                    <Skeleton className="h-4 w-24 rounded-lg" />
                    <div className="flex justify-between mt-2">
                      <Skeleton className="h-5 w-16 rounded-lg" />
                      <Skeleton className="h-5 w-20 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-4 border-t border-border/40 pt-6">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-20 rounded-lg" />
                <Skeleton className="h-5 w-24 rounded-lg" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-5 w-16 rounded-lg" />
                <Skeleton className="h-5 w-16 rounded-lg" />
              </div>
              <div className="flex justify-between pt-4 border-t border-border/40">
                <Skeleton className="h-6 w-24 rounded-lg" />
                <Skeleton className="h-6 w-32 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
