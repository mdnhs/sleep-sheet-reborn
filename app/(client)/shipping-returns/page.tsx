import type { Metadata } from "next";
import { seoConfig, generateMetadata as buildMetadata, webpageSchema, structuredDataScript } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Shipping & Returns",
  description: `Delivery times, delivery charges, and our 7-day replacement guarantee at ${seoConfig.siteName}.`,
  canonical: "/shipping-returns",
});

const ShippingReturnsPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      {structuredDataScript(
        "webpage",
        webpageSchema(
          "Shipping & Returns",
          "Delivery times, delivery charges, and our replacement guarantee.",
          `${seoConfig.siteUrl}/shipping-returns`,
        ),
      )}

      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Shipping &amp; Returns</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: July 17, 2026</p>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>Delivery Areas &amp; Times</h2>
          <p>We deliver anywhere in Bangladesh. Estimated delivery times and charges are:</p>
          <ul>
            <li><strong>Inside Dhaka</strong>: approximately 1 day, ৳80 delivery charge.</li>
            <li><strong>Outside Dhaka</strong>: approximately 3–4 days, ৳150 delivery charge.</li>
          </ul>
          <p>
            These are estimates, not guarantees — actual delivery time can vary due to courier
            delays, weather, or your exact location.
          </p>

          <h2>Payment on Delivery</h2>
          <p>
            We currently accept Cash on Delivery (COD) only: you pay in cash when the courier hands
            over your order. There is no advance payment required to place an order.
          </p>

          <h2>Checking Your Order on Delivery</h2>
          <p>
            Please inspect your package as soon as it arrives. If the packaging looks damaged or the
            contents don&apos;t match what you ordered, contact us right away so we can resolve it
            quickly.
          </p>

          <h2>7-Day Replacement Guarantee</h2>
          <p>
            Every product from {seoConfig.siteName} comes with a 7-day replacement guarantee. If your
            product is defective, damaged, or not what you ordered, contact us within 7 days of
            delivery and we will replace it free of charge.
          </p>
          <p>To request a replacement:</p>
          <ol>
            <li>
              Contact us at{" "}
              <a href={`mailto:${seoConfig.contact.email}`}>{seoConfig.contact.email}</a> or{" "}
              <a href={`tel:${seoConfig.contact.telephone}`}>{seoConfig.contact.telephone}</a> within
              7 days of delivery, with your order number and a photo of the issue.
            </li>
            <li>Keep the product and its original packaging until your claim is resolved.</li>
            <li>
              Once approved, we&apos;ll arrange for the replacement to be shipped to you at no extra
              cost.
            </li>
          </ol>
          <p>
            This guarantee covers defective, damaged, or incorrect items. It does not cover damage
            caused by misuse after delivery, or a simple change of mind.
          </p>

          <h2>Questions?</h2>
          <p>
            Reach us at{" "}
            <a href={`mailto:${seoConfig.contact.email}`}>{seoConfig.contact.email}</a> or{" "}
            <a href={`tel:${seoConfig.contact.telephone}`}>{seoConfig.contact.telephone}</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShippingReturnsPage;
