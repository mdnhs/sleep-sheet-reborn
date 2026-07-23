import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api } from "../api-client.js";
import { text } from "../util.js";

interface TrafficEvent {
  type: string;
  path: string;
  label?: string | null;
  meta?: Record<string, string | number | boolean> | null;
  country?: string | null;
  createdAt: string;
}

export function registerTrafficTools(server: McpServer) {
  server.registerTool(
    "get_traffic_summary",
    {
      title: "Get traffic summary",
      description:
        "Visitor traffic breakdown by event type, attribution source (utm_source/campaign, when present), and country over a recent time window (default: last 24 hours). Useful for cross-checking against ad platform numbers.",
      inputSchema: {
        hours: z.number().int().min(1).max(720).optional().describe("Lookback window in hours, default 24"),
      },
    },
    async ({ hours }) => {
      const params = new URLSearchParams({ hours: String(hours ?? 24) });
      const events = await api.get<TrafficEvent[]>(`/traffic?${params.toString()}`);

      const count = (key: string, records: Record<string, number>) => {
        records[key] = (records[key] || 0) + 1;
      };

      const byType: Record<string, number> = {};
      const bySource: Record<string, number> = {};
      const byCountry: Record<string, number> = {};

      for (const e of events) {
        count(e.type, byType);
        count(e.country || "unknown", byCountry);
        const source = e.meta?.utm_source || e.meta?.source || "direct";
        const campaign = e.meta?.utm_campaign || e.meta?.campaign;
        count(campaign ? `${source} / ${campaign}` : String(source), bySource);
      }

      const rank = (records: Record<string, number>) =>
        Object.entries(records)
          .sort((a, b) => b[1] - a[1])
          .map(([key, n]) => ({ key, count: n }));

      return text({
        windowHours: hours ?? 24,
        totalEvents: events.length,
        byEventType: rank(byType),
        bySourceCampaign: rank(bySource),
        byCountry: rank(byCountry),
      });
    }
  );
}
