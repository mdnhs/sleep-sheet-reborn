import type { Database } from '@repo/database'
import { createProductVariantRepository } from '../../repositories/product-variants.repository'
import { createProductRepository } from '../../repositories/products.repository'
import { ServiceError } from '../../utils/service-error'

export function createProductVariantService(db: Database, organizationId: string) {
  const repo = createProductVariantRepository(db, organizationId)
  const productRepo = createProductRepository(db, organizationId)

  return {
    async getById(id: string) {
      const variant = await repo.findById(id)
      if (!variant) throw new ServiceError('Variant not found', 404)
      return variant
    },

    async create(productId: string, data: {
      name: string
      sku: string
      barcode?: string
      unitId?: string
      costPrice?: number
      sellingPrice?: number
    }) {
      const product = await productRepo.findById(productId)
      if (!product) throw new ServiceError('Product not found', 404)

      const skuConflict = await repo.findBySku(data.sku)
      if (skuConflict) throw new ServiceError('SKU already in use within this organization', 409)

      if (data.barcode) {
        const barcodeConflict = await repo.findByBarcode(data.barcode)
        if (barcodeConflict) throw new ServiceError('Barcode already in use within this organization', 409)
      }

      return repo.create({
        productId,
        name: data.name,
        sku: data.sku,
        barcode: data.barcode ?? null,
        unitId: data.unitId ?? null,
        costPrice: data.costPrice ?? 0,
        sellingPrice: data.sellingPrice ?? 0,
        status: 'ACTIVE',
      })
    },

    async update(id: string, data: {
      name?: string
      sku?: string
      barcode?: string | null
      unitId?: string | null
      costPrice?: number
      sellingPrice?: number
    }) {
      const variant = await repo.findById(id)
      if (!variant) throw new ServiceError('Variant not found', 404)

      if (data.sku && data.sku !== variant.sku) {
        const conflict = await repo.findBySku(data.sku)
        if (conflict) throw new ServiceError('SKU already in use within this organization', 409)
      }

      if (data.barcode && data.barcode !== variant.barcode) {
        const conflict = await repo.findByBarcode(data.barcode)
        if (conflict) throw new ServiceError('Barcode already in use within this organization', 409)
      }

      return repo.update(id, data)
    },

    async deactivate(id: string) {
      const variant = await repo.findById(id)
      if (!variant) throw new ServiceError('Variant not found', 404)
      return repo.deactivate(id)
    },
  }
}
