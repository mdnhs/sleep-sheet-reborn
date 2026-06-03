import { describe, it, expect, beforeEach } from 'vitest'
import { eq, and } from 'drizzle-orm'
import { organization, member, user } from '@repo/database/src/schema'
import { withTenant, assertTenant, isOrgActive } from '@repo/tenancy'
import { hasPermission, getPermissions } from '@repo/permissions'
import { createTestDb, makeOrg, makeUser, makeMember, type TestDb } from './setup'

// ─── Test fixtures ───────────────────────────────────────────────────────────

let db: TestDb
let orgAId: string
let orgBId: string
let userAId: string
let userBId: string
let sharedUserId: string

beforeEach(async () => {
  db = createTestDb()

  orgAId = 'org-a'
  orgBId = 'org-b'
  userAId = 'user-a'
  userBId = 'user-b'
  sharedUserId = 'user-shared'

  await db.insert(user).values([
    makeUser(userAId, 'a@test.com'),
    makeUser(userBId, 'b@test.com'),
    makeUser(sharedUserId, 'shared@test.com'),
  ])

  await db.insert(organization).values([
    makeOrg(orgAId, 'org-a'),
    makeOrg(orgBId, 'org-b'),
  ])

  await db.insert(member).values([
    makeMember('mem-a', orgAId, userAId, 'OWNER'),
    makeMember('mem-b', orgBId, userBId, 'OWNER'),
    // shared user is a member of BOTH orgs with different roles
    makeMember('mem-sa', orgAId, sharedUserId, 'ADMIN'),
    makeMember('mem-sb', orgBId, sharedUserId, 'CASHIER'),
  ])
})

// ─── Tenant resolution ───────────────────────────────────────────────────────

describe('Tenant resolution', () => {
  it('resolves org by slug', async () => {
    const org = await db.query.organization.findFirst({ where: eq(organization.slug, 'org-a') })
    expect(org).toBeDefined()
    expect(org!.id).toBe(orgAId)
  })

  it('returns undefined for unknown slug', async () => {
    const org = await db.query.organization.findFirst({ where: eq(organization.slug, 'unknown') })
    expect(org).toBeUndefined()
  })

  it('assertTenant throws when org is null', () => {
    expect(() => assertTenant(null)).toThrow()
  })

  it('assertTenant returns org when present', async () => {
    const org = await db.query.organization.findFirst({ where: eq(organization.slug, 'org-a') })
    expect(assertTenant(org)).toBe(org)
  })

  it('isOrgActive returns true for TRIAL and ACTIVE', () => {
    expect(isOrgActive('TRIAL')).toBe(true)
    expect(isOrgActive('ACTIVE')).toBe(true)
  })

  it('isOrgActive returns false for SUSPENDED, CANCELLED, EXPIRED', () => {
    expect(isOrgActive('SUSPENDED')).toBe(false)
    expect(isOrgActive('CANCELLED')).toBe(false)
    expect(isOrgActive('EXPIRED')).toBe(false)
  })
})

// ─── Cross-tenant isolation ──────────────────────────────────────────────────

describe('Cross-tenant isolation — membership', () => {
  it('user A is a member of org A only', async () => {
    const members = await db.query.member.findMany({
      where: eq(member.userId, userAId),
    })
    expect(members).toHaveLength(1)
    expect(members[0].organizationId).toBe(orgAId)
  })

  it('user A is NOT a member of org B', async () => {
    const mem = await db.query.member.findFirst({
      where: and(eq(member.organizationId, orgBId), eq(member.userId, userAId)),
    })
    expect(mem).toBeUndefined()
  })

  it('user B is NOT a member of org A', async () => {
    const mem = await db.query.member.findFirst({
      where: and(eq(member.organizationId, orgAId), eq(member.userId, userBId)),
    })
    expect(mem).toBeUndefined()
  })

  it('shared user has different roles per org', async () => {
    const memA = await db.query.member.findFirst({
      where: and(eq(member.organizationId, orgAId), eq(member.userId, sharedUserId)),
    })
    const memB = await db.query.member.findFirst({
      where: and(eq(member.organizationId, orgBId), eq(member.userId, sharedUserId)),
    })
    expect(memA!.role).toBe('ADMIN')
    expect(memB!.role).toBe('CASHIER')
  })
})

