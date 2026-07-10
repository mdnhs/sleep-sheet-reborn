import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";

export const useGetExpenseCategories = () => {
  return useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const response = await client.api.expenses.categories.$get();
      if (!response.ok) throw new Error("Failed to fetch expense categories");
      const { data } = await response.json();
      return data;
    },
  });
};

type CreateExpenseCategoryRequest = InferRequestType<typeof client.api.expenses.categories.$post>["json"];

export const useCreateExpenseCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (json: CreateExpenseCategoryRequest) => {
      const response = await client.api.expenses.categories.$post({ json });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null) as any;
        throw new Error(errorData?.error || "Failed to create category");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Expense category created successfully");
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create category");
    },
  });
};

export const useGetExpenses = () => {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const response = await client.api.expenses.$get();
      if (!response.ok) throw new Error("Failed to fetch expenses");
      const { data } = await response.json();
      return data;
    },
  });
};

type CreateExpenseRequest = InferRequestType<typeof client.api.expenses.$post>["json"];

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (json: CreateExpenseRequest) => {
      const response = await client.api.expenses.$post({ json });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null) as any;
        throw new Error(errorData?.error || "Failed to create expense");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Expense logged successfully");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      // Update reports if we implement expense tracking in reports later
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to log expense");
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await client.api.expenses[":id"].$delete({ param: { id } });
      if (!response.ok) throw new Error("Failed to delete expense");
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Expense deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete expense");
    },
  });
};
