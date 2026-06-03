"use client";

import { cn } from "@/lib/utils";
import { useAppSelector } from "@/stores/hooks";
import { Check } from "lucide-react";
import React from "react";

const Steps = [
  { id: 1, name: "Delivery & Payment", value: "initial" },
  { id: 2, name: "Confirmation", value: "confirmation" },
];

function CheckoutSteps() {
  const currentStep = useAppSelector((state) => state.checkout.currentStep);

  const isOrderPlaced = currentStep === "placedSuccessfully";
  const currentStepIndex = isOrderPlaced
    ? Steps.length
    : Steps.findIndex((step) => step.value === currentStep);

  return (
    <div className="lg:px-60 mt-10">
      <div className="flex items-center justify-center w-full">
        {Steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 flex justify-center items-center rounded-full",
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-accent-foreground text-background"
                      : "bg-accent text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check size={16} />
                  ) : (
                    <label className="text-sm">{step.id}</label>
                  )}
                </div>
                <p
                  className={cn(
                    "text-sm",
                    isCompleted
                      ? "text-green-500"
                      : isActive
                      ? "text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.name}
                </p>
              </div>

              {index < Steps.length - 1 && (
                <div className="relative flex-1 mx-2 sm:w-[150px] md:w-[200px] lg:w-[250px] h-[2px] bg-muted-foreground overflow-hidden">
                  <div
                    className={cn(
                      "absolute top-0 left-0 h-full bg-green-500 transition-all duration-700 ease-in-out",
                      isCompleted ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default CheckoutSteps;
