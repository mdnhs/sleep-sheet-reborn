import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export interface TrafficEvent {
  id: string;
  type: string;
  path: string;
  label: string | null;
  meta: Record<string, string | number | boolean> | null;
  createdAt: string;
}

export function useTrafficEvents(hours?: number) {
  return useQuery({
    queryKey: ["traffic-events", hours],
    queryFn: async () => {
      const query = hours ? { hours: String(hours) } : undefined;
      const res = await client.api.traffic.$get({ query });
      if (!res.ok) throw new Error("Failed to fetch traffic events");
      return res.json() as Promise<TrafficEvent[]>;
    },
    refetchInterval: 5000,
  });
}

export function useTrackEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: {
      type: string;
      path: string;
      label?: string;
      meta?: Record<string, string | number | boolean>;
    }) => {
      const res = await client.api.traffic.$post({ json: event });
      if (!res.ok) throw new Error("Failed to track event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["traffic-events"] });
    },
  });
}

export function useClearTrafficEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await client.api.traffic.$delete();
      if (!res.ok) throw new Error("Failed to clear events");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["traffic-events"] });
    },
  });
}
