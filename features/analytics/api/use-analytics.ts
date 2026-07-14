import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export interface DateRangeFilter {
  from: string;
  to: string;
}

export const useSalesOverview = (period = "month", range?: DateRangeFilter) =>
  useQuery({
    queryKey: ["sales-overview", period, range],
    queryFn: async () => {
      const res = await client.api.analytics["sales-overview"].$get({
        query: range ? { period, from: range.from, to: range.to } : { period },
      });
      if (!res.ok) throw new Error("Failed to fetch sales overview");
      return res.json();
    },
  });

export const useCustomerLifetimeValue = () =>
  useQuery({
    queryKey: ["clv"],
    queryFn: async () => {
      const res = await client.api.analytics["clv"].$get();
      if (!res.ok) throw new Error("Failed to fetch CLV");
      return res.json();
    },
  });

export const useGeographicDistribution = () =>
  useQuery({
    queryKey: ["distribution"],
    queryFn: async () => {
      const res = await client.api.analytics["distribution"].$get();
      if (!res.ok) throw new Error("Failed to fetch distribution data");
      return res.json();
    },
  });

// export const useCategoryBreakdown = () =>
//   useQuery({
//     queryKey: ["categories"],
//     queryFn: async () => {
//       const res = await client.api.analytics["categories"].$get();
//       if (!res.ok) throw new Error("Failed to fetch categories");
//       return res.json();
//     },
//   });

export const useInventoryTurnover = () =>
  useQuery({
    queryKey: ["inventory-turnover"],
    queryFn: async () => {
      const res = await client.api.analytics["inventory-turnover"].$get();
      if (!res.ok) throw new Error("Failed to fetch inventory turnover");
      return res.json();
    },
  });

export const useCartAbandonment = () =>
  useQuery({
    queryKey: ["abandonment"],
    queryFn: async () => {
      const res = await client.api.analytics["abandonment"].$get();
      if (!res.ok) throw new Error("Failed to fetch cart abandonment rate");
      return res.json();
    },
  });

export const useCohortRetention = () =>
  useQuery({
    queryKey: ["cohort"],
    queryFn: async () => {
      const res = await client.api.analytics["cohort"].$get();
      if (!res.ok) throw new Error("Failed to fetch cohort data");
      return res.json();
    },
  });

// export const useDeliveryTimes = () =>
//   useQuery({
//     queryKey: ["delivery-times"],
//     queryFn: async () => {
//       const res = await client.api.analytics["delivery-times"].$get();
//       if (!res.ok) throw new Error("Failed to fetch delivery times");
//       return res.json();
//     },
//   });

export const useSpendingClusters = () =>
  useQuery({
    queryKey: ["spending-clusters"],
    queryFn: async () => {
      const res = await client.api.analytics["spending-clusters"].$get();
      if (!res.ok) throw new Error("Failed to fetch customer segments");
      return res.json();
    },
  });

export const useCustomerAcquisition = (period = "month", range?: DateRangeFilter) =>
  useQuery({
    queryKey: ["acquisition", period, range],
    queryFn: async () => {
      const res = await client.api.analytics["acquisition"].$get({
        query: range ? { period, from: range.from, to: range.to } : { period },
      });
      if (!res.ok) throw new Error("Failed to fetch acquisition data");
      return res.json();
    },
  });

  export const useMostPurchased = () =>
    useQuery({
      queryKey: ["most-purchased"],
      queryFn: async () => {
        const res = await client.api.analytics["most-purchased"].$get();
        if (!res.ok) throw new Error("Failed to fetch most purchased products");
        return res.json();
      },
    });
  
  export const useMostWishlisted = () =>
    useQuery({
      queryKey: ["most-wishlisted"],
      queryFn: async () => {
        const res = await client.api.analytics["most-wishlisted"].$get();
        if (!res.ok) throw new Error("Failed to fetch most wishlisted products");
        return res.json();
      },
    });

export const useRecentOrders = () =>
  useQuery({
    queryKey: ["recent-orders"],
    queryFn: async () => {
      const res = await client.api.analytics["recent-orders"].$get();
      if (!res.ok) throw new Error("Failed to fetch recent orders");
      return res.json();
    },
  });

export const useLowStock = () =>
  useQuery({
    queryKey: ["low-stock"],
    queryFn: async () => {
      const res = await client.api.analytics["low-stock"].$get();
      if (!res.ok) throw new Error("Failed to fetch low stock alerts");
      return res.json();
    },
  });
