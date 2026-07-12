"use client";

import { useState } from "react";
import { useGetReports } from "@/features/reports/api/use-get-reports";
import { useCurrency } from "@/hooks/use-currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Package, Receipt } from "lucide-react";
import { subDays, startOfMonth, endOfMonth, format, parseISO } from "date-fns";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [showProductCostBreakdown, setShowProductCostBreakdown] = useState(false);
  const { data, isLoading } = useGetReports(dateRange);
  const { formatAmount } = useCurrency();

  const handleFilter = (type: "all" | "today" | "week" | "month") => {
    const today = new Date();
    switch (type) {
      case "all":
        setDateRange({});
        break;
      case "today":
        setDateRange({
          from: today.toISOString(),
          to: today.toISOString(),
        });
        break;
      case "week":
        setDateRange({
          from: subDays(today, 7).toISOString(),
          to: today.toISOString(),
        });
        break;
      case "month":
        setDateRange({
          from: startOfMonth(today).toISOString(),
          to: endOfMonth(today).toISOString(),
        });
        break;
    }
  };

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-4 md:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 space-y-0">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Reports & Profit/Loss</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleFilter("all")}>All Time</Button>
            <Button variant="outline" size="sm" onClick={() => handleFilter("today")}>Today</Button>
            <Button variant="outline" size="sm" onClick={() => handleFilter("week")}>Last 7 Days</Button>
            <Button variant="outline" size="sm" onClick={() => handleFilter("month")}>This Month</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold truncate">{formatAmount(data.totalRevenue)}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">From {data.orderCount} orders</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setShowProductCostBreakdown(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Product Cost</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold truncate">{formatAmount(data.totalCost)}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Bought prices (Click to view)</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Shipping Cost</CardTitle>
                  <TruckIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold truncate">{formatAmount(data.totalShippingCost)}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Courier fees</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Expenses</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold truncate">{formatAmount(data.totalExpense || 0)}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Misc costs</p>
                </CardContent>
              </Card>

              <Card className={`col-span-2 lg:col-span-1 ${data.netProfit >= 0 ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Net Profit / Loss</CardTitle>
                  {data.netProfit >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className={`text-lg sm:text-2xl font-bold ${data.netProfit >= 0 ? "text-green-600" : "text-red-600"} truncate`}>
                    {formatAmount(data.netProfit)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Rev - (Cost+Ship+Exp)
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Month-wise Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {!data.monthlyData || data.monthlyData.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No data available for this period.</div>
                ) : (
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Costs (Prod+Ship)</TableHead>
                          <TableHead className="text-right">Expenses</TableHead>
                          <TableHead className="text-right font-bold">Profit/Loss</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.monthlyData.map((m: any) => (
                          <TableRow key={m.month}>
                            <TableCell className="font-medium">
                              {format(parseISO(`${m.month}-01`), "MMMM yyyy")}
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                              {formatAmount(m.revenue)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatAmount(m.cost + m.shippingCost)}
                            </TableCell>
                            <TableCell className="text-right text-orange-600">
                              {formatAmount(m.expense)}
                            </TableCell>
                            <TableCell className={`text-right font-bold ${m.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatAmount(m.profit)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={showProductCostBreakdown} onOpenChange={setShowProductCostBreakdown}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Product Cost Breakdown</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  {!data.productCostBreakdown || data.productCostBreakdown.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No product costs found for this period.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Order #</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Cost</TableHead>
                          <TableHead className="text-right font-bold">Total Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.productCostBreakdown.map((item: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs text-muted-foreground">
                              {format(new Date(item.date), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="font-medium text-xs">{item.orderNumber}</TableCell>
                            <TableCell className="text-xs">{item.productName}</TableCell>
                            <TableCell className="text-right text-xs">{item.quantity}</TableCell>
                            <TableCell className="text-right text-xs">{formatAmount(item.costPrice)}</TableCell>
                            <TableCell className="text-right font-bold text-xs">{formatAmount(item.totalItemCost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </DialogContent>
            </Dialog>

          </div>
        ) : (
          <div>Failed to load reports.</div>
        )}
      </div>
    </div>
  );
}

function TruckIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 17h4V5H2v12h3" />
      <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5" />
      <path d="M14 17h1" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}
