import { eq, and, sql } from 'drizzle-orm'
import { inventory, inventoryMovement, transfer, transferItem } from '@repo/database/schema'
import type { Database, NewInventory, NewInventoryMovement, NewTransfer, NewTransferItem } from '@repo/database'
import { generateId } from '../utils/id'

export function createInventoryRepository(db: Database, organizationId: string) {
  const inventoryScope = eq(inventory.organizationId, organizationId)
  const movementScope = eq(inventoryMovement.organizationId, organizationId)
  const transferScope = eq(transfer.organizationId, organizationId)

  return {
    // ── Inventory stock ──────────────────────────────────────────────────────

    findByVariantAndLocation(variantId: string, locationId: string) {
      return db.select().from(inventory)
        .where(and(inventoryScope, eq(inventory.variantId, variantId), eq(inventory.locationId, locationId)))
        .then(r => r[0] ?? null)
    },

    findByVariant(variantId: string) {
      return db.select().from(inventory)
        .where(and(inventoryScope, eq(inventory.variantId, variantId)))
    },

    findByLocation(locationId: string) {
      return db.select().from(inventory)
        .where(and(inventoryScope, eq(inventory.locationId, locationId)))
    },

    async upsertStock(variantId: string, locationId: string, quantity: number) {
      const existing = await this.findByVariantAndLocation(variantId, locationId)
      const now = new Date()
      if (existing) {
        await db.update(inventory)
          .set({ quantity, updatedAt: now })
          .where(and(inventoryScope, eq(inventory.variantId, variantId), eq(inventory.locationId, locationId)))
        return this.findByVariantAndLocation(variantId, locationId)
      }
      const row: NewInventory = { id: generateId(), organizationId, variantId, locationId, quantity, createdAt: now, updatedAt: now }
      await db.insert(inventory).values(row)
      return row
    },

    async incrementStock(variantId: string, locationId: string, delta: number) {
      const now = new Date()
      await db.update(inventory)
        .set({ quantity: sql`${inventory.quantity} + ${delta}`, updatedAt: now })
        .where(and(inventoryScope, eq(inventory.variantId, variantId), eq(inventory.locationId, locationId)))
    },

    async decrementStock(variantId: string, locationId: string, delta: number) {
      const now = new Date()
      // quantity never goes below 0 — enforced at service layer before calling this
      await db.update(inventory)
        .set({ quantity: sql`MAX(0, ${inventory.quantity} - ${delta})`, updatedAt: now })
        .where(and(inventoryScope, eq(inventory.variantId, variantId), eq(inventory.locationId, locationId)))
    },

    // ── Movements (immutable ledger) ─────────────────────────────────────────

    async createMovement(data: Omit<NewInventoryMovement, 'id' | 'organizationId' | 'createdAt'>) {
      const row: NewInventoryMovement = { ...data, id: generateId(), organizationId, createdAt: new Date() }
      await db.insert(inventoryMovement).values(row)
      return row
    },

    findMovements(variantId?: string, locationId?: string) {
      const conditions = [movementScope]
      if (variantId) conditions.push(eq(inventoryMovement.variantId, variantId))
      if (locationId) conditions.push(eq(inventoryMovement.locationId, locationId))
      return db.select().from(inventoryMovement)
        .where(and(...conditions))
        .orderBy(sql`${inventoryMovement.createdAt} DESC`)
    },

    // ── Transfers ────────────────────────────────────────────────────────────

    findTransfers(status?: Transfer['status']) {
      const where = status
        ? and(transferScope, eq(transfer.status, status))
        : transferScope
      return db.select().from(transfer).where(where).orderBy(sql`${transfer.createdAt} DESC`)
    },

    findTransferById(id: string) {
      return db.select().from(transfer).where(and(transferScope, eq(transfer.id, id))).then(r => r[0] ?? null)
    },

    findTransferItems(transferId: string) {
      return db.select().from(transferItem).where(eq(transferItem.transferId, transferId))
    },

    async createTransfer(data: Omit<NewTransfer, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewTransfer = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(transfer).values(row)
      return row
    },

    async addTransferItem(data: Omit<NewTransferItem, 'id' | 'createdAt'>) {
      const row: NewTransferItem = { ...data, id: generateId(), createdAt: new Date() }
      await db.insert(transferItem).values(row)
      return row
    },

    async updateTransferStatus(id: string, status: Transfer['status'], by?: string) {
      const patch: Partial<NewTransfer> = { status, updatedAt: new Date() }
      if (status === 'APPROVED' && by) patch.approvedBy = by
      if (status === 'RECEIVED' && by) patch.receivedBy = by
      await db.update(transfer).set(patch).where(and(transferScope, eq(transfer.id, id)))
      return this.findTransferById(id)
    },
  }
}

type Transfer = typeof transfer.$inferSelect
export type InventoryRepository = ReturnType<typeof createInventoryRepository>
