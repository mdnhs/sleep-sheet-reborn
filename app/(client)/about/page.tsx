import { Separator } from "@/components/ui/separator";
import { generateMetadata as buildMetadata, seoConfig } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "About Us",
  description:
    "Sleep Sheet is Bangladesh's online destination for premium comforter sets, bed sheets, and pillow covers — 100% twill cotton fabric with cash on delivery nationwide.",
  canonical: `${seoConfig.siteUrl}/about`,
});

const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">About Sleep Sheet</h1>

        <div className="prose prose-lg dark:prose-invert">
          <p className="text-xl text-muted-foreground mb-8">
            Premium quality bedding, made for comfortable sleep. We believe
            everyone deserves a good night&apos;s rest without paying showroom
            prices.
          </p>

          <h2 className="text-2xl font-semibold mt-12 mb-6">Our Story</h2>
          <p className="mb-6">
            Sleep Sheet started in Dhaka with a simple goal: bring
            high-quality comforter sets, bed sheets, and pillow covers to
            homes across Bangladesh at a fair price, with the convenience of
            online ordering and cash on delivery.
          </p>

          <p className="mb-12">
            Every piece we sell is made from 100% twill cotton fabric,
            chosen for its softness and durability. From our shop at Hope
            Market, Mirpur 10, Dhaka, we now deliver nationwide, and our
            customers&apos; comfort is what drives everything we do.
          </p>

          <Separator className="my-8" />

          <h2 className="text-2xl font-semibold mt-12 mb-6">Our Values</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-xl font-medium mb-3">Quality Fabric</h3>
              <p>
                We use 100% twill cotton in every comforter set and bed
                sheet, so what you see online is what you feel at home.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Fair Pricing</h3>
              <p>
                Premium bedding shouldn&apos;t come with a premium markup.
                We keep our prices honest and competitive across Bangladesh.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Reliable Delivery</h3>
              <p>
                Cash on delivery, home delivery all over Bangladesh — we make
                ordering bedding online simple and worry-free.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Customer Care</h3>
              <p>
                Questions about sizing, fabric, or your order? Reach us
                anytime at {seoConfig.contact.telephone} or{" "}
                {seoConfig.contact.email}.
              </p>
            </div>
          </div>

          <Separator className="my-8" />

          <h2 className="text-2xl font-semibold mt-12 mb-6">Visit Us</h2>
          <p>
            Our shop is located at Hope Market, Mirpur 10, Dhaka 1216. Browse
            our full collection online, or drop by in person to feel the
            fabric for yourself.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
