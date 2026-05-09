import { client } from "@/lib/rpc";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface ForgotPasswordData {
  email: string;
  newPassword: string;
  otpCode: string;
}
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async ({ email, newPassword, otpCode }: ForgotPasswordData) => {
      const response = await client.api.auth["reset-password"].$post({
        json: { email, newPassword, otpCode },
      });

      if (!response.ok) {
  
        throw new Error("Failed to reset password");
      }

      return response.json();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reset password");
    },
  });
};