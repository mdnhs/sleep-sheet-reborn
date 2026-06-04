import type { Database } from '@repo/database'
import { createPosSalesRepository } from '../../repositories/pos-sales.repository'
import { createPosSaleReturnsRepository } from '../../repositories/pos-sale-returns.repository'
import { createInventoryRepository } from '../../repositories/inventory.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { ServiceError } from '../../utils/service-error'

export function createPosReturnsService(db: Database, organizationId: string) {
  const saleRepo = createPosSalesRepository(db, organizationId)
  const returnRepo = createPosSaleReturnsRepository(db, organizationId)
  const inventoryRepo = createInventoryRepository(db, organizationId)
  const auditRepo = createAuditLogRepository(db, organizationId)

  async function nextReturnNumber(): Promise<string> {
    const count = await returnRepo.countByOrg()
    return `POSR-${String(count + 1).padStart(6, '0')}`
  }

  return {
    async list(saleId?: string, status?: string) {
      return returnRepo.findMany(saleId, status as any)
    },

    async get(id: string) {
      const ret = await returnRepo.findById(id)
      if (!ret) throw new ServiceError('POS return not found', 404)
      const items = await returnRepo.findItems(id)
      return { ...ret, items }
    },

    async create(data: {
      saleId: string
      items: Array<{ saleItemId: string; variantId: string; quantity: number }>
      notes?: string
      actorId?: string
    }) {
      const sale = await saleRepo.findById(data.saleId)
      if (!sale) throw new ServiceError('POS sale not found', 404)
      if (sale.status !== 'COMPLETED') throw new ServiceError('Only completed sales can be returned', 400)

      if (!data.items.length) throw new ServiceError('Return must have at least one item', 400)

      const saleItems = await saleRepo.findItems(data.saleId)

      for (const ri of data.items) {
        if (ri.quantity <= 0) throw new ServiceError('Return quantity must be positive', 400)

        const saleItem = saleItems.find(si => si.id === ri.saleItemId)
        if (!saleItem) throw new ServiceError(`Sale item ${ri.saleItemId} not found on this sale`, 404)
        if (saleItem.variantId !== ri.variantId) throw new ServiceError(`Variant mismatch on sale item ${ri.saleItemId}`, 400)

        const alreadyReturned = await returnRepo.getTotalReturnedQty(ri.saleItemId)
        if (alreadyReturned + ri.quantity > saleItem.quantity) {
          throw new ServiceError(
            `Return quantity (${alreadyReturned + ri.quantity}) exceeds sold quantity (${saleItem.quantity}) for item ${ri.saleItemId}`,
            400,
          )
        }
      }

      const returnNumber = await nextReturnNumber()

      const ret = await returnRepo.create({
        saleId: data.saleId,
        returnNumber,
        status: 'PENDING',
        notes: data.notes ?? null,
        approvedBy: null,
      })

      for (const item of data.items) {
        await returnRepo.addItem({
          returnId: ret.id,
          saleItemId: item.saleItemId,
          variantId: item.variantId,
          quantity: item.quantity,
        })
      }

      await auditRepo.log('pos_sale_return', ret.id, 'create', data.actorId, {
        saleId: data.saleId,
        returnNumber,
        itemCount: data.items.length,
      })

      return this.get(ret.id)
    },

    async approve(id: string, actorId: string) {
      const ret = await returnRepo.findById(id)
      if (!ret) throw new ServiceError('POS return not found', 404)
      if (ret.status !== 'PENDING') throw new ServiceError('Only pending returns can be approved', 400)

      const sale = await saleRepo.findById(ret.saleId)
      if (!sale) throw new ServiceError('Original sale not found', 404)

      const items = await returnRepo.findItems(id)

      // Restore inventory
      for (const item of items) {
        await inventoryRepo.incrementStock(item.variantId, sale.locationId, item.quantity)
        await inventoryRepo.createMovement({
          variantId: item.variantId,
          locationId: sale.locationId,
          movementType: 'RETURN',
          quantity: item.quantity,
          referenceType: 'pos_sale_return',
          referenceId: id,
        })
      }

      await returnRepo.update(id, { status: 'APPROVED', approvedBy: actorId })

      // Mark sale as RETURNED
      await saleRepo.update(ret.saleId, { status: 'RETURNED' })

      await auditRepo.log('pos_sale_return', id, 'approve', actorId, {
        saleId: ret.saleId,
        itemCount: items.length,
      })

      return this.get(id)
    },

    async cancel(id: string, actorId?: string) {
      const ret = await returnRepo.findById(id)
      if (!ret) throw new ServiceError('POS return not found', 404)
      if (ret.status !== 'PENDING') throw new ServiceError('Only pending returns can be cancelled', 400)

      await returnRepo.update(id, { status: 'CANCELLED' })
      await auditRepo.log('pos_sale_return', id, 'cancel', actorId, { saleId: ret.saleId })

      return this.get(id)
    },
  }
}
