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

      <h2 className="font-heading text-xl lg:text-2xl font-semibold tracking-tight text-foreground mt-10 mb-4">
        {t("seoFaqHeading")}
      </h2>
      <FaqAccordion faqs={faqs} />
    </div>
  );
}
