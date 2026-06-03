
export type Step = "initial" | "confirmation" | "placedSuccessfully";

export interface ShippingInfo {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  shippingZone: "inside_dhaka" | "outside_dhaka";
}

export interface ShippingMethod {
  id: string;
  name: string;
  duration: string;
  cost: number;
}

export interface PaymentInfo {
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
  nameOnCard?: string;
}

export interface CheckoutState {
  currentStep: Step;
  shippingInfo: ShippingInfo | null;
  paymentInfo: PaymentInfo | null;
  shippingMethod: ShippingMethod | null;
  paymentMethod: 'card' | 'cod' | null;
}
