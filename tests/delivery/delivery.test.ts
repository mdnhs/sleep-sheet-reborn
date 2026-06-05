import { describe, it, expect, beforeEach } from 'vitest'
import { organization, location, order, deliveryPartner, rider, shipment } from '@repo/database/src/schema'
import { createDeliveryPartnersRepository } from '../../apps/worker/repositories/delivery-partners.repository'
import { createRidersRepository } from '../../apps/worker/repositories/riders.repository'
import { createShipmentsRepository } from '../../apps/worker/repositories/shipments.repository'
import { createDeliveryService } from '../../apps/worker/services/v1/delivery.service'
import {
  createTestDb, makeOrg, makeLocation, makeOrder, makePartner, makeRider, makeShipment, type TestDb,
} from './setup'

let db: TestDb
const ORG_A = 'org-a'
const ORG_B = 'org-b'

beforeEach(async () => {
  db = createTestDb()
  await db.insert(organization).values([makeOrg(ORG_A, 'org-a'), makeOrg(ORG_B, 'org-b')])
  await db.insert(location).values([makeLocation('loc-a', ORG_A, 'WH-A'), makeLocation('loc-b', ORG_B, 'WH-B')])
  await db.insert(order).values([
    makeOrder('ord-a', ORG_A, 'loc-a', 'ORD-A-1'),
    makeOrder('ord-b', ORG_B, 'loc-b', 'ORD-B-1'),
  ])
})

// ─── Partner / rider isolation ──────────────────────────────────────────────────

describe('Delivery partner & rider isolation', () => {
  beforeEach(async () => {
    await db.insert(deliveryPartner).values([makePartner('p-a', ORG_A, 'Pathao'), makePartner('p-b', ORG_B, 'RedX')])
    await db.insert(rider).values([makeRider('r-a', ORG_A, 'Karim', '0171'), makeRider('r-b', ORG_B, 'Rahim', '0172')])
  })

  it('partner repo A sees only org A', async () => {
    const repo = createDeliveryPartnersRepository(db as any, ORG_A)
    const rows = await repo.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0].organizationId).toBe(ORG_A)
  })

  it('partner findById cross-tenant returns null', async () => {
    const repo = createDeliveryPartnersRepository(db as any, ORG_A)
    expect(await repo.findById('p-b')).toBeNull()
  })

  it('rider repo B sees only org B', async () => {
    const repo = createRidersRepository(db as any, ORG_B)
    const rows = await repo.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0].organizationId).toBe(ORG_B)
  })

  it('rider update cross-tenant is a no-op', async () => {
    const repoA = createRidersRepository(db as any, ORG_A)
    const repoB = createRidersRepository(db as any, ORG_B)
    await repoA.update('r-b', { status: 'INACTIVE' })
    expect((await repoB.findById('r-b'))?.status).toBe('AVAILABLE')
  })
})

// ─── Shipment isolation ─────────────────────────────────────────────────────────

describe('Shipment isolation', () => {
  beforeEach(async () => {
    await db.insert(shipment).values([
      makeShipment('s-a', ORG_A, 'ord-a', 'TRK-000001'),
      makeShipment('s-b', ORG_B, 'ord-b', 'TRK-000001'), // same tracking, different org — allowed
    ])
  })

  it('repo A sees only org A shipments', async () => {
    const repo = createShipmentsRepository(db as any, ORG_A)
    const rows = await repo.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0].organizationId).toBe(ORG_A)
  })

  it('findById cross-tenant returns null', async () => {
    const repo = createShipmentsRepository(db as any, ORG_A)
    expect(await repo.findById('s-b')).toBeNull()
  })

  it('findByTracking scoped to org', async () => {
    const repoA = createShipmentsRepository(db as any, ORG_A)
    const repoB = createShipmentsRepository(db as any, ORG_B)
    expect((await repoA.findByTracking('TRK-000001'))?.id).toBe('s-a')
    expect((await repoB.findByTracking('TRK-000001'))?.id).toBe('s-b')
  })

  it('same tracking allowed across orgs, duplicate within org rejected', async () => {
    await expect(
      db.insert(shipment).values(makeShipment('dup', ORG_A, 'ord-a', 'TRK-000001'))
    ).rejects.toThrow()
  })

  it('events are org-scoped', async () => {
    const repoA = createShipmentsRepository(db as any, ORG_A)
    await repoA.addEvent({ shipmentId: 's-a', status: 'CREATED' })
    const repoB = createShipmentsRepository(db as any, ORG_B)
    expect(await repoB.findEvents('s-a')).toHaveLength(0)
    expect(await repoA.findEvents('s-a')).toHaveLength(1)
  })
})

