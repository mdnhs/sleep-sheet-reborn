import { eq, and, desc, asc, sql } from 'drizzle-orm'
import { funnelTemplate, funnel, funnelStep, funnelVisit, funnelConversion } from '@repo/database/schema'
import type {
  Database, NewFunnel, Funnel, NewFunnelStep, FunnelStep, NewFunnelVisit, NewFunnelConversion,
} from '@repo/database'
import { generateId } from '../utils/id'

export function createFunnelsRepository(db: Database, organizationId: string) {
  const scope = eq(funnel.organizationId, organizationId)
  const stepScope = eq(funnelStep.organizationId, organizationId)
  const visitScope = eq(funnelVisit.organizationId, organizationId)
  const convScope = eq(funnelConversion.organizationId, organizationId)

  return {
    // Templates (global catalog)
    listTemplates() {
      return db.select().from(funnelTemplate).where(eq(funnelTemplate.status, 'ACTIVE')).orderBy(funnelTemplate.name)
    },
    findTemplate(id: string) {
      return db.select().from(funnelTemplate).where(eq(funnelTemplate.id, id)).then(r => r[0] ?? null)
    },

    // Funnels
    findMany(status?: Funnel['status']) {
      const where = status ? and(scope, eq(funnel.status, status)) : scope
      return db.select().from(funnel).where(where).orderBy(desc(funnel.createdAt))
    },
    findById(id: string) {
      return db.select().from(funnel).where(and(scope, eq(funnel.id, id))).then(r => r[0] ?? null)
    },
    findBySlug(slug: string) {
      return db.select().from(funnel).where(and(scope, eq(funnel.slug, slug))).then(r => r[0] ?? null)
    },
    async create(data: Omit<NewFunnel, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewFunnel = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(funnel).values(row)
      return row
    },
    async update(id: string, data: Partial<Omit<NewFunnel, 'id' | 'organizationId' | 'createdAt'>>) {
      await db.update(funnel).set({ ...data, updatedAt: new Date() }).where(and(scope, eq(funnel.id, id)))
      return this.findById(id)
    },

    // Steps
    findSteps(funnelId: string) {
      return db.select().from(funnelStep).where(and(stepScope, eq(funnelStep.funnelId, funnelId))).orderBy(asc(funnelStep.position))
    },
    findStep(id: string) {
      return db.select().from(funnelStep).where(and(stepScope, eq(funnelStep.id, id))).then(r => r[0] ?? null)
    },
    async addStep(data: Omit<NewFunnelStep, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewFunnelStep = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(funnelStep).values(row)
      return row
    },
    async updateStep(id: string, data: Partial<Pick<FunnelStep, 'type' | 'position' | 'config'>>) {
      await db.update(funnelStep).set({ ...data, updatedAt: new Date() }).where(and(stepScope, eq(funnelStep.id, id)))
      return this.findStep(id)
    },
    async deleteStep(id: string) {
      await db.delete(funnelStep).where(and(stepScope, eq(funnelStep.id, id)))
    },

    // Visits (UTM)
    async addVisit(data: Omit<NewFunnelVisit, 'id' | 'organizationId' | 'createdAt'>) {
      const row: NewFunnelVisit = { ...data, id: generateId(), organizationId, createdAt: new Date() }
      await db.insert(funnelVisit).values(row)
      return row
    },

    // Conversions
    findConversionByOrder(funnelId: string, orderId: string) {
      return db.select().from(funnelConversion)
        .where(and(convScope, eq(funnelConversion.funnelId, funnelId), eq(funnelConversion.orderId, orderId)))
        .then(r => r[0] ?? null)
    },
    async addConversion(data: Omit<NewFunnelConversion, 'id' | 'organizationId' | 'createdAt'>) {
      const row: NewFunnelConversion = { ...data, id: generateId(), organizationId, createdAt: new Date() }
      await db.insert(funnelConversion).values(row)
      return row
    },

    // Analytics (live aggregates)
    async stats(funnelId: string) {
      const v = await db.select({ n: sql<number>`COUNT(*)` }).from(funnelVisit).where(and(visitScope, eq(funnelVisit.funnelId, funnelId)))
      const c = await db.select({ n: sql<number>`COUNT(*)`, rev: sql<number>`COALESCE(SUM(${funnelConversion.revenue}),0)` })
        .from(funnelConversion).where(and(convScope, eq(funnelConversion.funnelId, funnelId)))
      const visitors = v[0]?.n ?? 0
      const orders = c[0]?.n ?? 0
      const revenue = c[0]?.rev ?? 0
      return { visitors, orders, revenue, conversionRate: visitors ? Math.round((orders / visitors) * 10000) / 100 : 0 }
    },
  }
}

export type FunnelsRepository = ReturnType<typeof createFunnelsRepository>