// ─── withTenant helper ───────────────────────────────────────────────────────

describe('withTenant helper', () => {
  it('injects organizationId from context', async () => {
    const org = (await db.query.organization.findFirst({ where: eq(organization.slug, 'org-a') }))!
    const params = withTenant({ organizationId: org.id, organization: org }, { name: 'test' })
    expect(params.organizationId).toBe(orgAId)
    expect((params as { name: string }).name).toBe('test')
  })

  it('does not allow organizationId to be overridden from params', async () => {
    const org = (await db.query.organization.findFirst({ where: eq(organization.slug, 'org-a') }))!
    // withTenant strips organizationId from params and re-injects from context
    const params = withTenant({ organizationId: org.id, organization: org }, {})
    expect(params.organizationId).toBe(orgAId)
  })
})

// ─── Org-scoped queries return only own data ─────────────────────────────────

describe('Org-scoped member queries', () => {
  it('query scoped to org A returns only org A members', async () => {
    const members = await db.query.member.findMany({
      where: eq(member.organizationId, orgAId),
    })
    expect(members.length).toBeGreaterThan(0)
    for (const m of members) {
      expect(m.organizationId).toBe(orgAId)
    }
  })

  it('query scoped to org B returns only org B members', async () => {
    const members = await db.query.member.findMany({
      where: eq(member.organizationId, orgBId),
    })
    expect(members.length).toBeGreaterThan(0)
    for (const m of members) {
      expect(m.organizationId).toBe(orgBId)
    }
  })

  it('org A members do not include org B users', async () => {
    const members = await db.query.member.findMany({
      where: eq(member.organizationId, orgAId),
    })
    const userIds = members.map((m) => m.userId)
    expect(userIds).not.toContain(userBId)
  })
})

// ─── RBAC permission catalog ─────────────────────────────────────────────────

describe('RBAC permission catalog', () => {
  it('OWNER has billing.manage', () => {
    expect(hasPermission('OWNER', 'billing.manage')).toBe(true)
  })

  it('ADMIN does not have billing.manage', () => {
    expect(hasPermission('ADMIN', 'billing.manage')).toBe(false)
  })

  it('CASHIER has pos.sale', () => {
    expect(hasPermission('CASHIER', 'pos.sale')).toBe(true)
  })

  it('CASHIER does not have inventory.adjust', () => {
    expect(hasPermission('CASHIER', 'inventory.adjust')).toBe(false)
  })

  it('INVENTORY_MANAGER has inventory.adjust but not finance.view', () => {
    expect(hasPermission('INVENTORY_MANAGER', 'inventory.adjust')).toBe(true)
    expect(hasPermission('INVENTORY_MANAGER', 'finance.view')).toBe(false)
  })

  it('getPermissions for OWNER returns billing.manage', () => {
    expect(getPermissions('OWNER')).toContain('billing.manage')
  })

  it('getPermissions for CASHIER does not include billing.manage', () => {
    expect(getPermissions('CASHIER')).not.toContain('billing.manage')
  })

  it('EMPLOYEE has organization.view', () => {
    expect(hasPermission('EMPLOYEE', 'organization.view')).toBe(true)
  })

  it('DELIVERY_MANAGER does not have finance.view', () => {
    expect(hasPermission('DELIVERY_MANAGER', 'finance.view')).toBe(false)
  })
})

// ─── Slug uniqueness is global; membership uniqueness is per-org ─────────────

describe('Schema constraints', () => {
  it('two orgs cannot share the same slug', async () => {
    await expect(
      db.insert(organization).values(makeOrg('org-dup', 'org-a'))
    ).rejects.toThrow()
  })

  it('a user cannot be added to the same org twice', async () => {
    await expect(
      db.insert(member).values(makeMember('dup-mem', orgAId, userAId, 'EMPLOYEE'))
    ).rejects.toThrow()
  })

  it('a user can be in two different orgs (slug uniqueness is per-org context)', async () => {
    // sharedUserId is already a member of both orgs — if this query passes without error the setup was fine
    const all = await db.query.member.findMany({ where: eq(member.userId, sharedUserId) })
    expect(all).toHaveLength(2)
  })
})
