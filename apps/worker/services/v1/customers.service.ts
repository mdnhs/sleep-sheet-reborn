import type { Database, Customer } from '@repo/database'
import { createCustomersRepository } from '../../repositories/customers.repository'
import { createCustomerGroupsRepository } from '../../repositories/customer-groups.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { ServiceError } from '../../utils/service-error'

const BLOCKED_STATES: Customer['status'][] = ['BLOCKED', 'ARCHIVED']

export function createCustomersService(db: Database, organizationId: string) {
  const repo = createCustomersRepository(db, organizationId)
  const groupRepo = createCustomerGroupsRepository(db, organizationId)
  const auditRepo = createAuditLogRepository(db, organizationId)

  async function requireCustomer(id: string) {
    const c = await repo.findById(id)
    if (!c) throw new ServiceError('Customer not found', 404)
    return c
  }

  return {
    // ── Groups ────────────────────────────────────────────────────────────────────

    listGroups(status?: string) { return groupRepo.findMany(status as any) },

    async createGroup(data: { name: string; discountPercent?: number; actorId?: string }) {
      if (await groupRepo.findByName(data.name)) {
        throw new ServiceError('A group with this name already exists', 409)
      }
      const pct = data.discountPercent ?? 0
      if (pct < 0 || pct > 100) throw new ServiceError('discountPercent must be 0-100', 400)
      const g = await groupRepo.create({ name: data.name, discountPercent: pct })
      await auditRepo.log('customer_group', g.id, 'create', data.actorId, { name: data.name })
      return g
    },

    async updateGroup(id: string, data: { name?: string; discountPercent?: number; status?: 'ACTIVE' | 'INACTIVE'; actorId?: string }) {
      const existing = await groupRepo.findById(id)
      if (!existing) throw new ServiceError('Group not found', 404)
      if (data.name && data.name !== existing.name) {
        const dup = await groupRepo.findByName(data.name)
        if (dup) throw new ServiceError('A group with this name already exists', 409)
      }
      if (data.discountPercent != null && (data.discountPercent < 0 || data.discountPercent > 100)) {
        throw new ServiceError('discountPercent must be 0-100', 400)
      }
      return groupRepo.update(id, data)
    },

    // ── Customers ─────────────────────────────────────────────────────────────────

    listCustomers(opts?: { status?: string; groupId?: string; search?: string }) {
      return repo.findMany({ status: opts?.status as any, groupId: opts?.groupId, search: opts?.search })
    },

    async getCustomer(id: string) {
      const c = await requireCustomer(id)
      const stats = await repo.getPurchaseStats(id)
      const addresses = await repo.findAddresses(id)
      return { ...c, stats, addresses }
    },

    async createCustomer(data: {
      name: string; phone: string; email?: string; groupId?: string
      type?: Customer['type']; dateOfBirth?: string; notes?: string; actorId?: string
    }) {
      if (await repo.findByPhone(data.phone)) {
        throw new ServiceError('A customer with this phone already exists', 409)
      }
      if (data.groupId && !(await groupRepo.findById(data.groupId))) {
        throw new ServiceError('Customer group not found', 404)
      }
      const c = await repo.create({
        name: data.name, phone: data.phone, email: data.email ?? null,
        groupId: data.groupId ?? null, type: data.type,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        notes: data.notes ?? null,
      })
      await auditRepo.log('customer', c.id, 'create', data.actorId, { name: data.name, phone: data.phone })
      return c
    },

    async updateCustomer(id: string, data: {
      name?: string; phone?: string; email?: string | null; groupId?: string | null
      type?: Customer['type']; dateOfBirth?: string | null; notes?: string | null; actorId?: string
    }) {
      const existing = await requireCustomer(id)
      if (data.phone && data.phone !== existing.phone) {
        const dup = await repo.findByPhone(data.phone)
        if (dup) throw new ServiceError('A customer with this phone already exists', 409)
      }
      if (data.groupId && !(await groupRepo.findById(data.groupId))) {
        throw new ServiceError('Customer group not found', 404)
      }
      const patch: Record<string, unknown> = { ...data }
      delete patch.actorId
      if (data.dateOfBirth !== undefined) patch.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null
      const updated = await repo.update(id, patch as any)
      await auditRepo.log('customer', id, 'update', data.actorId, { fields: Object.keys(patch) })
      return updated
    },

    /** Status transitions: block / unblock / archive. Customers are never hard-deleted. */
    async setStatus(id: string, status: Customer['status'], actorId?: string) {
      await requireCustomer(id)
      const updated = await repo.update(id, { status })
      await auditRepo.log('customer', id, status === 'BLOCKED' ? 'block' : 'status', actorId, { status })
      return updated
    },

    // ── Addresses ─────────────────────────────────────────────────────────────────

    async listAddresses(customerId: string) {
      await requireCustomer(customerId)
      return repo.findAddresses(customerId)
    },

    async addAddress(customerId: string, data: {
      type?: 'BILLING' | 'SHIPPING'; name?: string; phone?: string
      addressLine: string; area?: string; city?: string; postalCode?: string; isDefault?: boolean
    }) {
      await requireCustomer(customerId)
      return repo.createAddress({
        customerId, type: data.type ?? 'SHIPPING', name: data.name ?? null, phone: data.phone ?? null,
        addressLine: data.addressLine, area: data.area ?? null, city: data.city ?? null,
        postalCode: data.postalCode ?? null, isDefault: data.isDefault ?? false,
      })
    },

    // ── Wallet ──────────────────────────────────────────────────────────────────
    // Balance never mutated directly — every change writes an immutable transaction.

    async getWallet(customerId: string) {
      const c = await requireCustomer(customerId)
      const transactions = await repo.findWalletTransactions(customerId)
      return { balance: c.walletBalance, transactions }
    },

    async creditWallet(customerId: string, data: { amount: number; source?: string; note?: string; referenceType?: string; referenceId?: string; actorId?: string }) {
      const c = await requireCustomer(customerId)
      if (data.amount <= 0) throw new ServiceError('Credit amount must be positive', 400)
      const balanceAfter = c.walletBalance + data.amount
      await repo.adjustWalletBalance(customerId, data.amount)
      const txn = await repo.createWalletTransaction({
        customerId, type: 'CREDIT', amount: data.amount, balanceAfter,
        source: (data.source as any) ?? 'MANUAL', referenceType: data.referenceType ?? null,
        referenceId: data.referenceId ?? null, note: data.note ?? null,
      })
      await auditRepo.log('customer', customerId, 'wallet_credit', data.actorId, { amount: data.amount, balanceAfter })
      return txn
    },

    async debitWallet(customerId: string, data: { amount: number; source?: string; note?: string; referenceType?: string; referenceId?: string; actorId?: string }) {
      const c = await requireCustomer(customerId)
      if (BLOCKED_STATES.includes(c.status)) throw new ServiceError(`Customer is ${c.status} and cannot use wallet`, 400)
      if (data.amount <= 0) throw new ServiceError('Debit amount must be positive', 400)
      if (data.amount > c.walletBalance) throw new ServiceError('Insufficient wallet balance', 400)
      const balanceAfter = c.walletBalance - data.amount
      await repo.adjustWalletBalance(customerId, -data.amount)
      const txn = await repo.createWalletTransaction({
        customerId, type: 'DEBIT', amount: data.amount, balanceAfter,
        source: (data.source as any) ?? 'MANUAL', referenceType: data.referenceType ?? null,
        referenceId: data.referenceId ?? null, note: data.note ?? null,
      })
      await auditRepo.log('customer', customerId, 'wallet_debit', data.actorId, { amount: data.amount, balanceAfter })
      return txn
    },

    // ── Loyalty ─────────────────────────────────────────────────────────────────

    async getLoyalty(customerId: string) {
      const c = await requireCustomer(customerId)
      const transactions = await repo.findLoyaltyTransactions(customerId)
      return { points: c.loyaltyPoints, transactions }
    },

    async earnPoints(customerId: string, data: { points: number; source?: string; note?: string; referenceType?: string; referenceId?: string; actorId?: string }) {
      const c = await requireCustomer(customerId)
      if (data.points <= 0) throw new ServiceError('Points must be positive', 400)
      const balanceAfter = c.loyaltyPoints + data.points
      await repo.adjustLoyaltyPoints(customerId, data.points)
      const txn = await repo.createLoyaltyTransaction({
        customerId, type: 'EARN', points: data.points, balanceAfter,
        source: (data.source as any) ?? 'MANUAL', referenceType: data.referenceType ?? null,
        referenceId: data.referenceId ?? null, note: data.note ?? null,
      })
      await auditRepo.log('customer', customerId, 'loyalty_earn', data.actorId, { points: data.points, balanceAfter })
      return txn
    },

    async redeemPoints(customerId: string, data: { points: number; note?: string; referenceType?: string; referenceId?: string; actorId?: string }) {
      const c = await requireCustomer(customerId)
      if (BLOCKED_STATES.includes(c.status)) throw new ServiceError(`Customer is ${c.status} and cannot redeem points`, 400)
      if (data.points <= 0) throw new ServiceError('Points must be positive', 400)
      if (data.points > c.loyaltyPoints) throw new ServiceError('Insufficient loyalty points', 400)
      const balanceAfter = c.loyaltyPoints - data.points
      await repo.adjustLoyaltyPoints(customerId, -data.points)
      const txn = await repo.createLoyaltyTransaction({
        customerId, type: 'REDEEM', points: data.points, balanceAfter,
        source: 'MANUAL', referenceType: data.referenceType ?? null,
        referenceId: data.referenceId ?? null, note: data.note ?? null,
      })
      await auditRepo.log('customer', customerId, 'loyalty_redeem', data.actorId, { points: data.points, balanceAfter })
      return txn
    },

    /** Reverse earned points (e.g. order returned). Clamps to available balance. */
    async reversePoints(customerId: string, data: { points: number; note?: string; referenceType?: string; referenceId?: string; actorId?: string }) {
      const c = await requireCustomer(customerId)
      if (data.points <= 0) throw new ServiceError('Points must be positive', 400)
      const toReverse = Math.min(data.points, c.loyaltyPoints)
      const balanceAfter = c.loyaltyPoints - toReverse
      if (toReverse > 0) await repo.adjustLoyaltyPoints(customerId, -toReverse)
      const txn = await repo.createLoyaltyTransaction({
        customerId, type: 'REVERSE', points: toReverse, balanceAfter,
        source: 'RETURN', referenceType: data.referenceType ?? null,
        referenceId: data.referenceId ?? null, note: data.note ?? null,
      })
      await auditRepo.log('customer', customerId, 'loyalty_reverse', data.actorId, { points: toReverse, balanceAfter })
      return txn
    },

    // ── Purchase history + analytics ───────────────────────────────────────────────

    async getPurchaseHistory(customerId: string) {
      await requireCustomer(customerId)
      const [orders, posSales, stats] = await Promise.all([
        repo.listOrders(customerId),
        repo.listPosSales(customerId),
        repo.getPurchaseStats(customerId),
      ])
      return { stats, orders, posSales }
    },

    /** Top customers by lifetime value (CLV) across all channels. */
    async getReports() {
      const customers = await repo.findMany()
      const rows = await Promise.all(customers.map(async (c) => {
        const stats = await repo.getPurchaseStats(c.id)
        return {
          id: c.id, name: c.name, phone: c.phone, status: c.status,
          walletBalance: c.walletBalance, loyaltyPoints: c.loyaltyPoints,
          totalOrders: stats.totalOrders, totalSpent: stats.totalSpent,
          averageOrderValue: stats.averageOrderValue, lastPurchaseAt: stats.lastPurchaseAt,
        }
      }))
      const top = [...rows].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 20)
      return {
        totalCustomers: rows.length,
        activeCustomers: rows.filter(r => r.status === 'ACTIVE').length,
        totalRevenue: rows.reduce((s, r) => s + r.totalSpent, 0),
        topCustomers: top,
      }
    },
  }
}

export type CustomersService = ReturnType<typeof createCustomersService>
