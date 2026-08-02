"use client";

import { useState } from "react";
import { useGetReports } from "@/features/reports/api/use-get-reports";
import { useGetMonthlyReports } from "@/features/reports/api/use-get-monthly-reports";
import { useCurrency } from "@/hooks/use-currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { type DateRange } from "react-day-picker";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Package, Receipt, Truck, ChevronLeft, ChevronRight } from "lucide-react";
import { subDays, subMonths, startOfDay, endOfDay, startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import React from "react";

import { Skeleton } from "@/components/ui/skeleton";

type FilterType = "all" | "today" | "week" | "month" | "last_month" | "custom";

function PaginatedTable<T>({
  data,
  renderHeader,
  renderRow,
  pageSize = 10,
}: {
  data: T[];
  renderHeader: () => React.ReactNode;
  renderRow: (item: T, index: number) => React.ReactNode;
  pageSize?: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / pageSize);

  const startIndex = (currentPage - 1) * pageSize;
  const currentData = data.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>{renderHeader()}</TableHeader>
          <TableBody>
            {currentData.map((item, index) => (
              <React.Fragment key={index}>{renderRow(item, startIndex + index)}</React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages} ({data.length} total)
          </p>
          <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg h-8 px-2.5 text-xs"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            {(() => {
              const pages: (number | string)[] = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (currentPage > 3) pages.push("...");

                const start = Math.max(2, currentPage - 1);
                const end = Math.min(totalPages - 1, currentPage + 1);

                for (let i = start; i <= end; i++) {
                  if (!pages.includes(i)) pages.push(i);
                }

                if (currentPage < totalPages - 2) pages.push("...");
                pages.push(totalPages);
              }

              return pages.map((p, idx) =>
                typeof p === "number" ? (
                  <Button
                    key={idx}
                    variant={currentPage === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(p)}
                    className={cn(
                      "rounded-lg h-8 w-8 p-0 text-xs font-semibold shrink-0",
                      currentPage === p && "pointer-events-none"
                    )}
                  >
                    {p}
                  </Button>
                ) : (
                  <span key={idx} className="px-1 text-xs text-muted-foreground shrink-0">
                    {p}
                  </span>
                )
              );
            })()}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg h-8 px-2.5 text-xs"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const { formatAmount } = useCurrency();
  const [activeFilter, setActiveFilter] = useState<FilterType>("today");
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>(() => {
    const today = new Date();
    return {
      from: startOfDay(today).toISOString(),
      to: endOfDay(today).toISOString(),
    };
  });

  const [showProductCostBreakdown, setShowProductCostBreakdown] = useState(false);
  const [showRevenueBreakdown, setShowRevenueBreakdown] = useState(false);
  const [showShippingBreakdown, setShowShippingBreakdown] = useState(false);
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);

  const { data, isLoading } = useGetReports(dateRange);
  const { data: monthlyReportsData, isLoading: isMonthlyLoading } = useGetMonthlyReports();

  const handleFilter = (type: FilterType) => {
    setActiveFilter(type);
    setCustomRange(undefined);
    const today = new Date();
    switch (type) {
      case "all":
        setDateRange({});
        break;
      case "today":
        setDateRange({
          from: startOfDay(today).toISOString(),
          to: endOfDay(today).toISOString(),
        });
        break;
      case "week":
        setDateRange({
          from: startOfDay(subDays(today, 6)).toISOString(),
          to: endOfDay(today).toISOString(),
        });
        break;
      case "month":
        setDateRange({
          from: startOfMonth(today).toISOString(),
          to: endOfMonth(today).toISOString(),
        });
        break;
      case "last_month": {
        const lastMonth = subMonths(today, 1);
        setDateRange({
          from: startOfMonth(lastMonth).toISOString(),
          to: endOfMonth(lastMonth).toISOString(),
        });
        break;
      }
    }
  };

  const handleCustomRangeChange = (range: DateRange | undefined) => {
    setCustomRange(range);
    if (range?.from && range?.to) {
      setActiveFilter("custom");
      setDateRange({
        from: startOfDay(range.from).toISOString(),
        to: endOfDay(range.to).toISOString(),
      });
    } else if (range?.from) {
      setActiveFilter("custom");
      setDateRange({
        from: startOfDay(range.from).toISOString(),
        to: endOfDay(range.from).toISOString(),
      });
    } else {
      setActiveFilter("all");
      setDateRange({});
    }
  };

  const filterButtons: { type: FilterType; label: string }[] = [
    { type: "all", label: "All Time" },
    { type: "today", label: "Today" },
    { type: "week", label: "Last 7 Days" },
    { type: "month", label: "This Month" },
    { type: "last_month", label: "Last Month" },
  ];

  const profitMargin =
    data && data.totalRevenue > 0
      ? ((data.netProfit / data.totalRevenue) * 100).toFixed(1)
      : null;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Reports & Profit/Loss</h2>
          <div className="flex flex-wrap items-center gap-2">
            {filterButtons.map(({ type, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => handleFilter(type)}
                className={cn(
                  "rounded-full text-xs font-semibold px-3.5 h-8 transition-colors cursor-pointer flex items-center justify-center select-none",
                  activeFilter === type
                    ? "bg-slate-900 text-white hover:bg-slate-800 hover:text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:hover:text-slate-900"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                )}
              >
                {label}
              </button>
            ))}
            <DateRangePicker value={customRange} onChange={handleCustomRangeChange} />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
              <Skeleton className="h-28 rounded-3xl" />
              <Skeleton className="h-28 rounded-3xl" />
              <Skeleton className="h-28 rounded-3xl" />
              <Skeleton className="h-28 rounded-3xl" />
              <Skeleton className="h-28 rounded-3xl col-span-2 lg:col-span-1" />
            </div>
            <div className="rounded-3xl bg-white dark:bg-card p-4 sm:p-6 border-none shadow-none space-y-4">
              <Skeleton className="h-6 w-48 rounded-xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
              <div 
                className="rounded-3xl bg-white dark:bg-card border-none shadow-none p-4 sm:p-6 flex flex-col justify-between min-h-[120px] sm:min-h-[136px] cursor-pointer hover:bg-slate-50 dark:hover:bg-muted/40 transition-all"
                onClick={() => setShowRevenueBreakdown(true)}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1">Total Net Sale</span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#EBF7EE] dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                    <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="mt-2.5 mb-1">
                  <div className="text-base sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 truncate">
                    {formatAmount(data.totalRevenue)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1 truncate">
                    Gross ({formatAmount(data.grossSales || 0)}) - Cancel ({formatAmount(data.cancelledAmount || 0)})
                  </p>
                </div>
              </div>

              <div
                className="rounded-3xl bg-white dark:bg-card border-none shadow-none p-4 sm:p-6 flex flex-col justify-between min-h-[120px] sm:min-h-[136px] cursor-pointer hover:bg-slate-50 dark:hover:bg-muted/40 transition-all"
                onClick={() => setShowProductCostBreakdown(true)}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1">Product Bought Cost</span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#F3EFEF] dark:bg-purple-950/40 flex items-center justify-center shrink-0">
                    <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="mt-2.5 mb-1">
                  <div className="text-base sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400 truncate">
                    {formatAmount(data.totalCost)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1 truncate">
                    Gross ({formatAmount(data.grossCost || 0)}) - Cancel ({formatAmount(data.cancelledCost || 0)})
                  </p>
                </div>
              </div>

              <div
                className="rounded-3xl bg-white dark:bg-card border-none shadow-none p-4 sm:p-6 flex flex-col justify-between min-h-[120px] sm:min-h-[136px] cursor-pointer hover:bg-slate-50 dark:hover:bg-muted/40 transition-all"
                onClick={() => setShowShippingBreakdown(true)}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1">Delivery Charge</span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#EFF6FF] dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                    <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-2.5 mb-1">
                  <div className="text-base sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400 truncate">
                    {formatAmount(data.totalShippingCost)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1 truncate">Courier shipping costs</p>
                </div>
              </div>

              <div
                className="rounded-3xl bg-white dark:bg-card border-none shadow-none p-4 sm:p-6 flex flex-col justify-between min-h-[120px] sm:min-h-[136px] cursor-pointer hover:bg-slate-50 dark:hover:bg-muted/40 transition-all"
                onClick={() => setShowExpenseBreakdown(true)}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1">Total Expense</span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FFF7ED] dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                    <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="mt-2.5 mb-1">
                  <div className="text-base sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-orange-600 dark:text-orange-400 truncate">
                    {formatAmount(data.totalExpense || 0)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1 truncate">Operating expenses</p>
                </div>
              </div>

              <div className="rounded-3xl bg-white dark:bg-card border-none shadow-none p-4 sm:p-6 flex flex-col justify-between min-h-[120px] sm:min-h-[136px] col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1">Net Profit / Loss</span>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${data.netProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-rose-50 dark:bg-rose-950/40"} flex items-center justify-center shrink-0`}>
                    {data.netProfit >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-600 dark:text-rose-400" />
                    )}
                  </div>
                </div>
                <div className="mt-2.5 mb-1">
                  <div className={`text-base sm:text-2xl lg:text-3xl font-extrabold tracking-tight ${data.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"} truncate`}>
                    {formatAmount(data.netProfit)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1 truncate">
                    {profitMargin !== null ? `${profitMargin}% margin · ` : ""}Net Sales - Costs
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white dark:bg-card p-4 sm:p-6 border-none shadow-none space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Month-wise Breakdown</h3>
              <div>
                {isMonthlyLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !monthlyReportsData?.monthlyData || monthlyReportsData.monthlyData.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No monthly data available.</div>
                ) : (
                  (() => {
                    const monthlyList = monthlyReportsData.monthlyData;
                    const monthlyTotals = monthlyList.reduce(
                      (acc, m) => ({
                        revenue: acc.revenue + m.revenue,
                        cost: acc.cost + m.cost,
                        shippingCost: acc.shippingCost + m.shippingCost,
                        expense: acc.expense + m.expense,
                        profit: acc.profit + m.profit,
                      }),
                      { revenue: 0, cost: 0, shippingCost: 0, expense: 0, profit: 0 }
                    );

                    return (
                      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                        <Table>
                          <TableHeader className="bg-slate-50/70 dark:bg-muted/30">
                            <TableRow>
                              <TableHead className="font-bold text-slate-700 dark:text-slate-300">Month</TableHead>
                              <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">Sales (Net)</TableHead>
                              <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">Costs (Product + Delivery)</TableHead>
                              <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">Expenses</TableHead>
                              <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">Net Profit/Loss</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {monthlyList.map((m) => (
                              <TableRow key={m.month} className="hover:bg-slate-50/50 dark:hover:bg-muted/40">
                                <TableCell className="font-medium">
                                  {format(parseISO(`${m.month}-01`), "MMMM yyyy")}
                                </TableCell>
                                <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {formatAmount(m.revenue)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground font-semibold">
                                  {formatAmount(m.cost + m.shippingCost)}
                                </TableCell>
                                <TableCell className="text-right text-orange-600 dark:text-orange-400 font-semibold">
                                  {formatAmount(m.expense)}
                                </TableCell>
                                <TableCell className={`text-right font-bold ${m.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                  {formatAmount(m.profit)}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-slate-50 dark:bg-muted/30 font-bold">
                              <TableCell>Total</TableCell>
                              <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                                {formatAmount(monthlyTotals.revenue)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatAmount(monthlyTotals.cost + monthlyTotals.shippingCost)}
                              </TableCell>
                              <TableCell className="text-right text-orange-600 dark:text-orange-400">
                                {formatAmount(monthlyTotals.expense)}
                              </TableCell>
                              <TableCell className={`text-right ${monthlyTotals.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {formatAmount(monthlyTotals.profit)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            {/* Product Cost Breakdown Dialog */}
            <Dialog open={showProductCostBreakdown} onOpenChange={setShowProductCostBreakdown}>
              <DialogContent className="sm:max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col gap-0 bg-background">
                <DialogHeader className="px-6 py-5 border-b bg-muted/20">
                  <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                    <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-500" />
                    Product Bought Cost Breakdown
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
                              <TableHead className="text-right font-medium h-10">Bought Cost</TableHead>
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

            {/* Revenue Breakdown Dialog */}
            <Dialog open={showRevenueBreakdown} onOpenChange={setShowRevenueBreakdown}>
              <DialogContent className="sm:max-w-3xl h-[85vh] p-0 overflow-hidden flex flex-col gap-0 bg-background">
                <DialogHeader className="px-6 py-5 border-b bg-muted/20">
                  <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-500" />
                    Net Revenue Breakdown
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
                              <TableHead className="text-right font-medium h-10">Net Sale Amount</TableHead>
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

            {/* Shipping Breakdown Dialog */}
            <Dialog open={showShippingBreakdown} onOpenChange={setShowShippingBreakdown}>
              <DialogContent className="sm:max-w-3xl h-[85vh] p-0 overflow-hidden flex flex-col gap-0 bg-background">
                <DialogHeader className="px-6 py-5 border-b bg-muted/20">
                  <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                    <Truck className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                    Delivery Charge Breakdown
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1">
                  <div className="p-6">
                    {!data.shippingBreakdown || data.shippingBreakdown.length === 0 ? (
                      <div className="text-sm text-muted-foreground flex items-center justify-center h-24 bg-muted/20 rounded-lg border border-dashed">
                        No delivery charges found for this period.
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
                              <TableHead className="text-right font-medium h-10">Delivery Charge</TableHead>
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

            {/* Expense Breakdown Dialog */}
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
