import { Hono } from 'hono'
import type { HonoEnv } from '../../src/types'
import billing from './billing'
import organizations from './organizations'
import analytics from './analytics'
import marketplace from './marketplace'

const admin = new Hono<HonoEnv>()
  .route('/billing', billing)
  .route('/organizations', organizations)
  .route('/analytics', analytics)
  .route('/marketplace', marketplace)

export default admin
