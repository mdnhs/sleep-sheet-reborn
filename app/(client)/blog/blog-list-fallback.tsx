import { Skeleton } from '@/components/ui/skeleton';

/**
 * Prerendered placeholder for the Suspense boundary around BlogClientPage.
 * Mirrors that component's own loading state so hydration doesn't shift layout.
 */
export default function BlogListFallback() {
  return (
    <div className="container mx-auto py-12 px-4 min-h-[80vh]">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Our Blog</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Read our latest stories, news, and insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
