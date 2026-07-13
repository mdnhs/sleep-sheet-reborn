import Categories from "@/components/home/categories";
import FeaturedProduct from "@/components/home/featured-product";
import Hero from "@/components/home/hero";
import NarrowBanner from "@/components/home/narrow-banner";
import SubcategoryProducts from "@/components/home/subcategory-products";
import {
  localBusinessSchema,
  seoConfig,
  structuredDataScript,
  webpageSchema,
} from "@/lib/seo";

async function Page() {
  // No <main> here — the (client) layout already provides the single <main>
  // landmark. A nested second <main> is invalid HTML and hurts a11y/SEO.
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

      {/* <Features /> */}

      <Categories />
      <NarrowBanner />
      <FeaturedProduct />
      <SubcategoryProducts />
    </>
  );
}

export default Page;
