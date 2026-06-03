"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

type RequestType = { json: { email: string; password: string } };

export const useLogin = () => {
  const router = useRouter();

  const mutation = useMutation<void, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const { error } = await authClient.signIn.email({
        email: json.email,
        password: json.password,
      });
      if (error) throw new Error(error.message ?? "Login failed");
    },
    onSuccess: () => {
      toast.success("Logged in");
      router.push("/");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to log in");
    },
  });

  return mutation;
};
