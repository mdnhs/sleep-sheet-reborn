import { Hono } from 'hono'
import type { HonoEnv } from '../../src/types'
import billing from './billing'

const admin = new Hono<HonoEnv>()
  .route('/billing', billing)

export default admin
