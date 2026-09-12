"use client";

import Link from "next/link";
import { useLanguage } from "@/hooks/use-language";
import FaqAccordion from "./faq-accordion";

export default function SeoContentBody() {
  const { t } = useLanguage();

  const faqs = [
    { question: t("faqQ1"), answer: t("faqA1") },
    { question: t("faqQ2"), answer: t("faqA2") },
    { question: t("faqQ3"), answer: t("faqA3") },
    { question: t("faqQ4"), answer: t("faqA4") },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h2
        id="about-products-heading"
        className="font-heading text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-4"
      >
        {t("seoAboutHeading")}
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-3">{t("seoAboutPara1")}</p>
      <p className="text-muted-foreground leading-relaxed mb-4">{t("seoAboutPara2")}</p>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Link href="/categories/comforters" className="underline underline-offset-2 hover:text-foreground text-muted-foreground">
          {t("seoBrowseComforters")}
        </Link>
        <Link href="/categories/bedsheet" className="underline underline-offset-2 hover:text-foreground text-muted-foreground">
          {t("seoBrowseBedSheets")}
        </Link>
      </div>

      <div className="mt-6 pt-6 border-t border-border/40">
        <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-3">
          {t("seoPopularSearches")}
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href="/categories/comforters"
            className="px-3 py-1.5 rounded-full bg-secondary/20 hover:bg-secondary/40 text-foreground border border-border/40 transition-colors"
          >
            কম্ফোর্টার সেট প্রাইজ ইন বাংলাদেশ
          </Link>
          <Link
            href="/categories/bedsheet"
            className="px-3 py-1.5 rounded-full bg-secondary/20 hover:bg-secondary/40 text-foreground border border-border/40 transition-colors"
          >
            বিছানার চাদর অনলাইন শপ
          </Link>
          <Link
            href="/shop?search=king"
            className="px-3 py-1.5 rounded-full bg-secondary/20 hover:bg-secondary/40 text-foreground border border-border/40 transition-colors"
          >
            কিং সাইজ বেডশিট দাম
          </Link>
          <Link
            href="/shop?search=waterproof"
            className="px-3 py-1.5 rounded-full bg-secondary/20 hover:bg-secondary/40 text-foreground border border-border/40 transition-colors"
          >
            ওয়াটারপ্রুফ স্লিপ শিট
          </Link>
          <Link
            href="/shop?search=twill"
            className="px-3 py-1.5 rounded-full bg-secondary/20 hover:bg-secondary/40 text-foreground border border-border/40 transition-colors"
          >
            টুইল কটন বিছানার চাদর
          </Link>
          <Link
            href="/categories/comforters"
            className="px-3 py-1.5 rounded-full bg-secondary/20 hover:bg-secondary/40 text-foreground border border-border/40 transition-colors"
          >
            শীতের কম্ফোর্টার কালেকশন
          </Link>
          <Link
            href="/shop?search=baby"
            className="px-3 py-1.5 rounded-full bg-secondary/20 hover:bg-secondary/40 text-foreground border border-border/40 transition-colors"
          >
            বেবি স্লিপ শিট
          </Link>
          <Link
            href="/shop"
            className="px-3 py-1.5 rounded-full bg-secondary/20 hover:bg-secondary/40 text-foreground border border-border/40 transition-colors"
          >
            ক্যাশ অন ডেলিভারি বেডিং
          </Link>
        </div>
      </div>

      <h2 className="font-heading text-xl lg:text-2xl font-semibold tracking-tight text-foreground mt-10 mb-4">
        {t("seoFaqHeading")}
      </h2>
      <FaqAccordion faqs={faqs} />
    </div>
  );
}
