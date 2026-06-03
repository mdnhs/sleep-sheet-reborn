"use client";

import { client } from "@/lib/rpc";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface GenerateOtpData {
  email: string;
  type: "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "LOGIN_OTP";
}

interface VerifyOtpData {
  email: string;
  otpCode: string;
}



export const useGenerateOtp = () => {
  return useMutation({
    mutationFn: async ({ email, type }: GenerateOtpData) => {
      const response = await client.api.auth.otp["generate"].$post({
        json: {
          email,
          type,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as any)?.error || (data as any)?.message || "Failed to send OTP");
      }

      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message || "An error occurred");
    },
  });
};



export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: async ({ email, otpCode }: VerifyOtpData) => {
      const response = await client.api.auth.otp["verify"].$post({
        json: {
          email,
          otpCode, 
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "OTP verification failed");
      }

      return response.json();
    },
    onError: (error: Error) => {
      toast.error(error.message || "OTP verification failed");
    },
  });
};