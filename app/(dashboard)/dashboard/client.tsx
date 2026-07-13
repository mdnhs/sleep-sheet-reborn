/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useCurrency } from "@/hooks/use-currency";
import {
  IconCashRegister,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
  IconBox,

} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useSalesOverview,
  useCustomerLifetimeValue,
  useGeographicDistribution,
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
  CohortChart,
  CustomBarChart,
  CustomLineChart,
} from "@/components/ui/charts";

interface TrendData {
  date: string;
  amount: number;
}

interface GeographicData {
  state: string;
  revenue: number;
  orders: number;
}

interface SpendingSegment {
  segment: string;
  customers: number;
}

type Period = "month" | "year";

export default function DashBoardClientPage() {
  const { symbol: currencySymbol } = useCurrency();
  const [period, setPeriod] = useState<Period>("month");

  const { data: overview, isLoading: loadingOverview } =
    useSalesOverview(period);
  const { data: clv, isLoading: loadingCLV } = useCustomerLifetimeValue();
  const { data: distribution, isLoading: loadingDistribution } =
    useGeographicDistribution();
  const { data: inventory, isLoading: loadingInventory } =
    useInventoryTurnover();
  const { data: abandonment, isLoading: loadingAbandonment } =
    useCartAbandonment();
  const { data: cohort, isLoading: loadingCohort } = useCohortRetention();
  const { data: segments, isLoading: loadingSegments } = useSpendingClusters();
  const { data: acquisition, isLoading: loadingAcquisition } =
    useCustomerAcquisition(period);
  const { data: mostPurchased, isLoading: loadingPurchased } =
    useMostPurchased();
  const { data: mostWishlisted, isLoading: loadingWishlisted } =
    useMostWishlisted();
  const { data: recentOrders, isLoading: loadingRecentOrders } =
    useRecentOrders();
  const { data: lowStock, isLoading: loadingLowStock } = useLowStock();

  const formatBucketDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      ...(period === "year" ? { year: "2-digit" } : { day: "numeric" }),
    });

  const salesTrendData = (overview?.trendData || []).map((t: TrendData) => ({
    name: formatBucketDate(t.date),
    value: t.amount,
  }));

  const acquisitionData = (acquisition || []).map((a) => ({
    name: formatBucketDate(a.date),
    value: a.count,
  }));

  const changes = overview?.changes;

  return (
    <div className="container mx-auto px-4 space-y-6 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Business Analytics</h1>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <Link href="/dashboard/pos">
              <Button className="w-full sm:w-auto gap-2 text-white whitespace-nowrap">
                <IconCashRegister className="h-4 w-4" />
                POS
              </Button>
            </Link>
          </div>
          <Tabs
            value={period}
            onValueChange={(value) => setPeriod(value as Period)}
            className="w-full sm:w-auto mt-2 sm:mt-0"
          >
            <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard
          title="Total Revenue"
          value={overview?.totalRevenue}
          format="currency"
          currencySymbol={currencySymbol}
          change={changes?.revenue}
          loading={loadingOverview}
        />
        <MetricCard
          title="Total Orders"
          value={overview?.totalOrders}
          change={changes?.orders}
          loading={loadingOverview}
        />
        <MetricCard
          title="Average Order Value"
          value={overview?.aov}
          format="currency"
          currencySymbol={currencySymbol}
          change={changes?.aov}
          loading={loadingOverview}
        />
        <MetricCard
          title="Total Expenses"
          value={overview?.totalExpenses}
          format="currency"
          currencySymbol={currencySymbol}
          change={changes?.expenses}
          invertChangeColor
          loading={loadingOverview}
        />
        <MetricCard
          title="Net Profit"
          value={overview?.netProfit}
          format="currency"
          currencySymbol={currencySymbol}
          change={changes?.netProfit}
          subtitle={
            typeof overview?.profitMargin === "number"
              ? `${overview.profitMargin}% margin`
              : undefined
          }
          loading={loadingOverview}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Operational Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="flex flex-col h-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link href="/dashboard/orders" className="text-sm text-indigo-600 hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {loadingRecentOrders ? (
              <Skeleton className="h-64 w-full" />
            ) : !recentOrders?.length ? (
              <EmptyState message="No recent orders" />
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          <Link href={`/dashboard/orders/${order.id}`} className="hover:underline hover:text-indigo-600">
                            {order.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="truncate max-w-[120px]" title={order.customerName}>{order.customerName}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {format(new Date(order.createdAt), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.status === "COMPLETED" ? "default" : order.status === "PENDING" ? "secondary" : "destructive"}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {currencySymbol}{Number(order.totalAmount).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle>Low Stock Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {loadingLowStock ? (
              <Skeleton className="h-64 w-full" />
            ) : !lowStock?.length ? (
              <div className="h-48 flex items-center justify-center border rounded-lg bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400">
                <p>All products are well stocked!</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Stock Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStock.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium truncate max-w-[200px]">
                          <Link href={`/dashboard/products/${product.id}/edit`} className="hover:underline flex items-center gap-2">
                            {product.images && product.images[0] ? (
                              <img src={product.images[0]} alt="" className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                <IconBox className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <span className="truncate">{product.name}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={product.stock === 0 ? "destructive" : "outline"} className={product.stock > 0 ? "text-amber-600 border-amber-600" : ""}>
                            {product.stock} left
                          </Badge>
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

      <Tabs defaultValue="sales">
        <TabsList className="grid grid-cols-2 w-full md:w-[400px] mb-4">
          <TabsTrigger value="sales">Sales Overview</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-7 gap-4">
            <Card className="col-span-1 xl:col-span-4">
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {loadingOverview ? (
                  <Skeleton className="h-full w-full" />
                ) : salesTrendData.length === 0 ? (
                  <EmptyState message="No sales in this period" />
                ) : (
                  <CustomLineChart data={salesTrendData} />
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1 xl:col-span-3">
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDistribution ? (
                  <Skeleton className="h-64 w-full" />
                ) : !distribution?.length ? (
                  <EmptyState message="No shipping data yet" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>State</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(distribution as GeographicData[])?.map((item) => (
                        <TableRow key={item.state}>
                          <TableCell>{item.state}</TableCell>
                          <TableCell className="text-right">
                            {currencySymbol}
                            {item.revenue?.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.orders}
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

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Acquisition</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {loadingAcquisition ? (
                  <Skeleton className="h-full w-full" />
                ) : acquisitionData.length === 0 ? (
                  <EmptyState message="No new customers in this period" />
                ) : (
                  <CustomBarChart data={acquisitionData} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spending Segments</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSegments ? (
                  <Skeleton className="h-64 w-full" />
                ) : !segments?.length ? (
                  <EmptyState message="No customer data yet" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Segment</TableHead>
                        <TableHead className="text-right">Customers</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(segments as SpendingSegment[])?.map((segment) => (
                        <TableRow key={segment.segment}>
                          <TableCell>{segment.segment}</TableCell>
                          <TableCell className="text-right">
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
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Cohort Retention</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {loadingCohort ? (
              <Skeleton className="h-full w-full" />
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
          </CardContent>
        </Card>

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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          title="Customer Lifetime Value"
          value={clv?.averageCLV}
          format="currency"
          currencySymbol={currencySymbol}
          loading={loadingCLV}
        />
        <MetricCard
          title="Inventory Turnover"
          value={inventory?.turnoverRate}
          loading={loadingInventory}
        />
        <MetricCard
          title="Cart Abandonment"
          value={abandonment?.abandonmentRate}
          format="percentage"
          invertChangeColor
          loading={loadingAbandonment}
        />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-32 items-center justify-center text-sm text-muted-foreground">
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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : !rows?.length ? (
          <EmptyState message="No data yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">{valueHeader}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      {row.image && (
                        <img
                          src={row.image}
                          className="h-12 w-12 rounded object-cover"
                          alt={row.name}
                        />
                      )}
                      {row.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {row.value.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  title: string;
  value?: number;
  format?: "currency" | "percentage" | "number";
  currencySymbol?: string;
  change?: number | null;
  // For metrics where an increase is bad (expenses, abandonment)
  invertChangeColor?: boolean;
  subtitle?: string;
  loading?: boolean;
  className?: string;
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
}: MetricCardProps) {
  const formattedValue = () => {
    if (typeof value === "undefined") return "-";
    switch (format) {
      case "currency":
        return `${currencySymbol}${value.toLocaleString(undefined, {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })}`;
      case "percentage":
        return `${value.toFixed(2)}%`;
      default:
        return value.toLocaleString();
    }
  };

  const hasChange = typeof change === "number";
  const isGood = hasChange && (invertChangeColor ? change! < 0 : change! > 0);
  const isFlat = hasChange && change === 0;

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <>
              <p className="text-2xl font-bold">{formattedValue()}</p>
              {(hasChange || subtitle) && (
                <div className="flex items-center gap-2 text-xs">
                  {hasChange && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 font-medium",
                        isFlat
                          ? "text-muted-foreground"
                          : isGood
                            ? "text-green-600"
                            : "text-red-600"
                      )}
                    >
                      {change! >= 0 ? (
                        <IconTrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <IconTrendingDown className="h-3.5 w-3.5" />
                      )}
                      {change! > 0 ? "+" : ""}
                      {change}%
                    </span>
                  )}
                  {hasChange && (
                    <span className="text-muted-foreground">
                      vs prev period
                    </span>
                  )}
                  {subtitle && (
                    <span className="text-muted-foreground">{subtitle}</span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
