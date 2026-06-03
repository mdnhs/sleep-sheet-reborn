import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "@/features/(storefront)/cart/state/cart-slice";
import registerReducer from "@/features/auth/state/register-slice";
import checkoutReducer from "@/features/(storefront)/checkout/state/checkoutSlice";
import forgotPassowrdReducer from "@/features/auth/state/forgot-password-slice";


export const store = configureStore({
  reducer: {
    cart:cartReducer,
    checkout:checkoutReducer,
    register:registerReducer,
    forgotPassword:forgotPassowrdReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
