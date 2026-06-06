import { eq, and } from 'drizzle-orm'
import { featureFlag } from '@repo/database/schema'
import type { Database, NewFeatureFlag } from '@repo/database'
import { generateId } from '../utils/id'

export function createFeatureFlagsRepository(db: Database, organizationId: string) {
  const scope = eq(featureFlag.organizationId, organizationId)

  return {
    findMany() {
      return db.select().from(featureFlag).where(scope)
    },

    findByFlag(flag: string) {
      return db.select().from(featureFlag)
        .where(and(scope, eq(featureFlag.flag, flag)))
        .then(r => r[0] ?? null)
    },

    async upsert(flag: string, enabled: boolean) {
      const existing = await this.findByFlag(flag)
      if (existing) {
        await db.update(featureFlag)
          .set({ enabled, updatedAt: new Date() })
          .where(and(scope, eq(featureFlag.flag, flag)))
        return { ...existing, enabled }
      }
      const row: NewFeatureFlag = {
        id: generateId(),
        organizationId,
        flag,
        enabled,
        updatedAt: new Date(),
      }
      await db.insert(featureFlag).values(row)
      return row
    },
  }
}

export type FeatureFlagsRepository = ReturnType<typeof createFeatureFlagsRepository>
