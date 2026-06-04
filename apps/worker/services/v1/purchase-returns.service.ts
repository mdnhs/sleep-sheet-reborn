import type { Database } from '@repo/database'
import { createPurchaseReturnsRepository } from '../../repositories/purchase-returns.repository'
import { createPurchasesRepository } from '../../repositories/purchases.repository'
import { createInventoryRepository } from '../../repositories/inventory.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { ServiceError } from '../../utils/service-error'

const RETURNABLE_STATUSES = ['RECEIVED', 'PARTIALLY_RECEIVED', 'COMPLETED'] as const

export function createPurchaseReturnsService(db: Database, organizationId: string) {
  const repo = createPurchaseReturnsRepository(db, organizationId)
  const purchasesRepo = createPurchasesRepository(db, organizationId)
  const inventoryRepo = createInventoryRepository(db, organizationId)
  const auditRepo = createAuditLogRepository(db, organizationId)

  async function nextReturnNumber(): Promise<string> {
    const count = await repo.countByOrg()
    return `PR-${String(count + 1).padStart(5, '0')}`
  }

  return {
    async list(purchaseOrderId?: string, status?: string) {
      return repo.findMany(purchaseOrderId, status as any)
    },

    async get(id: string) {
      const ret = await repo.findById(id)
      if (!ret) throw new ServiceError('Purchase return not found', 404)
      const items = await repo.findItems(id)
      return { ...ret, items }
    },

    async create(data: {
      purchaseOrderId: string
      items: Array<{ purchaseItemId: string; variantId: string; quantity: number }>
      notes?: string
      actorId?: string
    }) {
      const po = await purchasesRepo.findById(data.purchaseOrderId)
      if (!po) throw new ServiceError('Purchase order not found', 404)
      if (!(RETURNABLE_STATUSES as readonly string[]).includes(po.status)) {
        throw new ServiceError(`Only ${RETURNABLE_STATUSES.join('/')} orders can be returned`, 400)
      }

      if (!data.items.length) throw new ServiceError('Return must have at least one item', 400)

      const poItems = await purchasesRepo.findItems(data.purchaseOrderId)
      const poItemMap = new Map(poItems.map(i => [i.id, i]))

      for (const item of data.items) {
        if (item.quantity <= 0) throw new ServiceError('Return quantity must be positive', 400)

        const poItem = poItemMap.get(item.purchaseItemId)
        if (!poItem) throw new ServiceError(`Purchase item ${item.purchaseItemId} not found in this order`, 404)
        if (poItem.variantId !== item.variantId) {
          throw new ServiceError(`Variant mismatch for purchase item ${item.purchaseItemId}`, 400)
        }

        const alreadyReturned = await repo.getTotalReturnedQty(item.purchaseItemId)
        const returnable = poItem.receivedQuantity - alreadyReturned
        if (item.quantity > returnable) {
          throw new ServiceError(
            `Cannot return ${item.quantity} of item ${item.purchaseItemId}: only ${returnable} returnable (received=${poItem.receivedQuantity}, already returned=${alreadyReturned})`,
            400,
          )
        }
      }

      const returnNumber = await nextReturnNumber()

      const ret = await repo.create({
        purchaseOrderId: data.purchaseOrderId,
        returnNumber,
        status: 'PENDING',
        locationId: po.receivingLocationId,
        notes: data.notes,
        approvedBy: null,
      })

      for (const item of data.items) {
        const poItem = poItemMap.get(item.purchaseItemId)!
        await repo.addItem({
          purchaseReturnId: ret.id,
          purchaseItemId: item.purchaseItemId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitCost: poItem.unitCost,
        })
      }

      await auditRepo.log('purchase_return', ret.id, 'create', data.actorId, {
        purchaseOrderId: data.purchaseOrderId,
        returnNumber,
        itemCount: data.items.length,
      })

      return this.get(ret.id)
    },

    async approve(id: string, actorId: string) {
      const ret = await repo.findById(id)
      if (!ret) throw new ServiceError('Purchase return not found', 404)
      if (ret.status !== 'PENDING') throw new ServiceError('Only PENDING returns can be approved', 400)

      const items = await repo.findItems(id)

      // Decrement inventory + create PURCHASE_RETURN movements
      for (const item of items) {
        const stock = await inventoryRepo.findByVariantAndLocation(item.variantId, ret.locationId)
        if (!stock || stock.quantity < item.quantity) {
          throw new ServiceError(
            `Insufficient stock for variant ${item.variantId} at return location (available=${stock?.quantity ?? 0}, requested=${item.quantity})`,
            400,
          )
        }

        await inventoryRepo.decrementStock(item.variantId, ret.locationId, item.quantity)

        await inventoryRepo.createMovement({
          variantId: item.variantId,
          locationId: ret.locationId,
          movementType: 'PURCHASE_RETURN',
          quantity: -item.quantity,
          referenceType: 'purchase_return',
          referenceId: id,
        })
      }

      const updated = await repo.update(id, { status: 'APPROVED', approvedBy: actorId })
      await auditRepo.log('purchase_return', id, 'approve', actorId, { itemCount: items.length })
      return updated
    },

    async cancel(id: string, actorId?: string) {
      const ret = await repo.findById(id)
      if (!ret) throw new ServiceError('Purchase return not found', 404)
      if (ret.status !== 'PENDING') throw new ServiceError('Only PENDING returns can be cancelled', 400)

      const updated = await repo.update(id, { status: 'CANCELLED' })
      await auditRepo.log('purchase_return', id, 'cancel', actorId, { previousStatus: 'PENDING' })
      return updated
    },
  }
}
