/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
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
} from "@/features/analytics/api/use-analytics";

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

export default function DashBoardClientPage() {
  const [period, setPeriod] = useState<"month" | "year">("month");

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

  const salesTrendData = (overview?.trendData || []).map((t: TrendData) => ({
    name: new Date(t.date).toLocaleDateString(),
    value: t.amount,
  }));

  const acquisitionData = (acquisition || []).map((a) => ({
    name: new Date(a.date).toLocaleDateString(),
    value: a.count,
  }));

  return (
    <div className="container mx-auto px-4 space-y-6 py-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Business Analytics</h1>
        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as "month" | "year")}
        >
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Revenue"
          value={overview?.totalRevenue}
          format="currency"
          loading={loadingOverview}
        />
        <MetricCard
          title="Total Orders"
          value={overview?.totalOrders}
          loading={loadingOverview}
        />
        <MetricCard
          title="Average Order Value"
          value={overview?.aov}
          format="currency"
          loading={loadingOverview}
        />
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="grid grid-cols-2 w-full md:w-[400px] mb-4">
          <TabsTrigger value="sales">Sales Overview</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {loadingOverview ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <CustomLineChart data={salesTrendData} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDistribution ? (
                  <Skeleton className="h-64 w-full" />
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
                            ${item.revenue?.toLocaleString()}
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

        <TabsContent value="customers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Acquisition</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {loadingAcquisition ? (
                  <Skeleton className="h-full w-full" />
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
          <Card>
            <CardHeader>
              <CardTitle>Most Purchased Products</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPurchased ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Units Sold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mostPurchased?.map((product) => (
                      <TableRow key={product.productId}>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            {product.productImages[0] && (
                              <img
                                src={product.productImages[0]}
                                className="h-12 w-12 rounded object-cover"
                                alt={product.productName}
                              />
                            )}
                            {product.productName}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {product.totalSold}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Most Wishlisted Products</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingWishlisted ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Wishlists</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mostWishlisted?.map((product) => (
                      <TableRow key={product.productId}>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            {product.productImages[0] && (
                              <img
                                src={product.productImages[0]}
                                className="h-12 w-12 rounded object-cover"
                                alt={product.productName}
                              />
                            )}
                            {product.productName}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {product.wishlistCount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Customer Lifetime Value"
          value={clv?.averageCLV}
          format="currency"
          loading={loadingCLV}
        />
        <MetricCard
          title="Inventory Turnover"
          value={inventory?.turnoverRate}
          // format="percentage"
          loading={loadingInventory}
        />
        <MetricCard
          title="Cart Abandonment"
          value={abandonment?.abandonmentRate}
          format="percentage"
          loading={loadingAbandonment}
        />
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value?: number;
  format?: "currency" | "percentage" | "number";
  loading?: boolean;
}

function MetricCard({
  title,
  value,
  format = "number",
  loading,
}: MetricCardProps) {
  const formattedValue = () => {
    if (typeof value === "undefined") return "-";
    switch (format) {
      case "currency":
        return `$${value.toLocaleString(undefined, {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })}`;
      case "percentage":
        return `${value.toFixed(2)}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="text-2xl font-bold">{formattedValue()}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
