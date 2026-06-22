import Categories from "@/components/home/categories";
import FeaturedProduct from "@/components/home/featured-product";
import Hero from "@/components/home/hero";
import NarrowBanner from "@/components/home/narrow-banner";
import Newsletter from "@/components/home/newsletter";
import Testimonials from "@/components/home/testimonials";
import Features from "@/components/home/features";
import React from "react";



async function Page() {
  return (
    <main>
      <Hero />

      <Features />

      <Categories />
      <NarrowBanner />
      <FeaturedProduct />
      <Testimonials />
      <Newsletter />
    </main>
  );
}

export default Page;