// ─── Service lifecycle ──────────────────────────────────────────────────────────

describe('Delivery service lifecycle', () => {
  it('create → assign rider → pickup → transit produces events and marks rider busy', async () => {
    const svc = createDeliveryService(db as any, ORG_A)
    await db.insert(rider).values(makeRider('r-a', ORG_A, 'Karim', '0171'))

    const s = await svc.createShipment({ orderId: 'ord-a' })
    expect(s.status).toBe('CREATED')

    await svc.assignRider(s.id, 'r-a')
    let detail = await svc.getShipment(s.id)
    expect(detail.status).toBe('ASSIGNED')
    expect(detail.riderId).toBe('r-a')
    const r = await createRidersRepository(db as any, ORG_A).findById('r-a')
    expect(r?.status).toBe('BUSY')

    await svc.pickup(s.id)
    await svc.transit(s.id)
    detail = await svc.getShipment(s.id)
    expect(detail.status).toBe('IN_TRANSIT')
    expect(detail.events.length).toBeGreaterThanOrEqual(4) // created, assigned, picked_up, in_transit
  })

  it('rejects a second shipment for the same order', async () => {
    const svc = createDeliveryService(db as any, ORG_A)
    await svc.createShipment({ orderId: 'ord-a' })
    await expect(svc.createShipment({ orderId: 'ord-a' })).rejects.toMatchObject({ status: 409 })
  })

  it('cannot create shipment for a cancelled order', async () => {
    await db.update(order).set({ status: 'CANCELLED' }).where((await import('drizzle-orm')).eq(order.id, 'ord-a'))
    const svc = createDeliveryService(db as any, ORG_A)
    await expect(svc.createShipment({ orderId: 'ord-a' })).rejects.toMatchObject({ status: 400 })
  })

  it('fail then return-to-origin transitions', async () => {
    const svc = createDeliveryService(db as any, ORG_A)
    await db.insert(rider).values(makeRider('r-a', ORG_A, 'Karim', '0171'))
    const s = await svc.createShipment({ orderId: 'ord-a' })
    await svc.assignRider(s.id, 'r-a')
    await svc.pickup(s.id)
    await svc.fail(s.id, 'Customer unavailable')
    expect((await svc.getShipment(s.id)).status).toBe('FAILED')
    await svc.returnToOrigin(s.id)
    expect((await svc.getShipment(s.id)).status).toBe('RETURNED')
  })

  it('deliver requires the order to be SHIPPED (order workflow guard)', async () => {
    const svc = createDeliveryService(db as any, ORG_A)
    await db.insert(rider).values(makeRider('r-a', ORG_A, 'Karim', '0171'))
    const s = await svc.createShipment({ orderId: 'ord-a' }) // order is CONFIRMED, not SHIPPED
    await svc.assignRider(s.id, 'r-a')
    await svc.pickup(s.id)
    await expect(svc.deliver(s.id, 'user-1')).rejects.toMatchObject({ status: 400 })
  })

  it('courier status sync records an immutable event', async () => {
    const svc = createDeliveryService(db as any, ORG_A)
    const s = await svc.createShipment({ orderId: 'ord-a' })
    await svc.syncCourierStatus(s.id, 'in_transit', 'left hub')
    const detail = await svc.getShipment(s.id)
    expect(detail.courierStatus).toBe('in_transit')
    expect(detail.events.some(e => e.status === 'COURIER_UPDATE')).toBe(true)
  })

  it('createShipment is org-scoped — org B cannot see org A shipment', async () => {
    const svcA = createDeliveryService(db as any, ORG_A)
    const svcB = createDeliveryService(db as any, ORG_B)
    await svcA.createShipment({ orderId: 'ord-a' })
    expect(await svcB.listShipments()).toHaveLength(0)
  })
})
