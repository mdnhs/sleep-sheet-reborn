import { describe, it, expect, beforeEach } from 'vitest'
import { organization } from '@repo/database/src/schema'
import { createNotificationsService } from '../../apps/worker/services/v1/notifications.service'
import { createNotificationsRepository } from '../../apps/worker/repositories/notifications.repository'
import { createTestDb, makeOrg, type TestDb } from './setup'

let db: TestDb
const ORG_A = 'org-a'
const ORG_B = 'org-b'
const USER_1 = 'user-1'
const USER_2 = 'user-2'
const svc = (org: string) => createNotificationsService(db as any, org)

beforeEach(async () => {
  db = createTestDb()
  await db.insert(organization).values([makeOrg(ORG_A, 'org-a'), makeOrg(ORG_B, 'org-b')])
})

describe('Notifications', () => {
  it('create + feed returns item with unread count', async () => {
    await svc(ORG_A).create({ title: 'Order placed', userId: USER_1 })
    const feed = await svc(ORG_A).feed(USER_1)
    expect(feed.items).toHaveLength(1)
    expect(feed.unread).toBe(1)
  })

  it('requires a title', async () => {
    await expect(svc(ORG_A).create({ title: '   ' })).rejects.toThrow(/title is required/i)
  })

  it('markRead flips read and lowers unread count', async () => {
    const n = await svc(ORG_A).create({ title: 'X', userId: USER_1 })
    await svc(ORG_A).markRead(n.id)
    const feed = await svc(ORG_A).feed(USER_1)
    expect(feed.unread).toBe(0)
    expect(feed.items[0].read).toBe(true)
  })

  it('markAllRead clears the user feed', async () => {
    await svc(ORG_A).create({ title: 'a', userId: USER_1 })
    await svc(ORG_A).create({ title: 'b', userId: USER_1 })
    await svc(ORG_A).markAllRead(USER_1)
    expect((await svc(ORG_A).feed(USER_1)).unread).toBe(0)
  })

  it('user sees own + broadcast, not another user notifications', async () => {
    await svc(ORG_A).create({ title: 'mine', userId: USER_1 })
    await svc(ORG_A).create({ title: 'broadcast' }) // userId null = org-wide
    await svc(ORG_A).create({ title: 'theirs', userId: USER_2 })
    const feed = await svc(ORG_A).feed(USER_1)
    const titles = feed.items.map(i => i.title).sort()
    expect(titles).toEqual(['broadcast', 'mine'])
  })

  it('is org-scoped — other tenant notifications excluded', async () => {
    await svc(ORG_B).create({ title: 'b-note' })
    const repoA = createNotificationsRepository(db as any, ORG_A)
    expect(await repoA.findMany({ limit: 100 })).toHaveLength(0)
  })

  it('markRead cross-tenant is a no-op / 404', async () => {
    const n = await svc(ORG_A).create({ title: 'a' })
    await expect(svc(ORG_B).markRead(n.id)).rejects.toThrow(/not found/i)
  })
})
