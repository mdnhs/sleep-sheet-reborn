import BlogCarousel from "@/components/home/blog-carousel";
import Categories from "@/components/home/categories";
import FeaturedProduct from "@/components/home/featured-product";
import Hero from "@/components/home/hero";
import NarrowBanner from "@/components/home/narrow-banner";
import SeoContent from "@/components/home/seo-content";
import SubcategoryProducts from "@/components/home/subcategory-products";
import {
  localBusinessSchema,
  seoConfig,
  structuredDataScript,
  webpageSchema,
} from "@/lib/seo";

// The hero (the LCP element) server-renders from the settings seeded in the
// (client) layout, so it appears in the initial HTML without a page-level
// prefetch. The below-the-fold product/category carousels deliberately fetch
// on the client (they already render skeletons): server-rendering them only
// moved their heavy hydration into the initial load window, spiking Total
// Blocking Time and — on mobile — delaying the hero paint. Fetching them
// after paint keeps that work off the critical path.
import { getPublicCategories, getPublicProducts } from "@/lib/prefetch-home";

async function Page() {
  const [categoriesRes, productsRes] = await Promise.all([
    getPublicCategories().catch(() => null),
    getPublicProducts().catch(() => null),
  ]);

  const categories = categoriesRes?.categories || [];
  const products = productsRes?.data || [];

  return (
    <>
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

      <Categories initialData={categories} />
      <NarrowBanner />
      <FeaturedProduct initialData={products} />
      <SubcategoryProducts />
      <BlogCarousel />
      <SeoContent />
    </>
  );
}

export default Page;
