"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Truck } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import clsx from "clsx";
import { setShipping } from "@/features/cart/state/cart-slice";
import { Button } from "@/components/ui/button";
import { setShippingMethod, setStep } from "../state/checkoutSlice";
import { useGetShippingMethods } from "../api/use-get-shipping-methods";

function ShippingMethod() {
  const shippingInfo = useAppSelector((state) => state.checkout.shippingInfo);
  const selectedMethodFromState = useAppSelector(
    (state) => state.checkout.shippingMethod
  );
  const dispatch = useAppDispatch();

  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(
    selectedMethodFromState?.id ? String(selectedMethodFromState.id) : null
  );

  const { data: shippingMethodsData } = useGetShippingMethods();

  const shippingMethods = React.useMemo(() => {
    return (
      shippingMethodsData?.shippingMethods?.filter((method) => method.active) ||
      []
    );
  }, [shippingMethodsData]);

  useEffect(() => {
    if (shippingMethods.length > 0 && !selectedMethodId) {
      setSelectedMethodId(shippingMethods[0].id);
    }
  }, [shippingMethods, selectedMethodId]);

  const selectedMethod = shippingMethods.find((m) => m.id === selectedMethodId);

  useEffect(() => {
    if (selectedMethod) {
      dispatch(setShipping(selectedMethod.cost));
    }
  }, [selectedMethod, dispatch]);

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);

  if (!hasMounted) return null;

  const handleBack = () => {
    dispatch(setStep("initial"));
  };

  const handleContinuePayment = () => {
    if (selectedMethod) {
      dispatch(
        setShippingMethod({
          id: selectedMethod.id,
          name: selectedMethod.name,
          cost: selectedMethod.cost,
          duration: selectedMethod.duration,
        })
      );
      dispatch(setStep("confirmation"));
    }
  };

  return (
    <div className="p-0 w-full lg:w-[60%]">
      <Card className="bg-transparent border-0 shadow-none w-full">
        <CardHeader className="p-0">
          <CardTitle className="flex flex-row justify-between">
            <p className="text-2xl">Shipping Method</p>
            <p className="text-sm text-muted-foreground cursor-pointer hover:underline">
              Edit Shipping Info
            </p>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-accent rounded-md p-4 flex flex-col">
            <label className="mb-2">Ship to:</label>
            <div className="flex flex-col text-sm text-muted-foreground">
              <label>{shippingInfo?.fullName}</label>
              <label>{shippingInfo?.address}</label>
            </div>
          </div>

          <h1 className="mt-6 mb-2 text-md font-bold">
            Select a Shipping Method:
          </h1>

          <div className="flex flex-col gap-4 mt-4">
            {shippingMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => setSelectedMethodId(method.id)}
                className={clsx(
                  "flex justify-between items-start w-full p-4 border rounded-lg cursor-pointer transition-all",
                  selectedMethodId === method.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-accent"
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    checked={selectedMethodId === method.id}
                    onChange={() => setSelectedMethodId(method.id)}
                    className="mt-1"
                  />
                  <div className="flex flex-col">
                    <h1 className="font-medium">{method.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Truck size={18} />
                      <p className=" mt-1">{method.duration}</p>
                    </div>
                  </div>
                </div>

                <div className="text-sm font-medium">
                  ${method.cost.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <div className="flex flex-row justify-between mt-6">
          <Button variant="ghost" onClick={handleBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Shipping Info
          </Button>
          <Button onClick={handleContinuePayment} disabled={!selectedMethod}>
            Continue to Payment
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default ShippingMethod;
