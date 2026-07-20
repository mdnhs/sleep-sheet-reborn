/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useCurrency } from "@/hooks/use-currency";
import {
  IconCashRegister,
  IconAlertTriangle,
  IconBox,
} from "@tabler/icons-react";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Truck,
  Receipt,
  TrendingUp,
  Ban,
  RotateCcw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { type DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import {
  useSalesOverview,
  useCustomerLifetimeValue,
  useInventoryTurnover,
  useCartAbandonment,
  useCohortRetention,
  useSpendingClusters,
  useCustomerAcquisition,
  useMostPurchased,
  useMostWishlisted,
  useRecentOrders,
  useLowStock,
} from "@/features/analytics/api/use-analytics";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CohortChart,
  CustomBarChart,
  RevenueAnalyticsBarChart,
  ProfitLossStackedChart,
} from "@/components/ui/charts";

interface TrendData {
  date: string;
  amount: number;
}

interface SpendingSegment {
  segment: string;
  customers: number;
}

type Period = "this-month" | "last-month" | "3-months" | "6-months" | "12-months" | "month" | "year";

const periodLabels: Record<string, string> = {
  "this-month": "This Month",
  "month": "This Month",
  "last-month": "Last Month",
  "3-months": "Last 3 Months",
  "6-months": "Last 6 Months",
  "12-months": "Last 12 Months",
  "year": "Last 12 Months",
};

