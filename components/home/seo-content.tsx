import { faqSchema, structuredDataScript } from "@/lib/seo";
import SeoContentBody from "./seo-content-body";

// Server component: the FAQPage JSON-LD below is emitted in English always,
// regardless of the site's bn/en language toggle. It targets the
// Bangladesh-intent English commercial queries this section was built for
// (see components/home/seo-content-body.tsx for the visible, translated
// copy). Keeping the schema static avoids the rich-result target flipping
// to Bengali on first server render, since useLanguage() defaults to "bn"
// before it reads localStorage client-side.
const faqs = [
  {
    question: "What is included in the Sleep Sheet 5-piece comforter set?",
    answer:
      "Each 5-piece comforter set includes 1 comforter, 1 bed sheet, 2 pillow covers, and 1 kolbalish (bolster) cover, made from premium twill cotton fabric.",
  },
  {
    question: "Do you offer cash on delivery in Bangladesh?",
    answer:
      "Yes. You can order any comforter or bed sheet with zero advance payment and pay in cash when the product is delivered to your home, anywhere in Bangladesh.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Delivery inside Dhaka takes 1 day (৳80 delivery charge). Outside Dhaka, delivery takes 3-4 days (৳150 delivery charge).",
  },
  {
    question: "Is there a replacement guarantee?",
    answer:
      "Yes, every Sleep Sheet product comes with a 7-day replacement guarantee. If there is any defect, we will replace the product free of charge.",
  },
];

export default function SeoContent() {
  return (
    <section
      aria-labelledby="about-products-heading"
      className="container mx-auto px-4 py-12"
    >
      {structuredDataScript("faq", faqSchema(faqs))}
      <SeoContentBody />
    </section>
  );
}
