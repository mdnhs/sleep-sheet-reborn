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
    <div className="w-full flex justify-center mb-3 mt-1">
      <div className="flex items-center">
        {Steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-all duration-500",
                  isActive
                    ? "bg-foreground text-background shadow-lg shadow-foreground/10"
                    : isCompleted
                      ? "bg-muted/40 text-foreground border border-border/40"
                      : "text-muted-foreground opacity-70"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold transition-colors duration-500",
                    isActive
                      ? "bg-background text-foreground"
                      : isCompleted
                        ? "bg-foreground text-background"
                        : "bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-2.5 h-2.5" /> : step.id}
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-bold tracking-wide",
                    isActive ? "text-background" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.name}
                </span>
              </div>

              {index < Steps.length - 1 && (
                <div className="w-3 sm:w-6 md:w-10 h-[2px] mx-1.5 md:mx-2 rounded-full bg-border/40 overflow-hidden relative">
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