export default function DashBoardClientPage() {
  const { symbol: currencySymbol } = useCurrency();
  const [graphPeriod, setGraphPeriod] = useState<Period>("this-month");
  const [showBreakdownDialog, setShowBreakdownDialog] = useState(false);

  // Top KPI metric cards remain steady on "this-month"
  const { data: overview, isLoading: loadingOverview } =
    useSalesOverview("this-month");
  // Revenue Analytics & Total Income graph query isolated to graphPeriod
  const { data: graphOverview, isLoading: loadingGraphOverview } =
    useSalesOverview(graphPeriod);

  const { data: clv, isLoading: loadingCLV } = useCustomerLifetimeValue();
  const { data: inventory, isLoading: loadingInventory } =
    useInventoryTurnover();
  const { data: abandonment, isLoading: loadingAbandonment } =
    useCartAbandonment();
  const { data: cohort, isLoading: loadingCohort } = useCohortRetention();
  const { data: segments, isLoading: loadingSegments } = useSpendingClusters();
  const { data: acquisition, isLoading: loadingAcquisition } =
    useCustomerAcquisition(graphPeriod);
  const { data: mostPurchased, isLoading: loadingPurchased } =
    useMostPurchased();
  const { data: mostWishlisted, isLoading: loadingWishlisted } =
    useMostWishlisted();
  const { data: recentOrders, isLoading: loadingRecentOrders } =
    useRecentOrders();
  const { data: lowStock, isLoading: loadingLowStock } = useLowStock();

  const formatGraphBucketDate = (iso: string) => {
    const d = new Date(iso);
    if (graphPeriod === "3-months" || graphPeriod === "6-months" || graphPeriod === "12-months" || graphPeriod === "year") {
      return d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  };

  const salesTrendData = (graphOverview?.trendData || []).map((t: TrendData) => ({
    name: formatGraphBucketDate(t.date),
    value: t.amount,
  }));

  const profitLossData = (graphOverview?.trendData || []).map((t: TrendData) => {
    const avgCost = (graphOverview?.totalCost || 0) / Math.max(1, graphOverview?.trendData?.length || 1);
    return {
      name: formatGraphBucketDate(t.date),
      profit: Math.max(0, t.amount - avgCost),
      cost: avgCost,
    };
  });

  const acquisitionData = (acquisition || []).map((a) => ({
    name: formatGraphBucketDate(a.date),
    value: a.count,
  }));

  const changes = overview?.changes;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Sales Overview
        </h1>
        <div className="hidden sm:flex items-center gap-2">
          <Link href="/dashboard/pos">
            <Button className="gap-2 text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 whitespace-nowrap rounded-full px-5">
              <IconCashRegister className="h-4 w-4" />
              POS
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Gross Sale"
          value={overview?.grossSales}
          format="currency"
          currencySymbol={currencySymbol}
          change={changes?.grossSales}
          subtitle={
            typeof overview?.cancelledAmount === "number" && typeof overview?.returnedAmount === "number"
              ? `Cancel: ${currencySymbol}${overview.cancelledAmount.toLocaleString()} | Return: ${currencySymbol}${overview.returnedAmount.toLocaleString()}`
              : undefined
          }
          loading={loadingOverview}
          icon={<ShoppingCart className="h-4 w-4 text-slate-700 dark:text-slate-200" />}
          valueClassName="text-slate-900 dark:text-white"
        />
        <MetricCard
          title="Total Net Sale"
          value={overview?.totalRevenue}
          format="currency"
          currencySymbol={currencySymbol}
          change={changes?.revenue}
          subtitle="Net revenue after deductions"
          loading={loadingOverview}
          icon={<DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
          valueClassName="text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          title="Product Bought Cost (Net)"
          value={overview?.totalCost}
          format="currency"
          currencySymbol={currencySymbol}
          change={changes?.cost}
          invertChangeColor
          subtitle="Cost of goods for net sales"
          loading={loadingOverview}
          icon={<Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
          valueClassName="text-purple-600 dark:text-purple-400"
        />
        <MetricCard
          title="Total Delivery Charge"
          value={overview?.totalShipping}
          format="currency"
          currencySymbol={currencySymbol}
          change={changes?.shipping}
          invertChangeColor
          subtitle="Courier shipping costs"
          loading={loadingOverview}
          icon={<Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
          valueClassName="text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          title="Total Expense"
          value={overview?.totalExpenses}
          format="currency"
          currencySymbol={currencySymbol}
          change={changes?.expenses}
          invertChangeColor
          subtitle="Operating expenses"
          loading={loadingOverview}
          icon={<Receipt className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
          valueClassName="text-orange-600 dark:text-orange-400"
        />
        <MetricCard
          title="Net Profit"
          value={overview?.netProfit}
          format="currency"
          currencySymbol={currencySymbol}
          change={changes?.netProfit}
          subtitle={
            typeof overview?.profitMargin === "number"
              ? `${overview.profitMargin}% net margin`
              : undefined
          }
          loading={loadingOverview}
          icon={<TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
          valueClassName={(overview?.netProfit ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
        />
        <MetricCard
          title="Total Cancelled Orders"
          value={overview?.totalCancelledOrders}
          change={changes?.cancelledOrders}
          invertChangeColor
          subtitle={
            typeof overview?.cancelledAmount === "number"
              ? `Val: ${currencySymbol}${overview.cancelledAmount.toLocaleString()}`
              : undefined
          }
          loading={loadingOverview}
          icon={<Ban className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
          valueClassName="text-amber-600 dark:text-amber-400"
        />
        <MetricCard
          title="Total Returned Orders"
          value={overview?.totalReturnedOrders}
          change={changes?.returnedOrders}
          invertChangeColor
          subtitle={
            typeof overview?.returnedAmount === "number"
              ? `Val: ${currencySymbol}${overview.returnedAmount.toLocaleString()}`
              : undefined
          }
          loading={loadingOverview}
          icon={<RotateCcw className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
          valueClassName="text-rose-600 dark:text-rose-400"
        />
      </div>

      {/* Operational Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Orders</h3>
            <Link
              href="/dashboard/orders"
              className="px-3.5 py-1 rounded-full border bg-slate-50 dark:bg-muted/40 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-muted transition-colors"
            >
              View all ➔
            </Link>
          </div>
          <div className="flex-1">
            {loadingRecentOrders ? (
              <Skeleton className="h-64 w-full rounded-2xl" />
            ) : !recentOrders?.length ? (
              <EmptyState message="No recent orders" />
            ) : (
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/70 dark:bg-muted/30">
                    <TableRow>
                      <TableHead className="h-9 px-3 text-xs font-bold text-slate-700 dark:text-slate-300">Order #</TableHead>
                      <TableHead className="h-9 px-3 text-xs font-bold text-slate-700 dark:text-slate-300">Customer</TableHead>
                      <TableHead className="h-9 px-3 text-xs font-bold text-slate-700 dark:text-slate-300">Date</TableHead>
                      <TableHead className="h-9 px-3 text-xs font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
                      <TableHead className="h-9 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order: any) => (
                      <TableRow key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-muted/40">
                        <TableCell className="px-3 py-3 text-xs font-semibold whitespace-nowrap">
                          <Link href={`/dashboard/orders/${order.id}`} className="hover:underline hover:text-indigo-600">
                            {order.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs truncate max-w-[85px] sm:max-w-[110px]" title={order.customerName}>
                          {order.customerName}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(order.createdAt), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <Badge 
                            variant={order.status === "DELIVERED" ? "default" : order.status === "CANCELLED" || order.status === "REFUNDED" ? "destructive" : "secondary"}
                            className="px-2 py-0.5 text-[10px] sm:text-xs font-medium whitespace-nowrap rounded-full"
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs text-right font-bold tabular-nums whitespace-nowrap">
                          {currencySymbol}{Number(order.totalAmount).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Low Stock Alerts</h3>
            </div>
          </div>
          <div className="flex-1">
            {loadingLowStock ? (
              <Skeleton className="h-64 w-full rounded-2xl" />
            ) : !lowStock?.length ? (
              <div className="h-48 flex items-center justify-center rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold">
                <p>All products are well stocked!</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/70 dark:bg-muted/30">
                    <TableRow>
                      <TableHead className="h-9 px-3 text-xs font-bold text-slate-700 dark:text-slate-300">Product</TableHead>
                      <TableHead className="h-9 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 text-right">Stock Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStock.map((product: any) => (
                      <TableRow key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-muted/40">
                        <TableCell className="px-3 py-3 font-medium text-xs truncate max-w-[180px]">
                          <Link href={`/dashboard/products/${product.id}/edit`} className="hover:underline flex items-center gap-2">
                            {product.images && product.images[0] ? (
                              <img src={product.images[0]} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <IconBox className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            )}
                            <span className="truncate">{product.name}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right">
                          <Badge variant={product.stock === 0 ? "destructive" : "outline"} className={cn("px-2 py-0.5 text-[10px] sm:text-xs rounded-full", product.stock > 0 ? "text-amber-600 border-amber-600" : "")}>
                            {product.stock} left
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="grid grid-cols-2 w-full md:w-[400px] mb-4 bg-white dark:bg-card rounded-full p-1 shadow-none">
          <TabsTrigger value="sales" className="rounded-full text-xs font-semibold">Sales Overview</TabsTrigger>
          <TabsTrigger value="customers" className="rounded-full text-xs font-semibold">Customer Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            <div className="col-span-1 lg:col-span-4 rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue analytics</h3>
                <Select
                  value={graphPeriod}
                  onValueChange={(val) => setGraphPeriod(val as Period)}
                >
                  <SelectTrigger size="sm" className="w-[140px] rounded-full bg-slate-50 dark:bg-muted/40 text-xs font-semibold border border-slate-200 dark:border-slate-800 shadow-none">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent align="end" className="rounded-2xl bg-white dark:bg-card border shadow-md">
                    <SelectItem value="this-month" className="rounded-xl text-xs font-medium cursor-pointer">This Month</SelectItem>
                    <SelectItem value="last-month" className="rounded-xl text-xs font-medium cursor-pointer">Last Month</SelectItem>
                    <SelectItem value="3-months" className="rounded-xl text-xs font-medium cursor-pointer">Last 3 Months</SelectItem>
                    <SelectItem value="6-months" className="rounded-xl text-xs font-medium cursor-pointer">Last 6 Months</SelectItem>
                    <SelectItem value="12-months" className="rounded-xl text-xs font-medium cursor-pointer">Last 12 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-72">
                {loadingGraphOverview ? (
                  <Skeleton className="h-full w-full rounded-2xl" />
                ) : salesTrendData.length === 0 ? (
                  <EmptyState message="No sales in this period" />
                ) : (
                  <RevenueAnalyticsBarChart data={salesTrendData} currencySymbol={currencySymbol} />
                )}
              </div>
            </div>

            <div className="col-span-1 lg:col-span-3 rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Total Income</h3>
                </div>
                <p className="text-xs text-slate-400 font-medium mb-4">View your income & profit/loss ratio in this period</p>
                
                <div className="flex items-center justify-between text-xs font-bold mb-3 flex-wrap gap-2">
                  <span className="text-slate-700 dark:text-slate-200">Profit and Loss</span>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setShowBreakdownDialog(true)}
                      className="flex items-center gap-1.5 cursor-pointer hover:underline hover:opacity-80 transition-all outline-none"
                      title="Click to view Price Breakdown"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--secondary)] shrink-0"></span>
                      Profit: <span className="font-extrabold text-slate-900 dark:text-white">{currencySymbol}{Number(graphOverview?.netProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBreakdownDialog(true)}
                      className="flex items-center gap-1.5 cursor-pointer hover:underline hover:opacity-80 transition-all outline-none"
                      title="Click to view Price Breakdown"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1E1E1E] dark:bg-slate-600 shrink-0"></span>
                      Loss: <span className="font-extrabold text-slate-900 dark:text-white">{currencySymbol}{Number((graphOverview?.totalCost || 0) + (graphOverview?.totalShipping || 0) + (graphOverview?.totalExpenses || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-60">
                {loadingGraphOverview ? (
                  <Skeleton className="h-full w-full rounded-2xl" />
                ) : profitLossData.length === 0 ? (
                  <EmptyState message="No data in this period" />
                ) : (
                  <ProfitLossStackedChart data={profitLossData} currencySymbol={currencySymbol} />
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className="rounded-3xl bg-white dark:bg-card border-none shadow-none p-2">
              <CardHeader>
                <CardTitle className="text-base font-bold">Customer Acquisition</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {loadingAcquisition ? (
                  <Skeleton className="h-full w-full rounded-2xl" />
                ) : acquisitionData.length === 0 ? (
                  <EmptyState message="No new customers in this period" />
                ) : (
                  <CustomBarChart data={acquisitionData} />
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl bg-white dark:bg-card border-none shadow-none p-2">
              <CardHeader>
                <CardTitle className="text-base font-bold">Spending Segments</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSegments ? (
                  <Skeleton className="h-64 w-full rounded-2xl" />
                ) : !segments?.length ? (
                  <EmptyState message="No customer data yet" />
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50/70 dark:bg-muted/30">
                      <TableRow>
                        <TableHead className="h-9 px-3 text-xs font-bold">Segment</TableHead>
                        <TableHead className="h-9 px-3 text-xs font-bold text-right">Customers</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(segments as SpendingSegment[])?.map((segment) => (
                        <TableRow key={segment.segment}>
                          <TableCell className="px-3 py-3 text-xs font-semibold">{segment.segment}</TableCell>
                          <TableCell className="px-3 py-3 text-xs text-right font-bold">
                            {segment.customers?.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Combined Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-full rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cohort Retention</h3>
          </div>
          <div className="h-80 flex-1">
            {loadingCohort ? (
              <Skeleton className="h-full w-full rounded-2xl" />
            ) : !cohort?.length ? (
              <EmptyState message="No cohort data yet" />
            ) : (
              <CohortChart
                data={(cohort || []).map((c) => ({
                  cohortMonth: c.cohortMonth,
                  totalUsers: c.totalUsers,
                  retentionRate: c.retentionRate,
                }))}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <ProductRankCard
            title="Most Purchased Products"
            valueHeader="Units Sold"
            loading={loadingPurchased}
            rows={mostPurchased?.map((p) => ({
              id: p.productId,
              name: p.productName,
              image: p.productImages[0],
              value: p.totalSold,
            }))}
          />
          <ProductRankCard
            title="Most Wishlisted Products"
            valueHeader="Wishlists"
            loading={loadingWishlisted}
            rows={mostWishlisted?.map((p) => ({
              id: p.productId,
              name: p.productName,
              image: p.productImages[0],
              value: p.wishlistCount,
            }))}
          />
        </div>
      </div>

      {/* Bottom Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Customer Lifetime Value"
          value={clv?.averageCLV}
          format="currency"
          currencySymbol={currencySymbol}
          loading={loadingCLV}
          icon={<Users className="h-4 w-4 text-sky-600 dark:text-sky-400" />}
        />
        <MetricCard
          title="Inventory Turnover"
          value={inventory?.turnoverRate}
          loading={loadingInventory}
          icon={<Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
        />
        <MetricCard
          title="Cart Abandonment"
          value={abandonment?.abandonmentRate}
          format="percentage"
          invertChangeColor
          loading={loadingAbandonment}
          icon={<ShoppingCart className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
        />
      </div>

      {/* Price Breakdown Modal */}
      <Dialog open={showBreakdownDialog} onOpenChange={setShowBreakdownDialog}>
        <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-card p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white">
              Price Breakdown
            </DialogTitle>
            <p className="text-xs text-slate-400 font-medium">
              Financial details for {periodLabels[graphPeriod] || "This Month"}
            </p>
          </DialogHeader>

          <div className="space-y-3 mt-4 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-medium text-slate-600 dark:text-slate-300">Total Gross Sales</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {currencySymbol}{Number(graphOverview?.grossSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 text-xs text-rose-600 dark:text-rose-400 pl-3">
              <span>(-) Cancelled Orders ({graphOverview?.totalCancelledOrders || 0})</span>
              <span className="font-semibold">
                -{currencySymbol}{Number(graphOverview?.cancelledAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 text-xs text-rose-600 dark:text-rose-400 pl-3">
              <span>(-) Returned Orders ({graphOverview?.totalReturnedOrders || 0})</span>
              <span className="font-semibold">
                -{currencySymbol}{Number(graphOverview?.returnedAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-muted/30 px-3 rounded-xl">
              <span className="font-bold text-slate-800 dark:text-slate-200">Total Net Sales</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {currencySymbol}{Number(graphOverview?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-medium text-slate-600 dark:text-slate-300">(-) Product Bought Cost (Net)</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                -{currencySymbol}{Number(graphOverview?.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-medium text-slate-600 dark:text-slate-300">(-) Total Delivery Charges</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                -{currencySymbol}{Number(graphOverview?.totalShipping || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-medium text-slate-600 dark:text-slate-300">(-) Operating Expenses</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                -{currencySymbol}{Number(graphOverview?.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 bg-rose-50/70 dark:bg-rose-950/20 px-3 rounded-xl">
              <span className="font-bold text-rose-900 dark:text-rose-200">Total Loss & Costs (Subtotal)</span>
              <span className="font-extrabold text-rose-600 dark:text-rose-400 text-base">
                {currencySymbol}{Number((graphOverview?.totalCost || 0) + (graphOverview?.totalShipping || 0) + (graphOverview?.totalExpenses || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="pt-3">
              <div className={cn(
                "flex items-center justify-between p-4 rounded-2xl font-bold",
                (graphOverview?.netProfit || 0) >= 0
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100"
              )}>
                <span className="text-base">Net Profit / Loss</span>
                <span className="text-xl font-extrabold">
                  {currencySymbol}{Number(graphOverview?.netProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-32 items-center justify-center text-sm font-medium text-muted-foreground">
      {message}
    </div>
  );
}

interface ProductRankRow {
  id: string;
  name: string;
  image?: string;
  value: number;
}

function ProductRankCard({
  title,
  valueHeader,
  rows,
  loading,
}: {
  title: string;
  valueHeader: string;
  rows?: ProductRankRow[];
  loading?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <div>
        {loading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : !rows?.length ? (
          <EmptyState message="No product data yet" />
        ) : (
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/70 dark:bg-muted/30">
                <TableRow>
                  <TableHead className="h-9 px-3 text-xs font-bold text-slate-700 dark:text-slate-300">Product</TableHead>
                  <TableHead className="h-9 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 text-right">{valueHeader}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-muted/40">
                    <TableCell className="px-3 py-2.5 font-medium">
                      <div className="flex items-center gap-2">
                        {row.image ? (
                          <img src={row.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                            <IconBox className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="truncate max-w-[200px] text-xs font-semibold">{row.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-right font-bold text-xs">
                      {row.value?.toLocaleString()}
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

interface MetricCardProps {
  title: string;
  value?: number;
  format?: "currency" | "percentage" | "number";
  currencySymbol?: string;
  change?: number | null;
  invertChangeColor?: boolean;
  subtitle?: string;
  loading?: boolean;
  className?: string;
  valueClassName?: string;
  icon?: React.ReactNode;
}

function MetricCard({
  title,
  value,
  format = "number",
  currencySymbol = "$",
  change,
  invertChangeColor = false,
  subtitle,
  loading,
  className,
  valueClassName,
  icon,
}: MetricCardProps) {
  const formattedValue = () => {
    if (typeof value === "undefined" || value === null) return "-";
    switch (format) {
      case "currency":
        return `${currencySymbol}${value.toLocaleString(undefined, {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })}`;
      case "percentage":
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  const hasChange = typeof change === "number";
  const isGood = hasChange && (invertChangeColor ? change! < 0 : change! > 0);

  return (
    <div className={cn("rounded-3xl bg-white dark:bg-card border-none p-4 sm:p-6 shadow-none flex flex-col justify-between min-h-[120px] sm:min-h-[136px]", className)}>
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">{title}</span>
        {icon && (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#F4F4F2] dark:bg-slate-800/80 flex items-center justify-center text-slate-800 dark:text-slate-200 shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5 mb-1 flex items-baseline flex-wrap gap-1.5 sm:gap-2.5">
        {loading ? (
          <Skeleton className="h-7 sm:h-8 w-24 sm:w-28 rounded-xl" />
        ) : (
          <>
            <span className={cn("text-base sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white break-all", valueClassName)}>
              {formattedValue()}
            </span>
            {hasChange && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-semibold shrink-0",
                  isGood
                    ? "bg-[#EAF8ED] text-[#1E8A37] dark:bg-emerald-950/60 dark:text-emerald-400"
                    : "bg-[#FCEBEB] text-[#D92D20] dark:bg-rose-950/60 dark:text-rose-400"
                )}
              >
                {change! >= 0 ? "↑" : "↓"} {Math.abs(change!)}%
              </span>
            )}
          </>
        )}
      </div>

      {subtitle && (
        <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
}
