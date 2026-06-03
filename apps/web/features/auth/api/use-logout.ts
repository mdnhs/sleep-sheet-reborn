"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error>({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => {
      toast.success("Logged out");
      queryClient.invalidateQueries({ queryKey: ["current"] });
      router.push("/signin");
      router.refresh();
    },
    onError: () => {
      toast.error("Failed to log out");
    },
  });

  return mutation;
};
