"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ResponseType = {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
};

type RequestType = InferRequestType<typeof client.api.auth.login["$post"]>;

export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.auth.login["$post"]({ json });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          "error" in errorData
            ? errorData.error
            : errorData?.message || "Login failed"
        );
      }

      const result: ResponseType = await response.json();

      if (!result.token) {
        throw new Error("Invalid login response: Missing token");
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Logged in");
      router.refresh();
      queryClient.invalidateQueries({ queryKey: ["current"] });
    },
    onError: (error) => {
      console.error("login error", error);
      toast.error(error.message || "Failed to log in");
    },
  });

  return mutation;
};
