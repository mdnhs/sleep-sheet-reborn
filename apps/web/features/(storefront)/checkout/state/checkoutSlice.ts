import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CheckoutState, PaymentInfo, ShippingInfo, ShippingMethod, Step } from "../types";


const initialState: CheckoutState = {
  currentStep: "initial",
  shippingInfo: null,
  paymentInfo: null,
  shippingMethod: null,
  paymentMethod: "cod",
};

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    setStep(state, action: PayloadAction<Step>) {
      state.currentStep = action.payload;
    },
    setShippingInfo(state, action: PayloadAction<ShippingInfo>) {
      state.shippingInfo = action.payload;
    },
    setPaymentInfo(state, action: PayloadAction<PaymentInfo | null>) {
      state.paymentInfo = action.payload;
    },
    setShippingMethod(state, action: PayloadAction<ShippingMethod>) {
      state.shippingMethod = action.payload;
    },
    setPaymentMethod(state, action: PayloadAction<'card' | 'cod'>) {
      state.paymentMethod = action.payload;
    }
  },
});

export const { 
  setStep, 
  setShippingInfo, 
  setPaymentInfo, 
  setShippingMethod,
  setPaymentMethod 
} = checkoutSlice.actions;
export default checkoutSlice.reducer;