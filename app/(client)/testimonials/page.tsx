import { Suspense } from "react";
import TestimonialsClientPage from "./testimonials-client";
import { seoConfig, generateMetadata, webpageSchema, structuredDataScript } from "@/lib/seo";
import { getPublicTestimonials } from "@/lib/prefetch-home";

export const metadata = generateMetadata({
  title: "Customer Reviews",
  description: `Real reviews from ${seoConfig.siteName} customers — see what people are saying about our comforter sets, bed sheets, and pillow covers.`,
  canonical: `${seoConfig.siteUrl}/testimonials`,
});

function TestimonialsFallback() {
  return (
    <div className="container mx-auto py-12 px-4 min-h-[60vh]">
      <div className="text-center mb-10 space-y-3">
        <div className="h-10 w-64 bg-muted animate-pulse rounded-lg mx-auto" />
        <div className="h-5 w-80 bg-muted animate-pulse rounded-lg mx-auto" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[9/16] bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default async function TestimonialsPage() {
  const testimonialsRes = await getPublicTestimonials().catch(() => null);
  const testimonials = testimonialsRes?.data || [];

  return (
    <>
      {structuredDataScript("testimonials-listing", webpageSchema(
        "Customer Reviews | " + seoConfig.siteName,
        "Real reviews from Sleep Sheet customers.",
        `${seoConfig.siteUrl}/testimonials`,
      ))}
      <Suspense fallback={<TestimonialsFallback />}>
        <TestimonialsClientPage
          initialTestimonials={testimonials}
          initialHasNextPage={testimonialsRes?.hasNextPage ?? false}
          initialTotal={testimonialsRes?.total ?? 0}
        />
      </Suspense>
    </>
  );
}
