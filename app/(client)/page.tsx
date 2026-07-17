import Categories from "@/components/home/categories";
import FeaturedProduct from "@/components/home/featured-product";
import Hero from "@/components/home/hero";
import NarrowBanner from "@/components/home/narrow-banner";
import SeoContent from "@/components/home/seo-content";
import SubcategoryProducts from "@/components/home/subcategory-products";
import { prefetchHomeData } from "@/lib/prefetch-home";
import {
  localBusinessSchema,
  seoConfig,
  structuredDataScript,
  webpageSchema,
} from "@/lib/seo";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

// ISR: regenerate the homepage at most once a minute so the prefetched
// content stays fresh without paying a DB round trip per request.
export const revalidate = 60;

async function Page() {
  // Seed React Query on the server so the hero/categories/products sections
  // render with real content in the initial HTML instead of skeletons.
  const queryClient = await prefetchHomeData();
  // No <main> here — the (client) layout already provides the single <main>
  // landmark. A nested second <main> is invalid HTML and hurts a11y/SEO.
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {structuredDataScript(
        "webpage",
        webpageSchema(
          seoConfig.defaultTitle,
          seoConfig.defaultDescription,
          seoConfig.siteUrl,
        ),
      )}
      {structuredDataScript("local-business", localBusinessSchema())}

      {/* Page-level H1. The hero is an image slider with no heading, so this
          gives crawlers a single descriptive H1 in the server HTML. */}
      <h1 className="sr-only">{seoConfig.defaultTitle}</h1>

      <Hero />

      {/* <Features /> */}

      <Categories />
      <NarrowBanner />
      <FeaturedProduct />
      <SubcategoryProducts />
      <SeoContent />
    </HydrationBoundary>
  );
}

export default Page;
