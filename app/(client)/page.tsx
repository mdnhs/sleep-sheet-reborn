import Categories from "@/components/home/categories";
import FeaturedProduct from "@/components/home/featured-product";
import SubcategoryProducts from "@/components/home/subcategory-products";
import Hero from "@/components/home/hero";
import NarrowBanner from "@/components/home/narrow-banner";
import Newsletter from "@/components/home/newsletter";
import Testimonials from "@/components/home/testimonials";
import Features from "@/components/home/features";
import React from "react";
import { seoConfig, webpageSchema, localBusinessSchema, structuredDataScript } from "@/lib/seo";



async function Page() {
  return (
    <main>
      {structuredDataScript("webpage", webpageSchema(
        seoConfig.defaultTitle,
        seoConfig.defaultDescription,
        seoConfig.siteUrl,
      ))}
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
