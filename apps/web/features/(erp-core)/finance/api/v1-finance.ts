"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type ApiOk<T> = { success: true; data: T }

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccountType = 'CASH' | 'BANK' | 'MOBILE_BANKING' | 'DIGITAL_WALLET'
export type TransactionType = 'SALE' | 'PURCHASE_PAYMENT' | 'CUSTOMER_PAYMENT' | 'REFUND' | 'EXPENSE' | 'WALLET_CREDIT' | 'WALLET_DEBIT' | 'ADJUSTMENT'
export type ExpenseCategory = 'RENT' | 'SALARY' | 'UTILITY' | 'TRANSPORTATION' | 'MARKETING' | 'MISCELLANEOUS' | 'OTHER'
export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type FinAccount = {
  id: string
  organizationId: string
  name: string
  type: AccountType
  openingBalance: number
  currentBalance: number
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

export type FinTransaction = {
  id: string
  organizationId: string
  accountId: string
  type: TransactionType
  amount: number
  referenceType: string | null
  referenceId: string | null
  note: string | null
  createdAt: string
}

export type FinTransactionWithRunning = FinTransaction & { runningBalance: number }

export type FinExpense = {
  id: string
  organizationId: string
  category: ExpenseCategory
  title: string
  amount: number
  accountId: string | null
  status: ExpenseStatus
  approvedBy: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type FinanceSummary = {
  totalBalance: number
  totalIncome: number
  totalExpenses: number
  netProfit: number
  pendingExpenseCount: number
  accounts: FinAccount[]
}

export type PnL = {
  income: number
  expenses: number
  netProfit: number
  from: string | null
  to: string | null
}

export type SupplierDue = {
  supplierId: string
  supplierName: string
  phone: string
  totalPurchased: number
  totalPaid: number
  due: number
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export function useListAccounts() {
  return useQuery<FinAccount[]>({
    queryKey: ["v1", "accounts"],
    queryFn: async () => {
      const res = await fetch("/api/v1/accounts")
      if (!res.ok) throw new Error("Failed to fetch accounts")
      return (await res.json() as ApiOk<FinAccount[]>).data
    },
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; type: AccountType; openingBalance?: number }) => {
      const res = await fetch("/api/v1/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create account")
      }
      return (await res.json() as ApiOk<FinAccount>).data
    },
    onSuccess: () => {
      toast.success("Account created")
      qc.invalidateQueries({ queryKey: ["v1", "accounts"] })
      qc.invalidateQueries({ queryKey: ["v1", "finance"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; status?: 'ACTIVE' | 'INACTIVE' }) => {
      const res = await fetch(`/api/v1/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to update account")
      }
      return (await res.json() as ApiOk<FinAccount>).data
    },
    onSuccess: () => {
      toast.success("Account updated")
      qc.invalidateQueries({ queryKey: ["v1", "accounts"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function useListTransactions(filters?: { accountId?: string; type?: TransactionType; from?: string; to?: string }) {
  return useQuery<FinTransaction[]>({
    queryKey: ["v1", "transactions", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.accountId) params.set("accountId", filters.accountId)
      if (filters?.type) params.set("type", filters.type)
      if (filters?.from) params.set("from", filters.from)
      if (filters?.to) params.set("to", filters.to)
      const query = params.toString() ? `?${params.toString()}` : ""
      const res = await fetch(`/api/v1/transactions${query}`)
      if (!res.ok) throw new Error("Failed to fetch transactions")
      return (await res.json() as ApiOk<FinTransaction[]>).data
    },
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      accountId: string
      type: TransactionType
      amount: number
      referenceType?: string
      referenceId?: string
      note?: string
    }) => {
      const res = await fetch("/api/v1/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create transaction")
      }
      return (await res.json() as ApiOk<FinTransaction>).data
    },
    onSuccess: () => {
      toast.success("Transaction recorded")
      qc.invalidateQueries({ queryKey: ["v1", "transactions"] })
      qc.invalidateQueries({ queryKey: ["v1", "accounts"] })
      qc.invalidateQueries({ queryKey: ["v1", "finance"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export function useListExpenses(status?: ExpenseStatus, category?: ExpenseCategory) {
  return useQuery<FinExpense[]>({
    queryKey: ["v1", "expenses", status ?? "all", category ?? "all"],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (status) params.set("status", status)
      if (category) params.set("category", category)
      const query = params.toString() ? `?${params.toString()}` : ""
      const res = await fetch(`/api/v1/expenses${query}`)
      if (!res.ok) throw new Error("Failed to fetch expenses")
      return (await res.json() as ApiOk<FinExpense[]>).data
    },
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      category: ExpenseCategory
      title: string
      amount: number
      accountId?: string
      notes?: string
    }) => {
      const res = await fetch("/api/v1/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create expense")
      }
      return (await res.json() as ApiOk<FinExpense>).data
    },
    onSuccess: () => {
      toast.success("Expense created")
      qc.invalidateQueries({ queryKey: ["v1", "expenses"] })
      qc.invalidateQueries({ queryKey: ["v1", "finance"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useApproveExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/expenses/${id}/approve`, { method: "POST" })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to approve expense")
      }
      return (await res.json() as ApiOk<FinExpense>).data
    },
    onSuccess: () => {
      toast.success("Expense approved — account debited")
      qc.invalidateQueries({ queryKey: ["v1", "expenses"] })
      qc.invalidateQueries({ queryKey: ["v1", "accounts"] })
      qc.invalidateQueries({ queryKey: ["v1", "finance"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useRejectExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/expenses/${id}/reject`, { method: "POST" })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to reject expense")
      }
      return (await res.json() as ApiOk<FinExpense>).data
    },
    onSuccess: () => {
      toast.success("Expense rejected")
      qc.invalidateQueries({ queryKey: ["v1", "expenses"] })
      qc.invalidateQueries({ queryKey: ["v1", "finance"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export function useFinanceSummary() {
  return useQuery<FinanceSummary>({
    queryKey: ["v1", "finance", "summary"],
    queryFn: async () => {
      const res = await fetch("/api/v1/finance/summary")
      if (!res.ok) throw new Error("Failed to fetch finance summary")
      return (await res.json() as ApiOk<FinanceSummary>).data
    },
  })
}

export function usePnL(from?: string, to?: string) {
  return useQuery<PnL>({
    queryKey: ["v1", "finance", "pnl", from ?? "all", to ?? "all"],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (from) params.set("from", from)
      if (to) params.set("to", to)
      const query = params.toString() ? `?${params.toString()}` : ""
      const res = await fetch(`/api/v1/finance/pnl${query}`)
      if (!res.ok) throw new Error("Failed to fetch P&L")
      return (await res.json() as ApiOk<PnL>).data
    },
  })
}

export function useCashBook(accountId?: string, from?: string, to?: string) {
  return useQuery<FinTransactionWithRunning[]>({
    queryKey: ["v1", "finance", "cash-book", accountId ?? "all", from ?? "all", to ?? "all"],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (accountId) params.set("accountId", accountId)
      if (from) params.set("from", from)
      if (to) params.set("to", to)
      const query = params.toString() ? `?${params.toString()}` : ""
      const res = await fetch(`/api/v1/finance/cash-book${query}`)
      if (!res.ok) throw new Error("Failed to fetch cash book")
      return (await res.json() as ApiOk<FinTransactionWithRunning[]>).data
    },
  })
}

export function useSupplierDues() {
  return useQuery<SupplierDue[]>({
    queryKey: ["v1", "finance", "supplier-due"],
    queryFn: async () => {
      const res = await fetch("/api/v1/finance/supplier-due")
      if (!res.ok) throw new Error("Failed to fetch supplier dues")
      return (await res.json() as ApiOk<SupplierDue[]>).data
    },
  })
}
