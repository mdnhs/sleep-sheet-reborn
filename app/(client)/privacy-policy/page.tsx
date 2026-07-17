import type { Metadata } from "next";
import { seoConfig, generateMetadata as buildMetadata, webpageSchema, structuredDataScript } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: `How ${seoConfig.siteName} collects, uses, and protects your personal information.`,
  canonical: "/privacy-policy",
});

const PrivacyPolicyPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      {structuredDataScript(
        "webpage",
        webpageSchema(
          "Privacy Policy",
          "How Sleep Sheet collects, uses, and protects your personal information.",
          `${seoConfig.siteUrl}/privacy-policy`,
        ),
      )}

      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: July 17, 2026</p>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p>
            This Privacy Policy explains what personal information {seoConfig.siteName} collects when
            you visit or shop at {seoConfig.siteUrl.replace(/^https?:\/\//, "")}, how we use it, and
            the choices you have.
          </p>

          <h2>1. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul>
            <li>
              <strong>Account &amp; order information</strong>: name, phone number, email (optional),
              and delivery address, provided when you create an account or place an order.
            </li>
            <li>
              <strong>Order details</strong>: the products, quantities, and prices in your order, your
              chosen delivery zone, and your payment method (currently Cash on Delivery only).
            </li>
            <li>
              <strong>Usage information</strong>: pages you visit, products you view, and actions like
              adding to cart or starting checkout, collected automatically to help us understand site
              usage and improve the shopping experience.
            </li>
          </ul>
          <p>
            We do not currently accept online card payments, so we do not collect or store any card
            number, expiry date, or CVV.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Process and deliver your orders, and contact you about their status.</li>
            <li>Provide customer support and respond to your inquiries.</li>
            <li>Improve our website, products, and delivery service.</li>
            <li>Show you relevant offers and measure the performance of our ads (see Section 3).</li>
          </ul>

          <h2>3. Cookies &amp; Advertising</h2>
          <p>
            We use a small number of cookies and browser storage to run the site and measure
            advertising performance:
          </p>
          <ul>
            <li>
              <strong>Session cookie</strong>: keeps you signed in to your account.
            </li>
            <li>
              <strong>Guest cart / language preference</strong>: stored in your browser (localStorage)
              so your cart and bn/en language choice persist between visits.
            </li>
            <li>
              <strong>Meta (Facebook) Pixel</strong>: if you arrive from a Facebook or Instagram ad, we
              store an attribution cookie (<code>_mp_attr</code>, expires after 30 days) to measure
              which ad led to your visit and, where applicable, your purchase. This is shared with
              Meta Platforms, Inc. in accordance with{" "}
              <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">
                Meta&apos;s Privacy Policy
              </a>
              . You can control ad personalization through your Facebook/Instagram account settings.
            </li>
          </ul>
          <p>
            You can disable cookies in your browser settings, though some parts of the site (like
            staying signed in) may not work correctly without them.
          </p>

          <h2>4. How We Share Your Information</h2>
          <p>
            We do not sell your personal information. We share it only as needed to run our business:
          </p>
          <ul>
            <li>With our delivery/courier partners, to deliver your order to your address.</li>
            <li>
              With Meta Platforms, Inc., for ad attribution and measurement as described in Section 3.
            </li>
            <li>With Cloudinary, our image hosting provider, for product and content images.</li>
            <li>When required by law, or to protect the rights, safety, and property of {seoConfig.siteName} and our customers.</li>
          </ul>

          <h2>5. Data Retention</h2>
          <p>
            We keep your account and order information for as long as your account is active or as
            needed to fulfil orders, resolve disputes, and meet our legal and accounting obligations.
            You can ask us to delete your account data at any time using the contact details below,
            subject to records we&apos;re required to keep for legal or accounting purposes.
          </p>

          <h2>6. Your Rights</h2>
          <p>
            You can access, correct, or request deletion of your personal information at any time by
            contacting us. If you have an account, you can update your name, phone, and address
            directly from your account page.
          </p>

          <h2>7. Security</h2>
          <p>
            We take reasonable technical and organizational measures to protect your personal
            information. No method of transmission or storage is 100% secure, so we cannot guarantee
            absolute security.
          </p>

          <h2>8. Children&apos;s Privacy</h2>
          <p>
            Our services are not directed at children under 13, and we do not knowingly collect
            personal information from them.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes take effect once posted on
            this page.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            Questions about this Privacy Policy or your personal information? Contact us at{" "}
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

export default PrivacyPolicyPage;
