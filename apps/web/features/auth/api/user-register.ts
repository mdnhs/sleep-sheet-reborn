"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

type RequestType = { json: { name: string; email: string; password: string } };

export const useRegister = () => {
  const router = useRouter();

  const mutation = useMutation<void, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const { error } = await authClient.signUp.email({
        name: json.name,
        email: json.email,
        password: json.password,
      });
      if (error) throw new Error(error.message ?? "Registration failed");
    },
    onSuccess: () => {
      toast.success("Registered successfully");
      router.push("/signin");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to register");
    },
  });

  return mutation;
};
