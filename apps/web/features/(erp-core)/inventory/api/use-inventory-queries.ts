import { useQuery, keepPreviousData } from "@tanstack/react-query";

export interface InventorySummary {
  totalSkus: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
  damageLossThisMonth: number;
}

export type StockStatus = "OUT" | "LOW" | "OK";

export interface StockListItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  threshold: number;
  status: StockStatus;
}

export interface MovementItem {
  id: string;
  productId: string;
  productName: string;
  type: string;
  quantity: number;
  reason: string | null;
  reference: string | null;
  note: string | null;
  createdAt: string;
}

export interface ExpiringItem {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string | null;
  quantity: number;
  expiryDate: string | null;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || "Request failed");
  }
  return (await res.json()) as T;
}

export const useInventorySummary = () =>
  useQuery({
    queryKey: ["inventory", "summary"],
    queryFn: () => getJson<InventorySummary>("/api/inventory/summary"),
  });

export const useStockList = (params?: { search?: string; status?: string }) =>
  useQuery({
    queryKey: ["inventory", "stock", params ?? {}],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.status && params.status !== "all") qs.set("status", params.status);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return getJson<{ data: StockListItem[]; total: number }>(`/api/inventory/stock${suffix}`);
    },
    placeholderData: keepPreviousData,
  });

export const useLowStock = () =>
  useQuery({
    queryKey: ["inventory", "low-stock"],
    queryFn: () => getJson<{ data: StockListItem[] }>("/api/inventory/low-stock"),
  });

export const useExpiring = (days = 30) =>
  useQuery({
    queryKey: ["inventory", "expiring", days],
    queryFn: () => getJson<{ data: ExpiringItem[] }>(`/api/inventory/expiring?days=${days}`),
  });

export const useMovements = (params?: { productId?: string; type?: string; page?: number }) =>
  useQuery({
    queryKey: ["inventory", "movements", params ?? {}],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.productId) qs.set("productId", params.productId);
      if (params?.type) qs.set("type", params.type);
      if (params?.page) qs.set("page", String(params.page));
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return getJson<{
        data: MovementItem[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/api/inventory/movements${suffix}`);
    },
    placeholderData: keepPreviousData,
  });
