"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Faq {
  question: string;
  answer: string;
}

export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  return (
    <Accordion
      defaultValue={[faqs[0]?.question]}
      className="w-full border-none space-y-4"
    >
      {faqs.map((faq) => (
        <AccordionItem
          key={faq.question}
          value={faq.question}
          className="border border-border/50 rounded-2xl px-5 bg-white dark:bg-slate-900 shadow-sm"
        >
          <AccordionTrigger className="text-base font-medium hover:no-underline py-5">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
