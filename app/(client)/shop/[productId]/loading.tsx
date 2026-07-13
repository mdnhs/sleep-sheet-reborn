import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="bg-primary/5 dark:bg-primary/10 min-h-screen">
      <div className="container mx-auto px-4 py-2 lg:py-8">
        <div className="hidden lg:block mb-8">
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16">
          <div className="relative w-full rounded-[2rem] sm:rounded-[2.5rem] bg-secondary/20 overflow-hidden shadow-sm h-[280px] sm:h-[400px] lg:h-[550px]">
            <Skeleton className="w-full h-full rounded-none" />
            <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex justify-center gap-2 sm:gap-3 px-4 z-10">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] w-16 sm:w-24 md:w-28 rounded-lg sm:rounded-2xl" />
              ))}
            </div>
          </div>

          <div className="flex flex-col pt-0 lg:pt-2">
            <Skeleton className="h-10 w-full rounded-xl mb-3" />
            <Skeleton className="h-8 w-72 rounded-full mb-6" />
            <div className="space-y-3 mb-6">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-9 w-16 rounded-full" />
                ))}
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-9 w-16 rounded-full" />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-4 border-y border-border/40 mb-4">
              <Skeleton className="h-10 w-28 rounded-full" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Skeleton className="h-14 w-full rounded-full" />
              <Skeleton className="h-14 w-full rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Skeleton className="h-12 w-full rounded-full" />
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className={`w-full rounded-2xl ${i === 0 ? 'h-28' : 'h-14'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-border/60 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <Skeleton className="h-6 w-44 mb-4" />
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className={`h-4 w-full ${i === 5 ? 'w-3/4' : ''}`} />
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-border/40">
              <Skeleton className="h-6 w-44 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          </div>
          <div className="bg-secondary/10 border border-border/50 rounded-3xl p-6 md:p-8">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-20 pt-16 bg-white dark:bg-slate-900 border-t border-border/50">
        <div className="container mx-auto px-4 mb-8">
          <Skeleton className="h-8 w-64 mx-auto" />
        </div>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
