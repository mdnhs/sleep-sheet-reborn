"use client";

import { useState } from "react";
import {
  useTrafficEvents,
  useClearTrafficEvents,
  type TrafficEvent,
} from "@/features/traffic/api/use-traffic";
import { getEventStats } from "@/lib/traffic-tracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomBarChart } from "@/components/ui/charts";
import {
  IconActivity,
  IconEye,
  IconShoppingCart,
  IconBolt,
  IconHeart,
  IconClock,
  IconTrash,
  IconRefresh,
} from "@tabler/icons-react";
import { format } from "date-fns";

const EVENT_LABELS: Record<string, string> = {
  page_view: "Page View",
  product_view: "Product View",
  add_to_cart: "Add to Cart",
  buy_now: "Buy Now",
  search: "Search",
  wishlist_add: "Wishlist",
  checkout_start: "Checkout",
  order_complete: "Order Complete",
};

const EVENT_COLORS: Record<string, string> = {
  page_view: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  product_view:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  add_to_cart:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  buy_now:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  search:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  wishlist_add:
    "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  checkout_start:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  order_complete:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  page_view: <IconEye className="h-3.5 w-3.5" />,
  product_view: <IconEye className="h-3.5 w-3.5" />,
  add_to_cart: <IconShoppingCart className="h-3.5 w-3.5" />,
  buy_now: <IconBolt className="h-3.5 w-3.5" />,
  search: <IconEye className="h-3.5 w-3.5" />,
  wishlist_add: <IconHeart className="h-3.5 w-3.5" />,
  checkout_start: <IconBolt className="h-3.5 w-3.5" />,
  order_complete: <IconBolt className="h-3.5 w-3.5" />,
};

type TimeFilter = "1h" | "6h" | "24h" | "7d" | "all";

const TIME_FILTER_HOURS: Record<Exclude<TimeFilter, "all">, number> = {
  "1h": 1,
  "6h": 6,
  "24h": 24,
  "7d": 168,
};

export default function AnalysisClientPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24h");
  const hours = timeFilter === "all" ? undefined : TIME_FILTER_HOURS[timeFilter];

  const { data: events, isLoading, refetch } = useTrafficEvents(hours);
  const clearEvents = useClearTrafficEvents();

  const allEvents = events ?? [];
  const stats = getEventStats(allEvents);

  const pageViews = stats.byType["page_view"] || 0;
  const productViews = stats.byType["product_view"] || 0;
  const addToCarts = stats.byType["add_to_cart"] || 0;
  const buyNows = stats.byType["buy_now"] || 0;
  const orders = stats.byType["order_complete"] || 0;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Traffic activity, page visits, and real-time user interactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border bg-slate-50 dark:bg-muted/40">
            <IconActivity className="h-3.5 w-3.5" />
            {allEvents.length} events
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border-none"
          >
            <IconRefresh className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearEvents.mutate()}
            disabled={clearEvents.isPending}
            className="rounded-full text-xs font-semibold text-destructive hover:bg-destructive/10"
          >
            <IconTrash className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["1h", "6h", "24h", "7d", "all"] as TimeFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setTimeFilter(f)}
            className={cn(
              "rounded-full text-xs font-semibold px-4 h-8 transition-colors cursor-pointer",
              timeFilter === f
                ? "bg-slate-900 text-white hover:bg-slate-800 hover:text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:hover:text-slate-900"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            )}
          >
            {f === "all" ? "All Time" : f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Page Views"
          value={pageViews}
          icon={<IconEye className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          badgeBg="bg-blue-50 dark:bg-blue-950/40"
          loading={isLoading}
        />
        <StatCard
          title="Product Views"
          value={productViews}
          icon={<IconEye className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          badgeBg="bg-purple-50 dark:bg-purple-950/40"
          loading={isLoading}
        />
        <StatCard
          title="Add to Cart"
          value={addToCarts}
          icon={<IconShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />}
          badgeBg="bg-green-50 dark:bg-green-950/40"
          loading={isLoading}
        />
        <StatCard
          title="Buy Now"
          value={buyNows}
          icon={<IconBolt className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
          badgeBg="bg-orange-50 dark:bg-orange-950/40"
          loading={isLoading}
        />
        <StatCard
          title="Orders"
          value={orders}
          icon={<IconActivity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          badgeBg="bg-emerald-50 dark:bg-emerald-950/40"
          loading={isLoading}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
          <h2 className="text-base font-bold tracking-tight">Events by Hour</h2>
          <div className="h-64">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-2xl" />
            ) : stats.hourlyData.every((d) => d.value === 0) ? (
              <EmptyState />
            ) : (
              <CustomBarChart data={stats.hourlyData} />
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
          <h2 className="text-base font-bold tracking-tight">Top Pages</h2>
          {isLoading ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : stats.topPages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/70 dark:bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Page</TableHead>
                    <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">Visits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topPages.map(([path, count]) => (
                    <TableRow key={path} className="hover:bg-slate-50/50 dark:hover:bg-muted/40 transition-colors border-b border-slate-100 dark:border-slate-800/60">
                      <TableCell className="font-medium text-xs truncate max-w-[250px]">
                        {path}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs">{count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
        <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
          <IconClock className="h-4 w-4" />
          Event Feed
        </h2>
        {isLoading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : allEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No events in this time range.
          </p>
        ) : (
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 max-h-[500px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 border-b border-slate-100 dark:border-slate-800">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Event</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Page</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Label</TableHead>
                  <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEvents.slice(0, 100).map((e) => (
                  <TableRow key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-muted/40 transition-colors border-b border-slate-100 dark:border-slate-800/60">
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${EVENT_COLORS[e.type] || "bg-gray-100 text-gray-700"}`}
                      >
                        {EVENT_ICONS[e.type]}
                        {EVENT_LABELS[e.type] || e.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {e.path}
                    </TableCell>
                    <TableCell className="text-xs truncate max-w-[150px]">
                      {e.label || "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(e.createdAt), "MMM d, HH:mm:ss")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  badgeBg,
  loading,
  className,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  badgeBg: string;
  loading: boolean;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", badgeBg)}>
          {icon}
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-20 rounded-xl" />
      ) : (
        <p className="text-3xl font-bold tracking-tight">{value.toLocaleString()}</p>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-32 items-center justify-center text-sm text-muted-foreground">
      No data available
    </div>
  );
}
