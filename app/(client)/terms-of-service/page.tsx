import type { Metadata } from "next";
import { seoConfig, generateMetadata as buildMetadata, webpageSchema, structuredDataScript } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description: `Read the terms and conditions for shopping at ${seoConfig.siteName} — orders, payment, delivery, and our replacement guarantee.`,
  canonical: "/terms-of-service",
});

const TermsOfServicePage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      {structuredDataScript(
        "webpage",
        webpageSchema(
          "Terms of Service",
          "Terms and conditions for shopping at Sleep Sheet.",
          `${seoConfig.siteUrl}/terms-of-service`,
        ),
      )}

      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: July 17, 2026</p>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p>
            Welcome to {seoConfig.siteName}. These Terms of Service (&quot;Terms&quot;) govern your
            access to and use of {seoConfig.siteUrl.replace(/^https?:\/\//, "")} (the
            &quot;Site&quot;) and any purchase you make through it. By using the Site or placing an
            order, you agree to these Terms. If you do not agree, please do not use the Site.
          </p>

          <h2>1. Use of the Site</h2>
          <p>
            You must be able to form a legally binding contract to place an order — if you are a
            minor, please have a parent or guardian place the order on your behalf. You agree not to
            use the Site for any unlawful purpose, to interfere with its security or normal
            operation, or to attempt unauthorized access to our systems or other users&apos; accounts.
          </p>

          <h2>2. Products, Pricing &amp; Availability</h2>
          <p>
            All prices are listed in Bangladeshi Taka (৳) and are subject to change without notice.
            We make every effort to display product colors and details accurately, but actual colors
            may vary slightly depending on your screen. Products are subject to availability, and we
            reserve the right to limit quantities or discontinue any product at any time.
          </p>

          <h2>3. Orders &amp; Payment</h2>
          <p>
            We currently accept Cash on Delivery (COD) only — payment is collected in cash at the
            time of delivery. Placing an order is an offer to purchase, which we may accept or
            decline — for example, if a product is out of stock, if we suspect fraud, or if there is
            an error in the price or product information displayed.
          </p>

          <h2>4. Shipping &amp; Delivery</h2>
          <p>
            We currently deliver anywhere in Bangladesh. Estimated delivery times and charges are:
          </p>
          <ul>
            <li>Inside Dhaka: approximately 1 day, ৳80 delivery charge.</li>
            <li>Outside Dhaka: approximately 3–4 days, ৳150 delivery charge.</li>
          </ul>
          <p>
            Delivery timelines are estimates and may vary due to courier delays, weather, or other
            circumstances beyond our control.
          </p>

          <h2>5. Replacement Guarantee</h2>
          <p>
            Every product from {seoConfig.siteName} comes with a 7-day replacement guarantee. If you
            receive a defective or damaged product, contact us within 7 days of delivery and we will
            replace it free of charge. Please retain the product and packaging until the replacement
            is resolved, as we may ask for photos or the item itself to process your claim.
          </p>

          <h2>6. Intellectual Property</h2>
          <p>
            All content on the Site — including text, graphics, logos, and images — is the property
            of {seoConfig.siteName} or its licensors and is protected by applicable intellectual
            property laws. You may not copy, reproduce, or use our content for commercial purposes
            without our prior written consent.
          </p>

          <h2>7. Prohibited Uses</h2>
          <p>
            You agree not to use the Site to transmit malicious code, harass or defraud other users,
            scrape or copy content for competing use, or engage in any activity that disrupts or
            burdens our servers or networks.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, {seoConfig.siteName} is not liable for any
            indirect, incidental, or consequential damages arising from your use of the Site or from
            any product purchased through it, beyond the remedies described in our Replacement
            Guarantee above.
          </p>

          <h2>9. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Changes take effect once posted on this
            page, and your continued use of the Site after changes are posted constitutes acceptance
            of the updated Terms.
          </p>

          <h2>10. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the People&apos;s Republic of Bangladesh, without
            regard to its conflict of law provisions.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            Questions about these Terms? Reach us at{" "}
            <a href={`mailto:${seoConfig.contact.email}`}>{seoConfig.contact.email}</a> or{" "}
            <a href={`tel:${seoConfig.contact.telephone}`}>{seoConfig.contact.telephone}</a>, or write
            to us at {seoConfig.address.streetAddress}, {seoConfig.address.addressLocality},
            Bangladesh.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
