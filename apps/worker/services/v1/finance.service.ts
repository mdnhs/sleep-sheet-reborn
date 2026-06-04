import type { Database } from '@repo/database'
import { createAccountsRepository } from '../../repositories/accounts.repository'
import { createTransactionsRepository } from '../../repositories/transactions.repository'
import { createExpensesRepository } from '../../repositories/expenses.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { ServiceError } from '../../utils/service-error'

export function createFinanceService(db: Database, organizationId: string) {
  const accountRepo = createAccountsRepository(db, organizationId)
  const txRepo = createTransactionsRepository(db, organizationId)
  const expenseRepo = createExpensesRepository(db, organizationId)
  const auditRepo = createAuditLogRepository(db, organizationId)

  async function assertAccount(id: string) {
    const a = await accountRepo.findById(id)
    if (!a) throw new ServiceError('Account not found', 404)
    if (a.status !== 'ACTIVE') throw new ServiceError('Account is inactive', 400)
    return a
  }

  return {
    // ── Accounts ──────────────────────────────────────────────────────────────

    async listAccounts() {
      return accountRepo.findMany()
    },

    async getAccount(id: string) {
      const a = await accountRepo.findById(id)
      if (!a) throw new ServiceError('Account not found', 404)
      return a
    },

    async createAccount(data: {
      name: string
      type: 'CASH' | 'BANK' | 'MOBILE_BANKING' | 'DIGITAL_WALLET'
      openingBalance?: number
      actorId?: string
    }) {
      const acc = await accountRepo.create({
        name: data.name,
        type: data.type,
        openingBalance: data.openingBalance ?? 0,
      })
      await auditRepo.log('account', acc.id, 'create', data.actorId, {
        name: data.name,
        type: data.type,
        openingBalance: data.openingBalance ?? 0,
      })
      return acc
    },

    async updateAccount(id: string, data: { name?: string; status?: 'ACTIVE' | 'INACTIVE'; actorId?: string }) {
      await assertAccount(id)
      const updated = await accountRepo.update(id, { name: data.name, status: data.status })
      return updated
    },

    // ── Transactions ──────────────────────────────────────────────────────────

    async listTransactions(filters?: {
      accountId?: string
      type?: string
      from?: string
      to?: string
    }) {
      return txRepo.findMany({
        accountId: filters?.accountId,
        type: filters?.type as any,
        from: filters?.from ? new Date(filters.from) : undefined,
        to: filters?.to ? new Date(filters.to) : undefined,
      })
    },

    async createTransaction(data: {
      accountId: string
      type: 'SALE' | 'PURCHASE_PAYMENT' | 'CUSTOMER_PAYMENT' | 'REFUND' | 'EXPENSE' | 'WALLET_CREDIT' | 'WALLET_DEBIT' | 'ADJUSTMENT'
      amount: number
      referenceType?: string
      referenceId?: string
      note?: string
      actorId?: string
    }) {
      await assertAccount(data.accountId)
      if (data.amount === 0) throw new ServiceError('Transaction amount cannot be zero', 400)

      const tx = await txRepo.create({
        accountId: data.accountId,
        type: data.type,
        amount: data.amount,
        referenceType: data.referenceType ?? null,
        referenceId: data.referenceId ?? null,
        note: data.note ?? null,
      })

      await accountRepo.adjustBalance(data.accountId, data.amount)

      return tx
    },

    // ── Expenses ──────────────────────────────────────────────────────────────

    async listExpenses(status?: string, category?: string) {
      return expenseRepo.findMany(status as any, category as any)
    },

    async getExpense(id: string) {
      const e = await expenseRepo.findById(id)
      if (!e) throw new ServiceError('Expense not found', 404)
      return e
    },

    async createExpense(data: {
      category: 'RENT' | 'SALARY' | 'UTILITY' | 'TRANSPORTATION' | 'MARKETING' | 'MISCELLANEOUS' | 'OTHER'
      title: string
      amount: number
      accountId?: string
      notes?: string
      actorId?: string
    }) {
      if (data.amount <= 0) throw new ServiceError('Expense amount must be positive', 400)

      if (data.accountId) {
        const acc = await accountRepo.findById(data.accountId)
        if (!acc) throw new ServiceError('Account not found', 404)
      }

      const exp = await expenseRepo.create({
        category: data.category,
        title: data.title,
        amount: data.amount,
        accountId: data.accountId ?? null,
        status: 'PENDING',
        approvedBy: null,
        notes: data.notes ?? null,
      })

      await auditRepo.log('expense', exp.id, 'create', data.actorId, {
        category: data.category,
        title: data.title,
        amount: data.amount,
      })

      return exp
    },

    async approveExpense(id: string, actorId: string) {
      const exp = await expenseRepo.findById(id)
      if (!exp) throw new ServiceError('Expense not found', 404)
      if (exp.status !== 'PENDING') throw new ServiceError('Only pending expenses can be approved', 400)

      // Create debit transaction if account is set
      if (exp.accountId) {
        await this.createTransaction({
          accountId: exp.accountId,
          type: 'EXPENSE',
          amount: -exp.amount,
          referenceType: 'expense',
          referenceId: id,
          note: `${exp.category}: ${exp.title}`,
          actorId,
        })
      }

      const updated = await expenseRepo.update(id, { status: 'APPROVED', approvedBy: actorId })
      await auditRepo.log('expense', id, 'approve', actorId, { amount: exp.amount })
      return updated
    },

    async rejectExpense(id: string, actorId: string) {
      const exp = await expenseRepo.findById(id)
      if (!exp) throw new ServiceError('Expense not found', 404)
      if (exp.status !== 'PENDING') throw new ServiceError('Only pending expenses can be rejected', 400)

      const updated = await expenseRepo.update(id, { status: 'REJECTED', approvedBy: actorId })
      await auditRepo.log('expense', id, 'reject', actorId, {})
      return updated
    },

    // ── Reports ───────────────────────────────────────────────────────────────

    async getSummary() {
      const [accounts, totalIncome, totalExpenses, pendingExpenses] = await Promise.all([
        accountRepo.findMany(),
        txRepo.totalIncome(),
        txRepo.totalExpenses(),
        expenseRepo.findMany('PENDING'),
      ])

      const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0)
      const netProfit = totalIncome - totalExpenses

      return {
        totalBalance,
        totalIncome,
        totalExpenses,
        netProfit,
        pendingExpenseCount: pendingExpenses.length,
        accounts,
      }
    },

    async getPnL(from?: string, to?: string) {
      const fromDate = from ? new Date(from) : undefined
      const toDate = to ? new Date(to) : undefined

      const [income, expenses] = await Promise.all([
        txRepo.totalIncome(fromDate, toDate),
        txRepo.totalExpenses(fromDate, toDate),
      ])

      return {
        income,
        expenses,
        netProfit: income - expenses,
        from: from ?? null,
        to: to ?? null,
      }
    },

    async getCashBook(accountId?: string, from?: string, to?: string) {
      const transactions = await txRepo.findMany({
        accountId,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      })

      // Compute running balance
      let running = 0
      const withRunning = [...transactions].reverse().map(t => {
        running += t.amount
        return { ...t, runningBalance: running }
      }).reverse()

      return withRunning
    },
  }
}
