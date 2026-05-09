/* eslint-disable @next/next/no-img-element */

import { Separator } from "@/components/ui/separator";

const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">About LUXESTORE</h1>

        <div className="prose prose-lg dark:prose-invert">
          <p className="text-xl text-muted-foreground mb-8">
            Premium quality, ethically made products for the modern lifestyle.
            We believe in creating timeless pieces that last.
          </p>

          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Our store"
            className="w-full h-80 object-cover rounded-lg mb-12"
          />

          <h2 className="text-2xl font-semibold mt-12 mb-6">Our Story</h2>
          <p className="mb-6">
            Founded in 2018, LUXESTORE began with a simple mission: to create
            exceptional products that combine functionality, sustainability, and
            timeless design. What started as a small studio in San Francisco has
            grown into a globally recognized brand with customers in over 30
            countries.
          </p>

          <p className="mb-12">
            Our founder, Emma Chen, noticed a gap in the market for
            high-quality, ethically produced goods that didn&apos;t compromise
            on design. By focusing on exceptional materials, skilled
            craftsmanship, and transparent business practices, LUXESTORE quickly
            developed a loyal following.
          </p>

          <Separator className="my-8" />

          <h2 className="text-2xl font-semibold mt-12 mb-6">Our Values</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-xl font-medium mb-3">Sustainability</h3>
              <p>
                We&apos;re committed to minimizing our environmental impact.
                From sourcing sustainable materials to reducing waste in our
                production process, we&apos;re constantly working to improve our
                practices.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Quality</h3>
              <p>
                We believe in creating products that stand the test of time.
                Each item is carefully designed and rigorously tested to ensure
                it meets our high standards.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Transparency</h3>
              <p>
                We&apos;re open about how our products are made and who makes
                them. We work closely with our manufacturing partners to ensure
                fair labor practices.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Innovation</h3>
              <p>
                While we honor traditional craftsmanship, we&apos;re always
                looking for innovative solutions to improve our products and
                reduce our environmental footprint.
              </p>
            </div>
          </div>

          <Separator className="my-8" />

          <h2 className="text-2xl font-semibold mt-12 mb-6">Our Team</h2>
          <p className="mb-6">
            Our diverse team brings together expertise from design, engineering,
            sustainability, and retail. United by a passion for creating
            beautiful, functional, and responsible products, we&apos;re
            dedicated to pushing the boundaries of what&apos;s possible.
          </p>

          <p>
            LUXESTORE is now a team of 35 passionate individuals working across
            design, production, customer service, and operations. While
            we&apos;ve grown, our core values remain the same: quality,
            sustainability, and exceptional design.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
