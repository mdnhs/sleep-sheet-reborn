import Categories from "@/components/home/categories";
import FeaturedProduct from "@/components/home/featured-product";
import Hero from "@/components/home/hero";
import Newsletter from "@/components/home/newsletter";
import Testimonials from "@/components/home/testimonials";
import { Leaf, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import React from "react";

const trustItems = [
  { icon: Truck, text: "Free Shipping Over $50" },
  { icon: Leaf, text: "100% Organic Cotton" },
  { icon: RotateCcw, text: "30-Day Free Returns" },
  { icon: ShieldCheck, text: "Quality Guaranteed" },
];

async function Page() {
  return (
    <main>
      <Hero />

      {/* Trust strip */}
      <section className="border-y border-border bg-secondary/30 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {trustItems.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Categories />
      <FeaturedProduct />
      <Testimonials />
      <Newsletter />
    </main>
  );
}

export default Page;
