"use client";

import { useState } from "react";
import {
  useTrafficEvents,
  useClearTrafficEvents,
  type TrafficEvent,
} from "@/features/traffic/api/use-traffic";
import { useGetOrders } from "@/features/order/api/use-get-orders";
import { getEventStats } from "@/lib/traffic-tracker";
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
  IconBrandAndroid,
  IconBrandApple,
  IconBrandWindows,
  IconDeviceMobile,
  IconDeviceLaptop,
  IconMapPin,
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

import { DavidWellsAnalyticsMonitor } from "./david-wells-analytics-monitor";
import { AnalyticsFunnelCard } from "./analytics-funnel-card";
import { RealtimeActiveUsersCard } from "./realtime-active-users-card";
import { UtmTrafficSourcesCard } from "./utm-traffic-sources-card";
import { CartAbandonmentCard } from "./cart-abandonment-card";

export default function AnalysisClientPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24h");
  const hours = timeFilter === "all" ? undefined : TIME_FILTER_HOURS[timeFilter];

  const { data: events, isLoading, isFetching: isFetchingEvents, refetch: refetchEvents } = useTrafficEvents(hours);
  const { data: ordersData, isLoading: isLoadingOrders, isFetching: isFetchingOrders, refetch: refetchOrders } = useGetOrders();
  const clearEvents = useClearTrafficEvents();

  const isRefreshing = isFetchingEvents || isFetchingOrders;

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchEvents(), refetchOrders()]);
    } catch (err) {
      console.error("Failed to refresh analytics:", err);
    }
  };

  const allEvents = events ?? [];
  const stats = getEventStats(allEvents);
  const recentOrders = ordersData?.orders ?? [];

  const pageViews = stats.byType["page_view"] || 0;
  const productViews = stats.byType["product_view"] || 0;
  const addToCarts = stats.byType["add_to_cart"] || 0;
  const buyNows = stats.byType["buy_now"] || 0;
  const totalOrders = stats.byType["order_complete"] || recentOrders.length;

  const totalHits = allEvents.length || 1;

  // OS Icon Helper
  const getOSIcon = (osName: string) => {
    const lower = osName.toLowerCase();
    if (lower.includes("android")) return <IconBrandAndroid className="h-4 w-4 text-emerald-500" />;
    if (lower.includes("ios") || lower.includes("mac")) return <IconBrandApple className="h-4 w-4 text-slate-800 dark:text-slate-200" />;
    if (lower.includes("windows")) return <IconBrandWindows className="h-4 w-4 text-blue-500" />;
    return <IconDeviceLaptop className="h-4 w-4 text-slate-400" />;
  };

  // Aggregate Order Locations
  const orderCityStats = recentOrders.reduce((acc: Record<string, { count: number; total: number }>, o: any) => {
    const city = o.shippingCity || o.shippingState || "Dhaka";
    if (!acc[city]) acc[city] = { count: 0, total: 0 };
    acc[city].count += 1;
    acc[city].total += o.totalAmount || 0;
    return acc;
  }, {});

  const topOrderCities = Object.entries(orderCityStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Real-time traffic, phone OS breakdown, customer order locations, and system analytics
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
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border-none cursor-pointer transition-all"
          >
            <IconRefresh className={cn("h-3.5 w-3.5 mr-1", isRefreshing && "animate-spin text-rose-500")} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
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

      {/* GA4 Style Realtime Active Users */}
      <RealtimeActiveUsersCard realtimeData={stats.realtime30Min} loading={isLoading} />

      {/* E-Commerce Conversion Funnel */}
      <AnalyticsFunnelCard funnelData={stats.funnelData} loading={isLoading} />

      {/* Traffic Channels & Cart Abandonment Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <UtmTrafficSourcesCard topSources={stats.topTrafficSources} loading={isLoading} />
        <CartAbandonmentCard cartAbandonment={stats.cartAbandonment} loading={isLoading} />
      </div>

      {/* David Wells Analytics Engine & Live Monitor Playground */}
      <DavidWellsAnalyticsMonitor />

      {/* Top Stat Cards */}
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
          value={totalOrders}
          icon={<IconActivity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          badgeBg="bg-emerald-50 dark:bg-emerald-950/40"
          loading={isLoading}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Events by Hour & Phone OS Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
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

        {/* Operating Systems Breakdown (Android vs iOS vs Windows) */}
        <div className="xl:col-span-5 rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
              <IconDeviceMobile className="h-5 w-5 text-emerald-600" />
              Phone & OS Distribution
            </h2>
            <Badge variant="outline" className="text-[10px] font-bold rounded-full">
              Mobile vs Desktop
            </Badge>
          </div>
          {isLoading ? (
            <Skeleton className="h-56 w-full rounded-2xl" />
          ) : stats.topOS.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3 pt-1">
              {stats.topOS.map(([osName, count]) => {
                const percent = Math.round((count / totalHits) * 100) || 0;
                return (
                  <div key={osName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-foreground">
                        {getOSIcon(osName)}
                        {osName}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {count} hits ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          osName === "Android"
                            ? "bg-emerald-500"
                            : osName === "iOS"
                            ? "bg-slate-900 dark:bg-slate-100"
                            : osName === "Windows"
                            ? "bg-blue-500"
                            : "bg-indigo-500"
                        )}
                        style={{ width: `${Math.max(percent, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>



      {/* VISITED TRAFFIC UNIQUE LOCATIONS LIST */}
      <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2 text-foreground">
              <IconMapPin className="h-5 w-5 text-rose-500" />
              Visited Traffic Unique Locations List
            </h2>
            <p className="text-xs text-muted-foreground">
              Geographic breakdown of traffic visitors by unique IP addresses, top pages visited, and last active time
            </p>
          </div>
          <Badge variant="outline" className="rounded-full text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-muted/40">
            {stats.uniqueLocationsList.length} Unique Locations
          </Badge>
        </div>

        {isLoading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : stats.uniqueLocationsList.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/70 dark:bg-muted/30">
                <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Location (City & Country)</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-center">Unique Visitors (IPs)</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-center">Total Hits</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Top Visited Page</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Main Device</TableHead>
                  <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">Last Active Visit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.uniqueLocationsList.map((loc) => (
                  <TableRow key={loc.locName} className="hover:bg-slate-50/50 dark:hover:bg-muted/40 transition-colors border-b border-slate-100 dark:border-slate-800/60">
                    <TableCell className="font-medium text-xs">
                      <span className="inline-flex items-center gap-2 font-bold text-foreground">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                        {loc.locName}
                      </span>
                    </TableCell>

                    <TableCell className="text-center text-xs">
                      <Badge variant="outline" className="rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-none px-2.5 py-0.5">
                        {loc.uniqueIPsCount} Unique {loc.uniqueIPsCount === 1 ? "IP" : "IPs"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center text-xs font-semibold font-mono">
                      {loc.hits} {loc.hits === 1 ? "hit" : "hits"}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {loc.topPath}
                    </TableCell>

                    <TableCell className="text-xs">
                      <Badge variant="secondary" className="rounded-full text-[10px] font-semibold">
                        {loc.topDevice}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap font-mono">
                      {format(new Date(loc.lastVisitedAt), "MMM d, HH:mm:ss")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Top Pages, Browsers, & Locations Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Pages */}
        <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
          <h2 className="text-base font-bold tracking-tight">Top Pages Visited</h2>
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
                      <TableCell className="font-medium text-xs truncate max-w-[200px]">
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

        {/* Top Ordering Cities */}
        <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
          <h2 className="text-base font-bold tracking-tight flex items-center gap-1.5">
            <IconMapPin className="h-4 w-4 text-rose-500" />
            Top Order Locations
          </h2>
          {isLoadingOrders ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : topOrderCities.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/70 dark:bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">District / City</TableHead>
                    <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">Orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topOrderCities.map(([cityName, data]) => (
                    <TableRow key={cityName} className="hover:bg-slate-50/50 dark:hover:bg-muted/40 transition-colors border-b border-slate-100 dark:border-slate-800/60">
                      <TableCell className="font-medium text-xs truncate max-w-[180px]">
                        <span className="inline-flex items-center gap-1.5 font-bold">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          {cityName}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        <span className="font-bold">{data.count} orders</span>
                        <span className="text-[10px] text-muted-foreground block font-mono">৳{data.total.toLocaleString()}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Browsers & System */}
        <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
          <h2 className="text-base font-bold tracking-tight">Browsers & Systems</h2>
          {isLoading ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : stats.topBrowsers.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/70 dark:bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Browser</TableHead>
                    <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">Sessions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topBrowsers.map(([bName, count]) => (
                    <TableRow key={bName} className="hover:bg-slate-50/50 dark:hover:bg-muted/40 transition-colors border-b border-slate-100 dark:border-slate-800/60">
                      <TableCell className="font-medium text-xs truncate max-w-[200px]">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          {bName}
                        </span>
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

      {/* Real-Time Event Feed */}
      <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
        <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
          <IconClock className="h-4 w-4 text-indigo-500" />
          Real-Time Live Activity Feed & Devices
        </h2>
        {isLoading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : allEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No live events in this time range.
          </p>
        ) : (
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 max-h-[450px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 border-b border-slate-100 dark:border-slate-800">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Event</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Page</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">IP Address</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Browser & Device</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Location</TableHead>
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
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {e.path}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                      {e.ip || "127.0.0.1"}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 border-none">
                          {e.device || "Desktop"}
                        </Badge>
                        <span className="text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                          {e.browser || "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[140px]">
                      {e.city && e.country ? `${e.city}, ${e.country}` : e.country || "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap font-mono">
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
