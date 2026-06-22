import { CreditCard, Tag, ShieldCheck, Truck } from "lucide-react";
import React from "react";

const features = [
  {
    title: "Payment only online",
    description: "Secure & simple checkout",
    icon: CreditCard,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  {
    title: "New stocks and sales",
    description: "Daily updates & offers",
    icon: Tag,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    title: "Quality assurance",
    description: "100% genuine products",
    icon: ShieldCheck,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    title: "Delivery from 1 hour",
    description: "Fast & reliable shipping",
    icon: Truck,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

const Features = () => {
  return (
    <section className="py-4 bg-white border-b border-slate-100">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="grid grid-cols-4 gap-2 md:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-2 md:gap-3">
                <div
                  className={`flex-shrink-0 h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center ${feature.bgColor} ${feature.color}`}
                >
                  <Icon className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div className="flex flex-col gap-0.5 mt-1 items-center md:items-start w-full px-0.5">
                  <h3 className="font-semibold text-slate-900 text-[11px] sm:text-xs md:text-sm tracking-tight leading-tight w-full break-words line-clamp-3 text-center md:text-left">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-tight hidden md:block">
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
