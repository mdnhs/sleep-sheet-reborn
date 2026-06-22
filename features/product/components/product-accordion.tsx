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

import React, { useState } from "react";

export function ProductAccordion({ product }: ProductAccordionProps) {
  return (
    <div className="w-full space-y-4">
      <Accordion 
        type="multiple" 
        defaultValue={["shipping"]}
        className="w-full border-none space-y-4"
      >
        <AccordionItem value="shipping" className="border border-border rounded-xl px-4 bg-background">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">Shipping</AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="bg-secondary/40 p-1.5 rounded-full">
                  <Tag className="h-3.5 w-3.5 text-foreground" />
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider leading-none">Discount</p>
                  <p className="text-xs font-semibold text-foreground leading-tight mt-0.5">Free shipping</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="bg-secondary/40 p-1.5 rounded-full">
                  <Package className="h-3.5 w-3.5 text-foreground" />
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider leading-none">Package</p>
                  <p className="text-xs font-semibold text-foreground leading-tight mt-0.5">Regular</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-secondary/40 p-1.5 rounded-full">
                  <Truck className="h-3.5 w-3.5 text-foreground" />
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider leading-none">Delivery</p>
                  <p className="text-xs font-semibold text-foreground leading-tight mt-0.5">3-4 Days</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-secondary/40 p-1.5 rounded-full">
                  <CalendarClock className="h-3.5 w-3.5 text-foreground" />
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider leading-none">Estimation</p>
                  <p className="text-xs font-semibold text-foreground leading-tight mt-0.5">10-12 Oct</p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="description" className="border border-border rounded-xl px-4 bg-background">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">Description & Fit</AccordionTrigger>
        <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
          {product.description}
          {product.features && product.features.length > 0 && (
            <ul className="list-disc pl-4 mt-2 space-y-1">
              {product.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    </div>
  );
}
