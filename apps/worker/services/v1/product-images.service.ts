import type { Database } from '@repo/database'
import { createProductImageRepository } from '../../repositories/product-images.repository'
import { createProductRepository } from '../../repositories/products.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { imageStorage } from '../../integrations/cloudinary'
import { deleteImageFromStorage } from '../../integrations/cloudinary-delete'
import { ServiceError } from '../../utils/service-error'

export function createProductImageService(db: Database, organizationId: string, actorId?: string | null) {
  const repo = createProductImageRepository(db, organizationId)
  const productRepo = createProductRepository(db, organizationId)
  const auditRepo = createAuditLogRepository(db, organizationId)

  return {
    async list(productId: string) {
      const product = await productRepo.findById(productId)
      if (!product) throw new ServiceError('Product not found', 404)
      return repo.findByProduct(productId)
    },

    async upload(productId: string, file: File) {
      const product = await productRepo.findById(productId)
      if (!product) throw new ServiceError('Product not found', 404)

      if (!file.type.startsWith('image/')) throw new ServiceError('File must be an image', 400)
      if (file.size > 5 * 1024 * 1024) throw new ServiceError('Image must be under 5 MB', 400)

      const existing = await repo.findByProduct(productId)
      const saved = await imageStorage(file)
      const image = await repo.create({
        productId,
        cloudinaryPublicId: saved.filename,
        url: saved.url,
        sortOrder: existing.length,
      })

      await auditRepo.log('product_image', image.id, 'upload', actorId, { productId, url: saved.url })
      return image
    },

    async delete(productId: string, imageId: string) {
      const image = await repo.findById(imageId)
      if (!image || image.productId !== productId) throw new ServiceError('Image not found', 404)

      await deleteImageFromStorage(image.url)
      await repo.delete(imageId)
      await auditRepo.log('product_image', imageId, 'delete', actorId, { productId })
    },
  }
}
