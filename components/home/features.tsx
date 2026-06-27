"use client";

import { CreditCard, Tag, ShieldCheck, Truck } from "lucide-react";
import React from "react";
import { useWebsiteSettings } from "@/hooks/use-website-settings";

const ICONS = [CreditCard, Tag, ShieldCheck, Truck];
const COLORS = [
  { color: "text-yellow-600", bgColor: "bg-yellow-100" },
  { color: "text-purple-600", bgColor: "bg-purple-100" },
  { color: "text-green-600", bgColor: "bg-green-100" },
  { color: "text-primary", bgColor: "bg-primary/10" },
];

const Features = () => {
  const { features } = useWebsiteSettings();

  return (
    <section className="py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="grid grid-cols-4 gap-2 md:gap-6">
          {features.map((feature, index) => {
            const Icon = ICONS[index];
            const { color, bgColor } = COLORS[index];
            return (
              <div key={index} className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-2 md:gap-3">
                <div
                  className={`flex-shrink-0 h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center ${bgColor} ${color}`}
                >
                  <Icon className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div className="flex flex-col gap-0.5 mt-1 items-center md:items-start w-full px-0.5">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-[11px] sm:text-xs md:text-sm tracking-tight leading-tight w-full break-words line-clamp-3 text-center md:text-left">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight hidden md:block">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
