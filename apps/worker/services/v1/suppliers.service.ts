import type { Database } from '@repo/database'
import { createSupplierRepository } from '../../repositories/suppliers.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { ServiceError } from '../../utils/service-error'

export function createSuppliersService(db: Database, organizationId: string) {
  const repo = createSupplierRepository(db, organizationId)
  const auditRepo = createAuditLogRepository(db, organizationId)

  return {
    async list(status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') {
      return repo.findMany(status)
    },

    async get(id: string) {
      const s = await repo.findById(id)
      if (!s) throw new ServiceError('Supplier not found', 404)
      return s
    },

    async create(data: {
      name: string
      phone: string
      email?: string
      address?: string
      notes?: string
      actorId?: string
    }) {
      const existing = await repo.findByPhone(data.phone)
      if (existing) throw new ServiceError('Phone number already used by another supplier in this organization', 409)

      const { actorId, ...rest } = data
      const s = await repo.create(rest)
      await auditRepo.log('supplier', s.id, 'create', actorId, { name: s.name, phone: s.phone })
      return s
    },

    async update(id: string, data: {
      name?: string
      phone?: string
      email?: string
      address?: string
      notes?: string
      actorId?: string
    }) {
      const existing = await repo.findById(id)
      if (!existing) throw new ServiceError('Supplier not found', 404)

      if (data.phone && data.phone !== existing.phone) {
        const conflict = await repo.findByPhone(data.phone)
        if (conflict) throw new ServiceError('Phone number already used by another supplier', 409)
      }

      const { actorId, ...rest } = data
      const updated = await repo.update(id, rest)
      await auditRepo.log('supplier', id, 'update', actorId, rest)
      return updated
    },

    async archive(id: string, actorId?: string) {
      const existing = await repo.findById(id)
      if (!existing) throw new ServiceError('Supplier not found', 404)
      if (existing.status === 'ARCHIVED') throw new ServiceError('Supplier already archived', 400)

      const updated = await repo.update(id, { status: 'ARCHIVED' })
      await auditRepo.log('supplier', id, 'archive', actorId)
      return updated
    },

    async getDue(id: string) {
      const s = await repo.findById(id)
      if (!s) throw new ServiceError('Supplier not found', 404)
      const [totalPurchased, totalPaid] = await Promise.all([
        repo.getTotalPaid(id), // this is a placeholder — will pass purchases repo from caller
        Promise.resolve(0),
      ])
      return { supplierId: id, totalPurchased: 0, totalPaid: totalPurchased, due: 0 }
    },

    async addPayment(supplierId: string, data: {
      amount: number
      paymentMethod: 'CASH' | 'BANK' | 'BKASH' | 'NAGAD' | 'CHEQUE'
      referenceNo?: string
      notes?: string
      actorId?: string
    }) {
      const s = await repo.findById(supplierId)
      if (!s) throw new ServiceError('Supplier not found', 404)
      if (s.status === 'ARCHIVED') throw new ServiceError('Cannot add payment to archived supplier', 400)
      if (data.amount <= 0) throw new ServiceError('Payment amount must be positive', 400)

      const { actorId, ...rest } = data
      const payment = await repo.createPayment({ supplierId, ...rest })
      await auditRepo.log('supplier', supplierId, 'payment', actorId, { amount: data.amount, method: data.paymentMethod })
      return payment
    },

    async getPayments(supplierId: string) {
      const s = await repo.findById(supplierId)
      if (!s) throw new ServiceError('Supplier not found', 404)
      return repo.findPayments(supplierId)
    },
  }
}
