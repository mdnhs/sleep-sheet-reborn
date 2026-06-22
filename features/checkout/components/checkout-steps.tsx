"use client";

import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { Check, Truck, ClipboardCheck } from "lucide-react";
import React from "react";

const Steps = [
  { id: 1, name: "Delivery & Payment", value: "initial", icon: Truck },
  { id: 2, name: "Review", value: "confirmation", icon: ClipboardCheck },
];

function CheckoutSteps() {
  const currentStep = useAppSelector((state) => state.checkout.currentStep);

  const isOrderPlaced = currentStep === "placedSuccessfully";
  const currentStepIndex = isOrderPlaced
    ? Steps.length
    : Math.max(0, Steps.findIndex((step) => step.value === currentStep));

  return (
    <div className="w-full flex justify-center mb-6 md:mb-10 mt-2 md:mt-4">
      <div className="flex items-center">
        {Steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-2 md:gap-3 px-2 md:px-2.5 py-2 md:py-2.5 rounded-full transition-all duration-500",
                  isActive
                    ? "bg-foreground text-background shadow-xl shadow-foreground/10 scale-105"
                    : isCompleted
                      ? "bg-muted/40 text-foreground border border-border/40"
                      : "text-muted-foreground opacity-70"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full text-[10px] md:text-xs font-bold transition-colors duration-500",
                    isActive
                      ? "bg-background text-foreground"
                      : isCompleted
                        ? "bg-foreground text-background"
                        : "bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-3 h-3 md:w-4 md:h-4" /> : step.id}
                </div>
                <span
                  className={cn(
                    "text-xs md:text-sm font-bold tracking-wide",
                    isActive ? "text-background" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.name}
                </span>
              </div>

              {/* Connector line between steps */}
              {index < Steps.length - 1 && (
                <div className="w-4 sm:w-8 md:w-16 h-[2px] mx-2 md:mx-3 rounded-full bg-border/40 overflow-hidden relative">
                  <div
                    className={cn(
                      "absolute top-0 left-0 h-full bg-foreground transition-all duration-700 ease-out",
                      isCompleted ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CheckoutSteps;
