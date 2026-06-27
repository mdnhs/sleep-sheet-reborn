import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="container mx-auto px-3 pb-4 pt-1 max-w-5xl">
      <div className="w-full flex justify-center mb-3 mt-1">
        <Skeleton className="h-7 w-48 rounded-full" />
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-4">
        <div className="w-full lg:w-3/5">
          <div className="bg-background border border-border/40 rounded-2xl p-4 w-full">
            <div className="space-y-2 mb-4">
              <Skeleton className="h-6 w-32 rounded-lg" />
              <Skeleton className="h-3 w-48 rounded-lg" />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-[50px] w-full rounded-xl" />
            </div>

            <div className="flex justify-end pt-4">
              <Skeleton className="h-11 w-full rounded-full" />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/5">
          <div className="bg-background border border-border/40 rounded-2xl p-4 w-full">
            <Skeleton className="h-5 w-28 rounded-lg mb-4" />

            <div className="space-y-3 mb-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Skeleton className="h-4 w-full rounded-lg" />
                    <Skeleton className="h-3 w-20 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-border/40 pt-3">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16 rounded-lg" />
                <Skeleton className="h-3 w-20 rounded-lg" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-14 rounded-lg" />
                <Skeleton className="h-3 w-14 rounded-lg" />
              </div>
              <div className="flex justify-between pt-2 border-t border-border/40">
                <Skeleton className="h-5 w-20 rounded-lg" />
                <Skeleton className="h-6 w-28 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
