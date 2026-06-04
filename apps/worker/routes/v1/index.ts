import { Hono } from 'hono'
import type { HonoEnv } from '../../src/types'
import categories from './categories'
import brands from './brands'
import units from './units'
import products from './products'
import locations from './locations'
import inventory from './inventory'

const v1 = new Hono<HonoEnv>()
  .route('/categories', categories)
  .route('/brands', brands)
  .route('/units', units)
  .route('/products', products)
  .route('/locations', locations)
  .route('/inventory', inventory)

export default v1
