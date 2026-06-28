import { configureStore } from "@reduxjs/toolkit";
import registerReducer from "@/features/auth/state/register-slice";
import forgotPassowrdReducer from "@/features/auth/state/forgot-password-slice";


export const store = configureStore({
  reducer: {
    register:registerReducer,
    forgotPassword:forgotPassowrdReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
