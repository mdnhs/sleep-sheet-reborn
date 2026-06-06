import { Hono } from 'hono'
import { requirePlatformAdmin } from '../../middleware/rbac'
import { createPlatformAdminService } from '../../services/v1/platform-admin.service'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const app = new Hono<HonoEnv>()
  .use('*', requirePlatformAdmin)
  .get('/', async (c) => {
    try { return c.json(ok(await createPlatformAdminService(c.get('db')).getAnalytics())) }
    catch { return c.json(err('INTERNAL_ERROR', 'Failed to load analytics'), 500) }
  })

export default app
