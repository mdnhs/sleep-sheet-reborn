import type { Database } from '@repo/database'
import { createInventoryRepository } from '../../repositories/inventory.repository'
import { createLocationRepository } from '../../repositories/locations.repository'
import { createProductVariantRepository } from '../../repositories/product-variants.repository'
import { ServiceError } from '../../utils/service-error'

export function createInventoryService(db: Database, organizationId: string) {
  const repo = createInventoryRepository(db, organizationId)
  const locationRepo = createLocationRepository(db, organizationId)
  const variantRepo = createProductVariantRepository(db, organizationId)

  async function assertVariant(variantId: string) {
    const v = await variantRepo.findById(variantId)
    if (!v) throw new ServiceError('Variant not found', 404)
    return v
  }

  async function assertLocation(locationId: string) {
    const l = await locationRepo.findLocationById(locationId)
    if (!l) throw new ServiceError('Location not found', 404)
    return l
  }

  return {
    // ── Stock queries ─────────────────────────────────────────────────────────

    async getStock(variantId: string, locationId: string) {
      const row = await repo.findByVariantAndLocation(variantId, locationId)
      return row ?? { variantId, locationId, quantity: 0 }
    },

    async listStockByVariant(variantId: string) {
      return repo.findByVariant(variantId)
    },

    async listStockByLocation(locationId: string) {
      return repo.findByLocation(locationId)
    },

    // ── Adjustment (manual correction — requires approval at route layer) ─────

    async adjust(data: {
      variantId: string
      locationId: string
      quantity: number // absolute new quantity
      notes?: string
      createdBy?: string
    }) {
      await assertVariant(data.variantId)
      await assertLocation(data.locationId)

      if (data.quantity < 0) throw new ServiceError('Quantity cannot be negative', 400)

      const current = await repo.findByVariantAndLocation(data.variantId, data.locationId)
      const delta = data.quantity - (current?.quantity ?? 0)

      await repo.upsertStock(data.variantId, data.locationId, data.quantity)
      await repo.createMovement({
        variantId: data.variantId,
        locationId: data.locationId,
        movementType: 'ADJUSTMENT',
        quantity: delta,
        notes: data.notes,
      })

      return repo.findByVariantAndLocation(data.variantId, data.locationId)
    },

    // ── Movements ledger ──────────────────────────────────────────────────────

    async listMovements(variantId?: string, locationId?: string) {
      return repo.findMovements(variantId, locationId)
    },

    // ── Transfers ─────────────────────────────────────────────────────────────

    async listTransfers(status?: 'DRAFT' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED') {
      return repo.findTransfers(status)
    },

    async getTransfer(id: string) {
      const t = await repo.findTransferById(id)
      if (!t) throw new ServiceError('Transfer not found', 404)
      const items = await repo.findTransferItems(id)
      return { ...t, items }
    },

    async createTransfer(data: {
      fromLocationId: string
      toLocationId: string
      items: Array<{ variantId: string; quantity: number }>
    }) {
      await assertLocation(data.fromLocationId)
      await assertLocation(data.toLocationId)
      if (data.fromLocationId === data.toLocationId) throw new ServiceError('Source and destination cannot be the same', 400)
      if (!data.items.length) throw new ServiceError('Transfer must have at least one item', 400)

      for (const item of data.items) {
        if (item.quantity <= 0) throw new ServiceError('Item quantity must be positive', 400)
        await assertVariant(item.variantId)
      }

      const transfer = await repo.createTransfer({
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        status: 'DRAFT',
      })

      for (const item of data.items) {
        await repo.addTransferItem({ transferId: transfer.id, variantId: item.variantId, quantity: item.quantity })
      }

      return this.getTransfer(transfer.id)
    },

    async approveTransfer(id: string, approvedBy: string) {
      const t = await repo.findTransferById(id)
      if (!t) throw new ServiceError('Transfer not found', 404)
      if (t.status !== 'DRAFT') throw new ServiceError('Only DRAFT transfers can be approved', 400)
      return repo.updateTransferStatus(id, 'APPROVED', approvedBy)
    },

    async receiveTransfer(id: string, receivedBy: string) {
      const t = await repo.findTransferById(id)
      if (!t) throw new ServiceError('Transfer not found', 404)
      if (t.status !== 'APPROVED' && t.status !== 'IN_TRANSIT') {
        throw new ServiceError('Transfer must be APPROVED or IN_TRANSIT to receive', 400)
      }

      const items = await repo.findTransferItems(id)

      // Validate source has enough available stock for each item
      for (const item of items) {
        const stock = await repo.findByVariantAndLocation(item.variantId, t.fromLocationId)
        if ((stock?.quantity ?? 0) < item.quantity) {
          throw new ServiceError(`Insufficient stock for variant ${item.variantId} at source location`, 400)
        }
      }

      // Apply stock movements atomically (D1 doesn't support multi-statement transactions; run sequentially)
      for (const item of items) {
        await repo.decrementStock(item.variantId, t.fromLocationId, item.quantity)
        await repo.incrementStock(item.variantId, t.toLocationId, item.quantity)
        await repo.createMovement({ variantId: item.variantId, locationId: t.fromLocationId, movementType: 'TRANSFER_OUT', quantity: -item.quantity, referenceType: 'transfer', referenceId: id })
        await repo.createMovement({ variantId: item.variantId, locationId: t.toLocationId, movementType: 'TRANSFER_IN', quantity: item.quantity, referenceType: 'transfer', referenceId: id })
      }

      return repo.updateTransferStatus(id, 'RECEIVED', receivedBy)
    },

    async cancelTransfer(id: string) {
      const t = await repo.findTransferById(id)
      if (!t) throw new ServiceError('Transfer not found', 404)
      if (t.status === 'RECEIVED') throw new ServiceError('Received transfers cannot be cancelled', 400)
      return repo.updateTransferStatus(id, 'CANCELLED')
    },
  }
}
