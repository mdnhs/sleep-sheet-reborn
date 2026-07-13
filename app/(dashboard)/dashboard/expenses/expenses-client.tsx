"use client";

import { useState } from "react";
import {
  useGetExpenses,
  useGetExpenseCategories,
  useGetExpenseSummary,
  useCreateExpense,
  useCreateExpenseCategory,
  useDeleteExpense,
  type ExpenseFilters,
} from "@/features/expenses/api/use-expenses";
import { useCurrency } from "@/hooks/use-currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, startOfDay, startOfMonth, subDays } from "date-fns";
import { Plus, Trash2, Loader2, DollarSign, CalendarDays, Tag } from "lucide-react";
import { ConfirmDialog } from "@/components/conform-dialouge";

type DateFilter = "all" | "today" | "week" | "month";

const ALL_CATEGORIES = "all";

export default function ExpensesClientPage() {
  const { formatAmount } = useCurrency();

  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);

  const buildDateRange = (type: DateFilter): Pick<ExpenseFilters, "from" | "to"> => {
    const today = new Date();
    switch (type) {
      case "today":
        return { from: startOfDay(today).toISOString(), to: today.toISOString() };
      case "week":
        return { from: startOfDay(subDays(today, 7)).toISOString(), to: today.toISOString() };
      case "month":
        return { from: startOfMonth(today).toISOString(), to: today.toISOString() };
      default:
        return {};
    }
  };

  const filters: ExpenseFilters = {
    ...buildDateRange(dateFilter),
    ...(categoryFilter !== ALL_CATEGORIES ? { categoryId: categoryFilter } : {}),
  };

  const { data: expenseData, isLoading: expensesLoading } = useGetExpenses(filters);
  const { data: categories } = useGetExpenseCategories();
  const { data: summary, isLoading: summaryLoading } = useGetExpenseSummary();

  const createExpense = useCreateExpense();
  const createCategory = useCreateExpenseCategory();
  const deleteExpense = useDeleteExpense();

  // State for Add Expense Dialog
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [expenseDate, setExpenseDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // State for Add Category Dialog
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseCategoryId || !expenseAmount) return;

    createExpense.mutate(
      {
        categoryId: expenseCategoryId,
        amount: parseFloat(expenseAmount),
        note: expenseNote,
        date: expenseDate,
      },
      {
        onSuccess: () => {
          setIsExpenseDialogOpen(false);
          setExpenseAmount("");
          setExpenseNote("");
          setExpenseCategoryId("");
          setExpenseDate(format(new Date(), "yyyy-MM-dd"));
        }
      }
    );
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    createCategory.mutate(
      { name: categoryName.trim() },
      {
        onSuccess: () => {
          setIsCategoryDialogOpen(false);
          setCategoryName("");
        }
      }
    );
  };

  const handleDelete = () => {
    if (deleteExpenseId) {
      deleteExpense.mutate(deleteExpenseId, {
        onSuccess: () => setDeleteExpenseId(null)
      });
    }
  };

  const expenses = expenseData?.data;

  const dateFilterButtons: { type: DateFilter; label: string }[] = [
    { type: "all", label: "All Time" },
    { type: "today", label: "Today" },
    { type: "week", label: "Last 7 Days" },
    { type: "month", label: "This Month" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Log and manage your business expenses</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger render={<Button variant="outline" className="gap-2" />}>
              <Plus className="h-4 w-4" />
              Add Category
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Expense Category</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddCategory} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Category Name</Label>
                  <Input
                    placeholder="e.g., Packaging, Transport"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createCategory.isPending}>
                    {createCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
            <DialogTrigger render={<Button className="gap-2" />}>
              <Plus className="h-4 w-4" />
              Log Expense
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log New Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={expenseCategoryId} onValueChange={(v) => setExpenseCategoryId(v || "")} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category">
                        {expenseCategoryId
                          ? categories?.find((c) => c.id === expenseCategoryId)?.name
                          : "Select a category"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} label={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={expenseDate}
                    max={format(new Date(), "yyyy-MM-dd")}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Note (Optional)</Label>
                  <Input
                    placeholder="Brief description"
                    value={expenseNote}
                    onChange={(e) => setExpenseNote(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createExpense.isPending}>
                    {createExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <SummaryCard
          title="All-Time Expenses"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          value={summary ? formatAmount(summary.allTimeTotal) : undefined}
          subtitle={summary ? `${summary.allTimeCount} records` : undefined}
          loading={summaryLoading}
        />
        <SummaryCard
          title="This Month"
          icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
          value={summary ? formatAmount(summary.monthTotal) : undefined}
          subtitle={summary ? `${summary.monthCount} records` : undefined}
          loading={summaryLoading}
        />
        <SummaryCard
          title="Top Category (Month)"
          icon={<Tag className="h-4 w-4 text-muted-foreground" />}
          value={summary?.topCategory?.name ?? "—"}
          subtitle={summary?.topCategory ? formatAmount(summary.topCategory.total) : "No expenses yet"}
          loading={summaryLoading}
          className="col-span-2 md:col-span-1"
        />
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Expense History</CardTitle>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {dateFilterButtons.map(({ type, label }) => (
                <Button
                  key={type}
                  variant={dateFilter === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter(type)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="sm:ml-auto w-full sm:w-52">
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v || ALL_CATEGORIES)}>
                <SelectTrigger>
                  <SelectValue>
                    {categoryFilter === ALL_CATEGORIES
                      ? "All Categories"
                      : categories?.find((c) => c.id === categoryFilter)?.name || "All Categories"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CATEGORIES} label="All Categories">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} label={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {expensesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : !expenses || expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No expenses match these filters.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.date), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                          {expense.category?.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{expense.note || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{formatAmount(expense.amount)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteExpenseId(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={3}>
                      Total ({expenseData?.count ?? expenses.length} records)
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(expenseData?.total ?? 0)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteExpenseId}
        onOpenChange={(open) => !open && setDeleteExpenseId(null)}
        title="Delete Expense"
        description="Are you sure you want to delete this expense record? This cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}

function SummaryCard({
  title,
  icon,
  value,
  subtitle,
  loading,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  value?: string;
  subtitle?: string;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="text-2xl font-bold truncate">{value ?? "—"}</div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
