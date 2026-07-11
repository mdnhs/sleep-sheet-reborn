"use client";

import { useState } from "react";
import { useGetExpenses, useGetExpenseCategories, useCreateExpense, useCreateExpenseCategory, useDeleteExpense } from "@/features/expenses/api/use-expenses";
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
import { format } from "date-fns";
import { Plus, Trash2, Loader2, DollarSign } from "lucide-react";
import { ConfirmDialog } from "@/components/conform-dialouge";

export default function ExpensesClientPage() {
  const { data: expenses, isLoading: expensesLoading } = useGetExpenses();
  const { data: categories, isLoading: categoriesLoading } = useGetExpenseCategories();
  
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
    if (!categoryName) return;

    createCategory.mutate(
      { name: categoryName },
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

  const totalExpenses = expenses?.reduce((acc: number, exp: any) => acc + exp.amount, 0) || 0;

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
                          ? categories?.find((c: any) => c.id === expenseCategoryId)?.name 
                          : "Select a category"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat: any) => (
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expensesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : !expenses || expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No expenses recorded yet.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense: any) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.date), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                          {expense.category?.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{expense.note || "-"}</TableCell>
                      <TableCell className="text-right font-medium">৳{expense.amount.toLocaleString()}</TableCell>
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
