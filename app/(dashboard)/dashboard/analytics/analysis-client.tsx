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
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Traffic activity, page visits, and user interactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <IconActivity className="h-3 w-3" />
            {allEvents.length} events
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <IconRefresh className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearEvents.mutate()}
            disabled={clearEvents.isPending}
          >
            <IconTrash className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["1h", "6h", "24h", "7d", "all"] as TimeFilter[]).map((f) => (
          <Button
            key={f}
            variant={timeFilter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeFilter(f)}
          >
            {f === "all" ? "All Time" : f}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Page Views"
          value={pageViews}
          icon={<IconEye className="h-4 w-4 text-muted-foreground" />}
          loading={isLoading}
        />
        <StatCard
          title="Product Views"
          value={productViews}
          icon={<IconEye className="h-4 w-4 text-purple-500" />}
          loading={isLoading}
        />
        <StatCard
          title="Add to Cart"
          value={addToCarts}
          icon={<IconShoppingCart className="h-4 w-4 text-green-500" />}
          loading={isLoading}
        />
        <StatCard
          title="Buy Now"
          value={buyNows}
          icon={<IconBolt className="h-4 w-4 text-orange-500" />}
          loading={isLoading}
        />
        <StatCard
          title="Orders"
          value={orders}
          icon={<IconActivity className="h-4 w-4 text-emerald-500" />}
          loading={isLoading}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Events by Hour</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : stats.hourlyData.every((d) => d.value === 0) ? (
              <EmptyState />
            ) : (
              <CustomBarChart data={stats.hourlyData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : stats.topPages.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.topPages.map(([path, count]) => (
                      <TableRow key={path}>
                        <TableCell className="font-medium text-xs truncate max-w-[250px]">
                          {path}
                        </TableCell>
                        <TableCell className="text-right">{count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <IconClock className="h-4 w-4" />
            Event Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : allEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No events in this time range.
            </p>
          ) : (
            <div className="rounded-md border max-h-[500px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allEvents.slice(0, 100).map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${EVENT_COLORS[e.type] || "bg-gray-100 text-gray-700"}`}
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
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  loading,
  className,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            {title}
          </span>
          {icon}
        </div>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-32 items-center justify-center text-sm text-muted-foreground">
      No data available
    </div>
  );
}
