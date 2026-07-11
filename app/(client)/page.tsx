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
  return (
    <main>
      {structuredDataScript(
        "webpage",
        webpageSchema(
          seoConfig.defaultTitle,
          seoConfig.defaultDescription,
          seoConfig.siteUrl,
        ),
      )}
      {structuredDataScript("local-business", localBusinessSchema())}
      <Hero />

      {/* <Features /> */}

      <Categories />
      <NarrowBanner />
      <FeaturedProduct />
      <SubcategoryProducts />
    </main>
  );
}

export default Page;
