import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum OTPType {
  LOGIN_OTP = "LOGIN_OTP",
  PASSWORD_RESET = "PASSWORD_RESET",
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
}

interface ForgotPasswordState {
  email: string;
  purpose: OTPType | null;
}

const initialState: ForgotPasswordState = {
  email: "",
  purpose: null,
};

const forgotPasswordSlice = createSlice({
  name: "forgotPassword",
  initialState,
  reducers: {
    setForgotPassword(state, action: PayloadAction<{ email: string; purpose: OTPType }>) {
      state.email = action.payload.email;
      state.purpose = action.payload.purpose;
    },
    resetForgotPassword(state) {
      state.email = "";
      state.purpose = null;
    },
  },
});

export const { setForgotPassword, resetForgotPassword } = forgotPasswordSlice.actions;

export default forgotPasswordSlice.reducer;
