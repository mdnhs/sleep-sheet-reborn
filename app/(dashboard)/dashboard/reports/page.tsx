"use client";

import { useState } from "react";
import { useGetReports } from "@/features/reports/api/use-get-reports";
import { useCurrency } from "@/hooks/use-currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Package, Receipt, Truck, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { subDays, startOfDay, startOfMonth, endOfMonth, format, parseISO } from "date-fns";

type FilterType = "all" | "today" | "week" | "month";

function PaginatedTable<T>({
  data,
  renderHeader,
  renderRow,
}: {
  data: T[];
  renderHeader: () => React.ReactNode;
  renderRow: (item: T, index: number) => React.ReactNode;
}) {
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.ceil(data.length / perPage);
  const paginatedData = data.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            {renderHeader()}
          </TableHeader>
          <TableBody>
            {paginatedData.map((item, i) => renderRow(item, (page - 1) * perPage + i))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, data.length)} of {data.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <div className="text-sm font-medium">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [showProductCostBreakdown, setShowProductCostBreakdown] = useState(false);
  const [showRevenueBreakdown, setShowRevenueBreakdown] = useState(false);
  const [showShippingBreakdown, setShowShippingBreakdown] = useState(false);
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);
  const { data, isLoading } = useGetReports(dateRange);
  const { formatAmount } = useCurrency();

  const handleFilter = (type: FilterType) => {
    setActiveFilter(type);
    const today = new Date();
    switch (type) {
      case "all":
        setDateRange({});
        break;
      case "today":
        setDateRange({
          from: startOfDay(today).toISOString(),
          to: today.toISOString(),
        });
        break;
      case "week":
        setDateRange({
          from: startOfDay(subDays(today, 7)).toISOString(),
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

  const filterButtons: { type: FilterType; label: string }[] = [
    { type: "all", label: "All Time" },
    { type: "today", label: "Today" },
    { type: "week", label: "Last 7 Days" },
    { type: "month", label: "This Month" },
  ];

  const profitMargin =
    data && data.totalRevenue > 0
      ? ((data.netProfit / data.totalRevenue) * 100).toFixed(1)
      : null;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-4 md:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 space-y-0">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Reports & Profit/Loss</h2>
          <div className="flex flex-wrap items-center gap-2">
            {filterButtons.map(({ type, label }) => (
              <Button
                key={type}
                variant={activeFilter === type ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilter(type)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-75 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setShowRevenueBreakdown(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold truncate">{formatAmount(data.totalRevenue)}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">From {data.orderCount} orders (Click to view)</p>
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

              <Card
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setShowShippingBreakdown(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Shipping Cost</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold truncate">{formatAmount(data.totalShippingCost)}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Courier fees (Click to view)</p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setShowExpenseBreakdown(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Expenses</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold truncate">{formatAmount(data.totalExpense || 0)}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Misc costs (Click to view)</p>
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
                    {profitMargin !== null ? `${profitMargin}% margin · ` : ""}Rev - (Cost+Ship+Exp)
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
                        {data.monthlyData.map((m) => (
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
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatAmount(data.totalRevenue)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatAmount(data.totalCost + data.totalShippingCost)}
                          </TableCell>
                          <TableCell className="text-right text-orange-600">
                            {formatAmount(data.totalExpense)}
                          </TableCell>
                          <TableCell className={`text-right ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatAmount(data.netProfit)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={showProductCostBreakdown} onOpenChange={setShowProductCostBreakdown}>
              <DialogContent className="sm:max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col gap-0 bg-background">
                <DialogHeader className="px-6 py-5 border-b bg-muted/20">
                  <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                    <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-500" />
                    Product Cost Breakdown
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1">
                  <div className="p-6">
                    {!data.productCostBreakdown || data.productCostBreakdown.length === 0 ? (
                      <div className="text-sm text-muted-foreground flex items-center justify-center h-24 bg-muted/20 rounded-lg border border-dashed">
                        No product costs found for this period.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {data.breakdownTruncated && (
                          <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-sm rounded-lg border border-amber-200 dark:border-amber-800">
                            Showing the <span className="font-semibold">{data.productCostBreakdown.length}</span> most recent entries. Narrow the date range to see older ones.
                          </div>
                        )}
                        <PaginatedTable
                          data={data.productCostBreakdown}
                          renderHeader={() => (
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="font-medium h-10 w-[120px]">Date</TableHead>
                              <TableHead className="font-medium h-10 w-[120px]">Order #</TableHead>
                              <TableHead className="font-medium h-10">Product</TableHead>
                              <TableHead className="text-right font-medium h-10">Qty</TableHead>
                              <TableHead className="text-right font-medium h-10">Unit Cost</TableHead>
                              <TableHead className="text-right font-medium h-10">Total Cost</TableHead>
                            </TableRow>
                          )}
                          renderRow={(item: any, i: number) => (
                            <TableRow key={`${item.orderId}-${i}`} className="group">
                              <TableCell className="py-3 text-muted-foreground align-middle">
                                {format(new Date(item.date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="py-3 font-medium align-middle">
                                {item.orderNumber}
                              </TableCell>
                              <TableCell className="py-3 align-middle max-w-[250px] truncate" title={item.productName}>
                                {item.productName}
                              </TableCell>
                              <TableCell className="text-right py-3 align-middle tabular-nums">
                                {item.quantity}
                              </TableCell>
                              <TableCell className="text-right py-3 align-middle tabular-nums text-muted-foreground">
                                {formatAmount(item.costPrice)}
                              </TableCell>
                              <TableCell className="text-right py-3 align-middle font-medium tabular-nums text-red-600 dark:text-red-400">
                                {formatAmount(item.totalItemCost)}
                              </TableCell>
                            </TableRow>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <Dialog open={showRevenueBreakdown} onOpenChange={setShowRevenueBreakdown}>
              <DialogContent className="sm:max-w-3xl h-[85vh] p-0 overflow-hidden flex flex-col gap-0 bg-background">
                <DialogHeader className="px-6 py-5 border-b bg-muted/20">
                  <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-500" />
                    Revenue Breakdown
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1">
                  <div className="p-6">
                    {!data.revenueBreakdown || data.revenueBreakdown.length === 0 ? (
                      <div className="text-sm text-muted-foreground flex items-center justify-center h-24 bg-muted/20 rounded-lg border border-dashed">
                        No revenue found for this period.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {data.breakdownTruncated && (
                          <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-sm rounded-lg border border-amber-200 dark:border-amber-800">
                            Showing the <span className="font-semibold">{data.revenueBreakdown.length}</span> most recent entries.
                          </div>
                        )}
                        <PaginatedTable
                          data={data.revenueBreakdown}
                          renderHeader={() => (
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="font-medium h-10 w-[120px]">Date</TableHead>
                              <TableHead className="font-medium h-10 w-[120px]">Order #</TableHead>
                              <TableHead className="text-right font-medium h-10">Revenue</TableHead>
                            </TableRow>
                          )}
                          renderRow={(item: any, i: number) => (
                            <TableRow key={`rev-${item.orderId}-${i}`} className="group">
                              <TableCell className="py-3 text-muted-foreground align-middle">
                                {format(new Date(item.date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="py-3 font-medium align-middle">
                                {item.orderNumber}
                              </TableCell>
                              <TableCell className="text-right py-3 align-middle font-medium tabular-nums text-green-600 dark:text-green-400">
                                {formatAmount(item.totalAmount)}
                              </TableCell>
                            </TableRow>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <Dialog open={showShippingBreakdown} onOpenChange={setShowShippingBreakdown}>
              <DialogContent className="sm:max-w-3xl h-[85vh] p-0 overflow-hidden flex flex-col gap-0 bg-background">
                <DialogHeader className="px-6 py-5 border-b bg-muted/20">
                  <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                    <Truck className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                    Shipping Cost Breakdown
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1">
                  <div className="p-6">
                    {!data.shippingBreakdown || data.shippingBreakdown.length === 0 ? (
                      <div className="text-sm text-muted-foreground flex items-center justify-center h-24 bg-muted/20 rounded-lg border border-dashed">
                        No shipping costs found for this period.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {data.breakdownTruncated && (
                          <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-sm rounded-lg border border-amber-200 dark:border-amber-800">
                            Showing the <span className="font-semibold">{data.shippingBreakdown.length}</span> most recent entries.
                          </div>
                        )}
                        <PaginatedTable
                          data={data.shippingBreakdown}
                          renderHeader={() => (
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="font-medium h-10 w-[120px]">Date</TableHead>
                              <TableHead className="font-medium h-10 w-[120px]">Order #</TableHead>
                              <TableHead className="text-right font-medium h-10">Shipping Cost</TableHead>
                            </TableRow>
                          )}
                          renderRow={(item: any, i: number) => (
                            <TableRow key={`ship-${item.orderId}-${i}`} className="group">
                              <TableCell className="py-3 text-muted-foreground align-middle">
                                {format(new Date(item.date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="py-3 font-medium align-middle">
                                {item.orderNumber}
                              </TableCell>
                              <TableCell className="text-right py-3 align-middle font-medium tabular-nums text-red-600 dark:text-red-400">
                                {formatAmount(item.shippingCost)}
                              </TableCell>
                            </TableRow>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <Dialog open={showExpenseBreakdown} onOpenChange={setShowExpenseBreakdown}>
              <DialogContent className="sm:max-w-3xl h-[85vh] p-0 overflow-hidden flex flex-col gap-0 bg-background">
                <DialogHeader className="px-6 py-5 border-b bg-muted/20">
                  <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                    <Receipt className="w-5 h-5 text-orange-600 dark:text-orange-500" />
                    Expense Breakdown
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1">
                  <div className="p-6">
                    {!data.expenseBreakdown || data.expenseBreakdown.length === 0 ? (
                      <div className="text-sm text-muted-foreground flex items-center justify-center h-24 bg-muted/20 rounded-lg border border-dashed">
                        No expenses found for this period.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {data.breakdownTruncated && (
                          <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-sm rounded-lg border border-amber-200 dark:border-amber-800">
                            Showing the <span className="font-semibold">{data.expenseBreakdown.length}</span> most recent entries.
                          </div>
                        )}
                        <PaginatedTable
                          data={data.expenseBreakdown}
                          renderHeader={() => (
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="font-medium h-10 w-[120px]">Date</TableHead>
                              <TableHead className="font-medium h-10 w-[150px]">Category</TableHead>
                              <TableHead className="font-medium h-10">Description</TableHead>
                              <TableHead className="text-right font-medium h-10">Amount</TableHead>
                            </TableRow>
                          )}
                          renderRow={(item: any, i: number) => (
                            <TableRow key={`exp-${item.id}-${i}`} className="group">
                              <TableCell className="py-3 text-muted-foreground align-middle">
                                {format(new Date(item.date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="py-3 font-medium align-middle">
                                {item.category}
                              </TableCell>
                              <TableCell className="py-3 align-middle text-muted-foreground max-w-[200px] truncate" title={item.description || ""}>
                                {item.description || "—"}
                              </TableCell>
                              <TableCell className="text-right py-3 align-middle font-medium tabular-nums text-red-600 dark:text-red-400">
                                {formatAmount(item.amount)}
                              </TableCell>
                            </TableRow>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </ScrollArea>
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
