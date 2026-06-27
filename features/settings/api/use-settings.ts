"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await client.api.settings.$get();
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json() as Promise<Record<string, string>>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      shipping_inside_dhaka?: number;
      shipping_outside_dhaka?: number;
      currency?: string;
      payment_method_card?: "true" | "false";
      payment_method_cod?: "true" | "false";
      payment_method_due?: "true" | "false";
      meta_pixel_enabled?: "true" | "false";
      meta_pixel_default_id?: string;
      meta_pixel_debug?: "true" | "false";
      meta_pixel_mappings?: string;
    }) => {
      const res = await client.api.settings.$patch({ json: data });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save settings");
    },
  });
}
