import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  StockInValues,
  StockOutValues,
  AdjustValues,
  DamageLossValues,
} from "@/features/(erp-core)/inventory/schema";

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data;
}

/** Invalidate every inventory query + the storefront product lists (stock changed). */
function useInvalidateInventory() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };
}

export const useStockIn = () => {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (values: StockInValues) => postJson("/api/inventory/stock-in", values),
    onSuccess: () => {
      toast.success("Stock added");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useStockOut = () => {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (values: StockOutValues) => postJson("/api/inventory/stock-out", values),
    onSuccess: () => {
      toast.success("Stock issued");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useAdjustStock = () => {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (values: AdjustValues) => postJson("/api/inventory/adjust", values),
    onSuccess: () => {
      toast.success("Stock adjusted");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useDamageLoss = () => {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (values: DamageLossValues) => postJson("/api/inventory/damage-loss", values),
    onSuccess: () => {
      toast.success("Write-off recorded");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });
};
