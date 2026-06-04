import { eq, and, desc } from 'drizzle-orm'
import { auditLog } from '@repo/database/schema'
import type { Database } from '@repo/database'
import { generateId } from '../utils/id'

export function createAuditLogRepository(db: Database, organizationId: string) {
  const scope = eq(auditLog.organizationId, organizationId)

  return {
    async log(
      entityType: string,
      entityId: string,
      action: string,
      actorId: string | undefined | null,
      changes?: Record<string, unknown>,
    ) {
      const row = {
        id: generateId(),
        organizationId,
        entityType,
        entityId,
        action,
        actorId: actorId ?? null,
        changes: changes ? JSON.stringify(changes) : null,
        createdAt: new Date(),
      }
      await db.insert(auditLog).values(row)
      return row
    },

    findByEntity(entityType: string, entityId: string, limit = 50) {
      return db.select().from(auditLog)
        .where(and(scope, eq(auditLog.entityType, entityType), eq(auditLog.entityId, entityId)))
        .orderBy(desc(auditLog.createdAt))
        .limit(limit)
    },

    findByOrg(limit = 100) {
      return db.select().from(auditLog)
        .where(scope)
        .orderBy(desc(auditLog.createdAt))
        .limit(limit)
    },
  }
}

export type AuditLogRepository = ReturnType<typeof createAuditLogRepository>
