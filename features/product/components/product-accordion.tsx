"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Product } from "@/lib/types";
import { Package, Truck, Tag, CalendarClock } from "lucide-react";

interface ProductAccordionProps {
  product: Product;
}

import { useSettings } from "@/features/settings/api/use-settings";
import React from "react";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/hooks/use-language";

export function ProductAccordion({ product }: ProductAccordionProps) {
  const { data: settings } = useSettings();
  const { formatAmount } = useCurrency();
  const { t } = useLanguage();

  const insideCost = Number(settings?.shipping_inside_dhaka ?? 60);
  const outsideCost = Number(settings?.shipping_outside_dhaka ?? 120);

  // Calculate automatic delivery dates
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date();

  // Inside Dhaka: 1 day (tomorrow)
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = `${tomorrow.getDate()} ${months[tomorrow.getMonth()]}`;

  // Outside Dhaka: 3-4 days
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 3);
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 4);
  const outsideRangeStr = `${minDate.getDate()} ${months[minDate.getMonth()]} - ${maxDate.getDate()} ${months[maxDate.getMonth()]}`;

  return (
    <div className="w-full space-y-4">
      <Accordion 
        defaultValue={["shipping"]}
        className="w-full border-none space-y-4"
      >
        <AccordionItem value="shipping" className="border border-border/50 rounded-2xl px-5 bg-white dark:bg-slate-900 shadow-sm">
          <AccordionTrigger className="text-base font-bold hover:no-underline py-5">{t("shippingAndDelivery")}</AccordionTrigger>
          <AccordionContent className="pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Inside Dhaka */}
              <div className="flex flex-col p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/10 text-primary p-2.5 rounded-xl shrink-0">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">{t("insideDhaka")}</p>
                    <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-tight mt-0.5">{t("oneDayDelivery")}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{t("shippingCost")}</span>
                  <span className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{formatAmount(insideCost)}</span>
                </div>
                
                <div className="mt-3 bg-primary/10 text-primary text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5">
                  <CalendarClock className="h-4 w-4" />
                  {t("estDelivery")}: {tomorrowStr}
                </div>
              </div>

              {/* Outside Dhaka */}
              <div className="flex flex-col p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-orange-500/50 transition-all duration-300 hover:shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-orange-500/10 text-orange-600 dark:text-orange-400 p-2.5 rounded-xl shrink-0">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">{t("outsideDhaka")}</p>
                    <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-tight mt-0.5">{t("threeToFourDaysDelivery")}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{t("shippingCost")}</span>
                  <span className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{formatAmount(outsideCost)}</span>
                </div>
                
                <div className="mt-3 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5">
                  <CalendarClock className="h-4 w-4" />
                  {t("estDelivery")}: {outsideRangeStr}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}
