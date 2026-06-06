import type { Database } from '@repo/database'
import { createCashRegistersRepository } from '../../repositories/cash-registers.repository'
import { createRegisterSessionsRepository } from '../../repositories/register-sessions.repository'
import { createPosSalesRepository } from '../../repositories/pos-sales.repository'
import { createInventoryRepository } from '../../repositories/inventory.repository'
import { createProductVariantRepository } from '../../repositories/product-variants.repository'
import { createLocationRepository } from '../../repositories/locations.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { ServiceError } from '../../utils/service-error'
import { enforceSubscriptionActive } from '../../utils/plan-limits'
import { awardLoyalty } from './integrations'

export function createPosService(db: Database, organizationId: string) {
  const registerRepo = createCashRegistersRepository(db, organizationId)
  const sessionRepo = createRegisterSessionsRepository(db, organizationId)
  const saleRepo = createPosSalesRepository(db, organizationId)
  const inventoryRepo = createInventoryRepository(db, organizationId)
  const variantRepo = createProductVariantRepository(db, organizationId)
  const locationRepo = createLocationRepository(db, organizationId)
  const auditRepo = createAuditLogRepository(db, organizationId)

  async function nextSaleNumber(): Promise<string> {
    const count = await saleRepo.countByOrg()
    return `POS-${String(count + 1).padStart(6, '0')}`
  }

  async function assertSession(id: string) {
    const session = await sessionRepo.findById(id)
    if (!session) throw new ServiceError('Register session not found', 404)
    if (session.status !== 'OPEN') throw new ServiceError('Register session is not open', 400)
    return session
  }

  async function validateItems(items: Array<{ variantId: string; quantity: number; unitPrice: number }>) {
    if (!items.length) throw new ServiceError('Sale must have at least one item', 400)
    for (const item of items) {
      if (item.quantity <= 0) throw new ServiceError('Item quantity must be positive', 400)
      if (item.unitPrice < 0) throw new ServiceError('Unit price cannot be negative', 400)
      const variant = await variantRepo.findById(item.variantId)
      if (!variant) throw new ServiceError(`Variant ${item.variantId} not found`, 404)
    }
  }

  async function checkStock(items: Array<{ variantId: string; quantity: number }>, locationId: string) {
    for (const item of items) {
      const stock = await inventoryRepo.findByVariantAndLocation(item.variantId, locationId)
      const available = stock?.quantity ?? 0
      if (available < item.quantity) {
        throw new ServiceError(
          `Insufficient stock for variant ${item.variantId}: available=${available}, requested=${item.quantity}`,
          400,
        )
      }
    }
  }

  return {
    // ── Registers ──────────────────────────────────────────────────────────────

    async listRegisters() {
      return registerRepo.findMany()
    },

    async getRegister(id: string) {
      const r = await registerRepo.findById(id)
      if (!r) throw new ServiceError('Register not found', 404)
      return r
    },

    async createRegister(data: { locationId: string; name: string; actorId?: string }) {
      const loc = await locationRepo.findLocationById(data.locationId)
      if (!loc) throw new ServiceError('Location not found', 404)
      if (loc.type !== 'OUTLET') throw new ServiceError('Cash registers must be at an outlet location', 400)
      const reg = await registerRepo.create({ locationId: data.locationId, name: data.name })
      await auditRepo.log('cash_register', reg.id, 'create', data.actorId, { name: data.name, locationId: data.locationId })
      return reg
    },

    async updateRegister(id: string, data: { name?: string; status?: 'ACTIVE' | 'INACTIVE'; actorId?: string }) {
      const existing = await registerRepo.findById(id)
      if (!existing) throw new ServiceError('Register not found', 404)
      const updated = await registerRepo.update(id, { name: data.name, status: data.status })
      await auditRepo.log('cash_register', id, 'update', data.actorId, { name: data.name, status: data.status })
      return updated
    },

    // ── Sessions ───────────────────────────────────────────────────────────────

    async listSessions(registerId?: string) {
      return sessionRepo.findMany(registerId)
    },

    async getSession(id: string) {
      const s = await sessionRepo.findById(id)
      if (!s) throw new ServiceError('Session not found', 404)
      const [totalSales, saleCount] = await Promise.all([
        sessionRepo.totalSalesBySession(id),
        sessionRepo.countSalesBySession(id),
      ])
      return { ...s, totalSales, saleCount }
    },

    async openSession(data: { registerId: string; openingCash: number; actorId: string }) {
      const reg = await registerRepo.findById(data.registerId)
      if (!reg) throw new ServiceError('Register not found', 404)
      if (reg.status !== 'ACTIVE') throw new ServiceError('Register is inactive', 400)

      const existing = await sessionRepo.findOpenByRegister(data.registerId)
      if (existing) throw new ServiceError('Register already has an open session', 409)

      const session = await sessionRepo.open({
        cashRegisterId: data.registerId,
        openingCash: data.openingCash,
        openedBy: data.actorId,
      })
      await auditRepo.log('register_session', session.id, 'open', data.actorId, {
        registerId: data.registerId,
        openingCash: data.openingCash,
      })
      return session
    },

    async closeSession(data: { sessionId: string; closingCash: number; actorId: string }) {
      const session = await sessionRepo.findById(data.sessionId)
      if (!session) throw new ServiceError('Session not found', 404)
      if (session.status !== 'OPEN') throw new ServiceError('Session is already closed', 400)

      const closed = await sessionRepo.close(data.sessionId, data.closingCash, data.actorId)
      const [totalSales, saleCount] = await Promise.all([
        sessionRepo.totalSalesBySession(data.sessionId),
        sessionRepo.countSalesBySession(data.sessionId),
      ])
      await auditRepo.log('register_session', data.sessionId, 'close', data.actorId, {
        closingCash: data.closingCash,
        totalSales,
        saleCount,
      })
      return { ...closed, totalSales, saleCount }
    },

    // ── POS Sales ──────────────────────────────────────────────────────────────

    async listSales(status?: string, sessionId?: string) {
      if (sessionId) return saleRepo.findBySession(sessionId, status as any)
      return saleRepo.findMany(status as any)
    },

    async getSale(id: string) {
      const sale = await saleRepo.findById(id)
      if (!sale) throw new ServiceError('POS sale not found', 404)
      const [items, payments] = await Promise.all([
        saleRepo.findItems(id),
        saleRepo.findPayments(id),
      ])
      return { ...sale, items, payments }
    },

    async createSale(data: {
      sessionId: string
      items: Array<{ variantId: string; quantity: number; unitPrice: number; discount?: number }>
      payments: Array<{ method: 'CASH' | 'BKASH' | 'NAGAD' | 'CARD' | 'BANK' | 'WALLET'; amount: number }>
      discount?: number
      tax?: number
      notes?: string
      customerId?: string
      actorId?: string
    }) {
      await enforceSubscriptionActive(db, organizationId)
      const session = await assertSession(data.sessionId)

      const reg = await registerRepo.findById(session.cashRegisterId)
      if (!reg) throw new ServiceError('Cash register not found', 404)
      const locationId = reg.locationId

      await validateItems(data.items)
      await checkStock(data.items, locationId)

      const discount = data.discount ?? 0
      const tax = data.tax ?? 0
      const subtotal = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice - (i.discount ?? 0), 0)
      const grandTotal = subtotal + tax - discount

      if (grandTotal < 0) throw new ServiceError('Grand total cannot be negative', 400)

      const paymentTotal = data.payments.reduce((sum, p) => sum + p.amount, 0)
      if (paymentTotal !== grandTotal) {
        throw new ServiceError(`Payment total (${paymentTotal}) must equal grand total (${grandTotal})`, 400)
      }

      const saleNumber = await nextSaleNumber()

      const sale = await saleRepo.create({
        sessionId: data.sessionId,
        locationId,
        customerId: data.customerId ?? null,
        saleNumber,
        status: 'COMPLETED',
        subtotal,
        discount,
        tax,
        grandTotal,
        notes: data.notes ?? null,
      })

      for (const item of data.items) {
        const itemDiscount = item.discount ?? 0
        await saleRepo.addItem({
          saleId: sale.id,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: itemDiscount,
          lineTotal: item.quantity * item.unitPrice - itemDiscount,
        })
      }

      for (const payment of data.payments) {
        await saleRepo.addPayment({ saleId: sale.id, method: payment.method, amount: payment.amount })
      }

      // Deduct inventory immediately — no reservation for POS
      for (const item of data.items) {
        await inventoryRepo.decrementStock(item.variantId, locationId, item.quantity)
        await inventoryRepo.createMovement({
          variantId: item.variantId,
          locationId,
          movementType: 'POS_SALE',
          quantity: -item.quantity,
          referenceType: 'pos_sale',
          referenceId: sale.id,
        })
      }

      await auditRepo.log('pos_sale', sale.id, 'create', data.actorId, {
        saleNumber,
        grandTotal,
        itemCount: data.items.length,
        locationId,
      })

      // Loyalty on completed POS sale
      await awardLoyalty(db, organizationId, data.customerId, grandTotal, { source: 'POS', type: 'pos_sale', id: sale.id })

      return this.getSale(sale.id)
    },

    async holdSale(data: {
      sessionId: string
      items: Array<{ variantId: string; quantity: number; unitPrice: number; discount?: number }>
      discount?: number
      tax?: number
      notes?: string
      customerId?: string
      actorId?: string
    }) {
      const session = await assertSession(data.sessionId)
      const reg = await registerRepo.findById(session.cashRegisterId)
      if (!reg) throw new ServiceError('Cash register not found', 404)

      await validateItems(data.items)

      const discount = data.discount ?? 0
      const tax = data.tax ?? 0
      const subtotal = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice - (i.discount ?? 0), 0)
      const grandTotal = subtotal + tax - discount

      const saleNumber = await nextSaleNumber()

      const sale = await saleRepo.create({
        sessionId: data.sessionId,
        locationId: reg.locationId,
        customerId: data.customerId ?? null,
        saleNumber,
        status: 'DRAFT',
        subtotal,
        discount,
        tax,
        grandTotal,
        notes: data.notes ?? null,
      })

      for (const item of data.items) {
        const itemDiscount = item.discount ?? 0
        await saleRepo.addItem({
          saleId: sale.id,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: itemDiscount,
          lineTotal: item.quantity * item.unitPrice - itemDiscount,
        })
      }

      await auditRepo.log('pos_sale', sale.id, 'hold', data.actorId, { saleNumber, grandTotal })

      return this.getSale(sale.id)
    },

    async completeSale(saleId: string, payments: Array<{ method: 'CASH' | 'BKASH' | 'NAGAD' | 'CARD' | 'BANK' | 'WALLET'; amount: number }>, actorId?: string) {
      const sale = await saleRepo.findById(saleId)
      if (!sale) throw new ServiceError('POS sale not found', 404)
      if (sale.status !== 'DRAFT') throw new ServiceError('Only DRAFT sales can be completed', 400)

      const session = await sessionRepo.findById(sale.sessionId)
      if (!session || session.status !== 'OPEN') throw new ServiceError('Register session is not open', 400)

      const items = await saleRepo.findItems(saleId)
      await checkStock(items, sale.locationId)

      const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0)
      if (paymentTotal !== sale.grandTotal) {
        throw new ServiceError(`Payment total (${paymentTotal}) must equal grand total (${sale.grandTotal})`, 400)
      }

      for (const payment of payments) {
        await saleRepo.addPayment({ saleId, method: payment.method, amount: payment.amount })
      }

      for (const item of items) {
        await inventoryRepo.decrementStock(item.variantId, sale.locationId, item.quantity)
        await inventoryRepo.createMovement({
          variantId: item.variantId,
          locationId: sale.locationId,
          movementType: 'POS_SALE',
          quantity: -item.quantity,
          referenceType: 'pos_sale',
          referenceId: saleId,
        })
      }

      await saleRepo.update(saleId, { status: 'COMPLETED' })
      await auditRepo.log('pos_sale', saleId, 'complete', actorId, { grandTotal: sale.grandTotal })

      return this.getSale(saleId)
    },

    async cancelSale(saleId: string, actorId?: string) {
      const sale = await saleRepo.findById(saleId)
      if (!sale) throw new ServiceError('POS sale not found', 404)
      if (sale.status === 'CANCELLED') throw new ServiceError('Sale already cancelled', 400)
      if (sale.status === 'RETURNED') throw new ServiceError('Cannot cancel a returned sale', 400)

      if (sale.status === 'COMPLETED') {
        const items = await saleRepo.findItems(saleId)
        for (const item of items) {
          await inventoryRepo.incrementStock(item.variantId, sale.locationId, item.quantity)
          await inventoryRepo.createMovement({
            variantId: item.variantId,
            locationId: sale.locationId,
            movementType: 'RETURN',
            quantity: item.quantity,
            referenceType: 'pos_sale_cancel',
            referenceId: saleId,
          })
        }
      }

      await saleRepo.update(saleId, { status: 'CANCELLED' })
      await auditRepo.log('pos_sale', saleId, 'cancel', actorId, { previousStatus: sale.status })

      return this.getSale(saleId)
    },
  }
}
