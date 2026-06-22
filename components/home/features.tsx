import { CreditCard, Tag, ShieldCheck, Truck } from "lucide-react";
import React from "react";

const features = [
  {
    title: "Payment only online",
    description: "Tasigförsamhet beteendedesign. Mobile checkout. Ylig kärrtorpa.",
    icon: CreditCard,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  {
    title: "New stocks and sales",
    description: "Tasigförsamhet beteendedesign. Mobile checkout. Ylig kärrtorpa.",
    icon: Tag,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    title: "Quality assurance",
    description: "Tasigförsamhet beteendedesign. Mobile checkout. Ylig kärrtorpa.",
    icon: ShieldCheck,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    title: "Delivery from 1 hour",
    description: "Tasigförsamhet beteendedesign. Mobile checkout. Ylig kärrtorpa.",
    icon: Truck,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

const Features = () => {
  return (
    <section className="py-6 bg-white border-b border-slate-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center ${feature.bgColor} ${feature.color}`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-slate-900 text-[15px]">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
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
