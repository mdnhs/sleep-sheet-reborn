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

export function ProductAccordion({ product }: ProductAccordionProps) {
  const { data: settings } = useSettings();
  const { formatAmount } = useCurrency();

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
        type="multiple" 
        defaultValue={["shipping"]}
        className="w-full border-none space-y-4"
      >
        <AccordionItem value="shipping" className="border border-border rounded-xl px-4 bg-background">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">Shipping & Delivery</AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Inside Dhaka */}
              <div className="flex items-start gap-2.5">
                <div className="bg-secondary/40 p-2 rounded-full mt-0.5 shrink-0">
                  <Truck className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold leading-none">Inside Dhaka</p>
                  <p className="text-xs font-bold text-foreground mt-1">1 Day Delivery</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Shipping Cost: {formatAmount(insideCost)}</p>
                  <p className="text-[10px] text-primary/80 font-medium mt-0.5">Estimated delivery: {tomorrowStr}</p>
                </div>
              </div>

              {/* Outside Dhaka */}
              <div className="flex items-start gap-2.5">
                <div className="bg-secondary/40 p-2 rounded-full mt-0.5 shrink-0">
                  <Package className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold leading-none">Outside Dhaka</p>
                  <p className="text-xs font-bold text-foreground mt-1">3-4 Days Delivery</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Shipping Cost: {formatAmount(outsideCost)}</p>
                  <p className="text-[10px] text-primary/80 font-medium mt-0.5">Estimated delivery: {outsideRangeStr}</p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}
