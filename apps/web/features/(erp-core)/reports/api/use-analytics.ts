import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

type TrendData = { date: string; amount: number };
type SalesOverview = {
  totalRevenue: number;
  totalOrders: number;
  aov: number;
  trendData: TrendData[];
};
type CustomerLifetimeValue = { averageCLV: number };
type GeographicDistribution = { state: string | null; revenue: number; orders: number };
type InventoryTurnover = { turnoverRate: number; totalSales: number; avgInventory: number };
type CartAbandonment = { abandonmentRate: number; totalCarts: number; convertedCarts: number };
type CohortRetention = {
  cohortMonth: string;
  totalUsers: number;
  retainedUsers: number;
  retentionRate: number;
};
type SpendingCluster = { segment: string; customers: number };
type CustomerAcquisition = { date: string; count: number };
type ProductMetric = {
  productId: string;
  productName: string;
  productImages: string[];
};
type MostPurchasedProduct = ProductMetric & { totalSold: number };
type MostWishlistedProduct = ProductMetric & { wishlistCount: number };

export const useSalesOverview = (period = "month") =>
  useQuery<SalesOverview>({
    queryKey: ["sales-overview", period],
    queryFn: async () => {
      const res = await client.api.analytics["sales-overview"].$get({ query: { period } });
      if (!res.ok) throw new Error("Failed to fetch sales overview");
      return res.json() as Promise<SalesOverview>;
    },
  });

export const useCustomerLifetimeValue = () =>
  useQuery<CustomerLifetimeValue>({
    queryKey: ["clv"],
    queryFn: async () => {
      const res = await client.api.analytics["clv"].$get();
      if (!res.ok) throw new Error("Failed to fetch CLV");
      return res.json() as Promise<CustomerLifetimeValue>;
    },
  });

export const useGeographicDistribution = () =>
  useQuery<GeographicDistribution[]>({
    queryKey: ["distribution"],
    queryFn: async () => {
      const res = await client.api.analytics["distribution"].$get();
      if (!res.ok) throw new Error("Failed to fetch distribution data");
      return res.json() as Promise<GeographicDistribution[]>;
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
  useQuery<InventoryTurnover>({
    queryKey: ["inventory-turnover"],
    queryFn: async () => {
      const res = await client.api.analytics["inventory-turnover"].$get();
      if (!res.ok) throw new Error("Failed to fetch inventory turnover");
      return res.json() as Promise<InventoryTurnover>;
    },
  });

export const useCartAbandonment = () =>
  useQuery<CartAbandonment>({
    queryKey: ["abandonment"],
    queryFn: async () => {
      const res = await client.api.analytics["abandonment"].$get();
      if (!res.ok) throw new Error("Failed to fetch cart abandonment rate");
      return res.json() as Promise<CartAbandonment>;
    },
  });

export const useCohortRetention = () =>
  useQuery<CohortRetention[]>({
    queryKey: ["cohort"],
    queryFn: async () => {
      const res = await client.api.analytics["cohort"].$get();
      if (!res.ok) throw new Error("Failed to fetch cohort data");
      return res.json() as Promise<CohortRetention[]>;
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
  useQuery<SpendingCluster[]>({
    queryKey: ["spending-clusters"],
    queryFn: async () => {
      const res = await client.api.analytics["spending-clusters"].$get();
      if (!res.ok) throw new Error("Failed to fetch customer segments");
      return res.json() as Promise<SpendingCluster[]>;
    },
  });

export const useCustomerAcquisition = (period = "month") =>
  useQuery<CustomerAcquisition[]>({
    queryKey: ["acquisition", period],
    queryFn: async () => {
      const res = await client.api.analytics["acquisition"].$get({ query: { period } });
      if (!res.ok) throw new Error("Failed to fetch acquisition data");
      return res.json() as Promise<CustomerAcquisition[]>;
    },
  });

  export const useMostPurchased = () =>
    useQuery<MostPurchasedProduct[]>({
      queryKey: ["most-purchased"],
      queryFn: async () => {
        const res = await client.api.analytics["most-purchased"].$get();
        if (!res.ok) throw new Error("Failed to fetch most purchased products");
        return res.json() as Promise<MostPurchasedProduct[]>;
      },
    });
  
  export const useMostWishlisted = () =>
    useQuery<MostWishlistedProduct[]>({
      queryKey: ["most-wishlisted"],
      queryFn: async () => {
        const res = await client.api.analytics["most-wishlisted"].$get();
        if (!res.ok) throw new Error("Failed to fetch most wishlisted products");
        return res.json() as Promise<MostWishlistedProduct[]>;
      },
    });
