import { Hono } from 'hono'
import type { HonoEnv } from '../../src/types'
import billing from './billing'
import organizations from './organizations'
import analytics from './analytics'
import marketplace from './marketplace'
import demoDatasets from './demo-datasets'

const admin = new Hono<HonoEnv>()
  .route('/billing', billing)
  .route('/organizations', organizations)
  .route('/analytics', analytics)
  .route('/marketplace', marketplace)
  .route('/demo-datasets', demoDatasets)

export default admin
