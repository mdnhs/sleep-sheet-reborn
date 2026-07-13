"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";
import { InferRequestType } from "hono";

type BookRequestType = InferRequestType<
  typeof client.api.steadfast.book["$post"]
>;

export interface SteadfastTrackingStatus {
  delivery_status: string;
  consignment_id?: number;
  tracking_code?: string;
}

export function useSteadfastTrackingStatuses(orderIds: string[]) {
  return useQuery({
    queryKey: ["steadfast-tracking", ...orderIds.sort()],
    queryFn: async () => {
      if (orderIds.length === 0) return {} as Record<string, SteadfastTrackingStatus>;
      const res = await client.api.steadfast["track-batch"]["$post"]({
        json: { orderIds },
      });
      if (!res.ok) throw new Error("Failed to fetch tracking statuses");
      const data = await res.json();
      return data.statuses as Record<string, SteadfastTrackingStatus>;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    enabled: orderIds.length > 0,
  });
}

export function useTrackSingleOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await client.api.steadfast.track[":orderId"]["$get"]({
        param: { orderId },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error("error" in err ? (err as { error: string }).error : "Tracking failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steadfast-tracking"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to fetch tracking status");
    },
  });
}

export function useSteadfastBalance(enabled = true) {
  return useQuery({
    queryKey: ["steadfast-balance"],
    queryFn: async () => {
      const res = await client.api.steadfast.balance["$get"]();
      if (!res.ok) throw new Error("Failed to fetch balance");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useBookCourier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (json: BookRequestType["json"]) => {
      const res = await client.api.steadfast.book["$post"]({ json });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          "error" in err ? (err as { error: string }).error : "Booking failed"
        );
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Courier booked successfully");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["steadfast-balance"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to book courier");
    },
  });
}

export function useSyncOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await client.api.steadfast.sync[":orderId"]["$post"]({
        param: { orderId },
      });
      const data = await res.json();
      if (!res.ok) throw new Error("error" in data ? (data as { error: string }).error : "Sync failed");
      return data;
    },
    onSuccess: (data) => {
      const d = data as { updated: boolean; delivery_status: string };
      if (d.updated) {
        toast.success(`Status synced: ${d.delivery_status}`);
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      } else {
        toast.info(`Already up to date: ${d.delivery_status}`);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to sync status");
    },
  });
}
