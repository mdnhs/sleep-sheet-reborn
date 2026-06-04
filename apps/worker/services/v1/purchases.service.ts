import type { Database } from '@repo/database'
import { createPurchasesRepository } from '../../repositories/purchases.repository'
import { createSupplierRepository } from '../../repositories/suppliers.repository'
import { createLocationRepository } from '../../repositories/locations.repository'
import { createProductVariantRepository } from '../../repositories/product-variants.repository'
import { createInventoryRepository } from '../../repositories/inventory.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { ServiceError } from '../../utils/service-error'

export function createPurchasesService(db: Database, organizationId: string) {
  const repo = createPurchasesRepository(db, organizationId)
  const supplierRepo = createSupplierRepository(db, organizationId)
  const locationRepo = createLocationRepository(db, organizationId)
  const variantRepo = createProductVariantRepository(db, organizationId)
  const inventoryRepo = createInventoryRepository(db, organizationId)
  const auditRepo = createAuditLogRepository(db, organizationId)

  async function assertSupplier(id: string) {
    const s = await supplierRepo.findById(id)
    if (!s) throw new ServiceError('Supplier not found', 404)
    if (s.status === 'ARCHIVED') throw new ServiceError('Supplier is archived', 400)
    return s
  }

  async function assertLocation(id: string) {
    const l = await locationRepo.findLocationById(id)
    if (!l) throw new ServiceError('Location not found', 404)
    return l
  }

  async function nextPurchaseNumber(): Promise<string> {
    const count = await repo.countByOrg()
    return `PO-${String(count + 1).padStart(5, '0')}`
  }

  return {
    async list(status?: string) {
      return repo.findMany(status as any)
    },

    async get(id: string) {
      const po = await repo.findById(id)
      if (!po) throw new ServiceError('Purchase order not found', 404)
      const items = await repo.findItems(id)
      return { ...po, items }
    },

    async create(data: {
      supplierId: string
      receivingLocationId: string
      items: Array<{ variantId: string; quantity: number; unitCost: number }>
      tax?: number
      discount?: number
      notes?: string
      actorId?: string
    }) {
      await assertSupplier(data.supplierId)
      await assertLocation(data.receivingLocationId)

      if (!data.items.length) throw new ServiceError('Purchase order must have at least one item', 400)

      for (const item of data.items) {
        if (item.quantity <= 0) throw new ServiceError('Item quantity must be positive', 400)
        if (item.unitCost < 0) throw new ServiceError('Unit cost cannot be negative', 400)
        const variant = await variantRepo.findById(item.variantId)
        if (!variant) throw new ServiceError(`Variant ${item.variantId} not found`, 404)
      }

      const subtotal = data.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0)
      const tax = data.tax ?? 0
      const discount = data.discount ?? 0
      const grandTotal = subtotal + tax - discount

      const purchaseNumber = await nextPurchaseNumber()

      const po = await repo.create({
        supplierId: data.supplierId,
        receivingLocationId: data.receivingLocationId,
        purchaseNumber,
        status: 'DRAFT',
        subtotal,
        tax,
        discount,
        grandTotal,
        notes: data.notes,
      })

      for (const item of data.items) {
        await repo.addItem({
          purchaseOrderId: po.id,
          variantId: item.variantId,
          quantity: item.quantity,
          receivedQuantity: 0,
          unitCost: item.unitCost,
        })
      }

      await auditRepo.log('purchase_order', po.id, 'create', data.actorId, {
        supplierId: data.supplierId,
        purchaseNumber,
        grandTotal,
        itemCount: data.items.length,
      })

      return this.get(po.id)
    },

    async approve(id: string, actorId: string) {
      const po = await repo.findById(id)
      if (!po) throw new ServiceError('Purchase order not found', 404)
      if (po.status !== 'DRAFT') throw new ServiceError('Only DRAFT orders can be approved', 400)

      const updated = await repo.update(id, { status: 'APPROVED', approvedBy: actorId })
      await auditRepo.log('purchase_order', id, 'approve', actorId, { previousStatus: 'DRAFT' })
      return updated
    },

    async receive(id: string, data: {
      items: Array<{ itemId: string; receivedQty: number }>
      actorId?: string
    }) {
      const po = await repo.findById(id)
      if (!po) throw new ServiceError('Purchase order not found', 404)
      if (po.status !== 'APPROVED' && po.status !== 'PARTIALLY_RECEIVED') {
        throw new ServiceError('Purchase order must be APPROVED or PARTIALLY_RECEIVED to receive goods', 400)
      }

      const existingItems = await repo.findItems(id)
      const itemMap = new Map(existingItems.map(i => [i.id, i]))

      for (const recv of data.items) {
        const item = itemMap.get(recv.itemId)
        if (!item) throw new ServiceError(`Item ${recv.itemId} not found in this purchase order`, 404)
        const remaining = item.quantity - item.receivedQuantity
        if (recv.receivedQty <= 0) throw new ServiceError('Received quantity must be positive', 400)
        if (recv.receivedQty > remaining) {
          throw new ServiceError(`Cannot receive ${recv.receivedQty} for item ${recv.itemId}: only ${remaining} remaining`, 400)
        }
      }

      // Apply inventory increments + update received quantities
      for (const recv of data.items) {
        const item = itemMap.get(recv.itemId)!
        const newReceived = item.receivedQuantity + recv.receivedQty

        await repo.updateItemReceived(recv.itemId, newReceived)

        // Ensure inventory row exists before incrementing
        const existing = await inventoryRepo.findByVariantAndLocation(item.variantId, po.receivingLocationId)
        if (existing) {
          await inventoryRepo.incrementStock(item.variantId, po.receivingLocationId, recv.receivedQty)
        } else {
          await inventoryRepo.upsertStock(item.variantId, po.receivingLocationId, recv.receivedQty)
        }

        await inventoryRepo.createMovement({
          variantId: item.variantId,
          locationId: po.receivingLocationId,
          movementType: 'PURCHASE',
          quantity: recv.receivedQty,
          referenceType: 'purchase_order',
          referenceId: id,
        })
      }

      // Refresh items after update to check completion
      const updatedItems = await repo.findItems(id)
      const allReceived = updatedItems.every(i => i.receivedQuantity >= i.quantity)
      const anyReceived = updatedItems.some(i => i.receivedQuantity > 0)

      const newStatus = allReceived ? 'RECEIVED' : anyReceived ? 'PARTIALLY_RECEIVED' : po.status
      const updated = await repo.update(id, { status: newStatus })

      await auditRepo.log('purchase_order', id, 'receive', data.actorId, {
        receivedItems: data.items.length,
        newStatus,
      })

      return { ...updated, items: updatedItems }
    },

    async cancel(id: string, actorId?: string) {
      const po = await repo.findById(id)
      if (!po) throw new ServiceError('Purchase order not found', 404)
      if (po.status === 'RECEIVED' || po.status === 'COMPLETED') {
        throw new ServiceError('Received or completed orders cannot be cancelled', 400)
      }
      if (po.status === 'CANCELLED') throw new ServiceError('Order already cancelled', 400)

      const updated = await repo.update(id, { status: 'CANCELLED' })
      await auditRepo.log('purchase_order', id, 'cancel', actorId, { previousStatus: po.status })
      return updated
    },

    async getSupplierDue(supplierId: string) {
      const s = await supplierRepo.findById(supplierId)
      if (!s) throw new ServiceError('Supplier not found', 404)

      const [totalPurchased, totalPaid] = await Promise.all([
        repo.getTotalPurchased(supplierId),
        supplierRepo.getTotalPaid(supplierId),
      ])

      return {
        supplierId,
        supplierName: s.name,
        totalPurchased,
        totalPaid,
        due: Math.max(0, totalPurchased - totalPaid),
      }
    },

    async listSupplierDues() {
      const suppliers = await supplierRepo.findMany()
      const dues = await Promise.all(suppliers.map(async s => {
        const [totalPurchased, totalPaid] = await Promise.all([
          repo.getTotalPurchased(s.id),
          supplierRepo.getTotalPaid(s.id),
        ])
        return {
          supplierId: s.id,
          supplierName: s.name,
          phone: s.phone,
          totalPurchased,
          totalPaid,
          due: Math.max(0, totalPurchased - totalPaid),
        }
      }))
      return dues
    },
  }
}
