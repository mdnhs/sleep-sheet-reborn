import { Hono } from 'hono'
import type { HonoEnv } from '../../src/types'
import categories from './categories'
import brands from './brands'
import units from './units'
import products from './products'
import locations from './locations'
import inventory from './inventory'
import suppliers from './suppliers'
import purchases from './purchases'
import purchaseReturns from './purchase-returns'

const v1 = new Hono<HonoEnv>()
  .route('/categories', categories)
  .route('/brands', brands)
  .route('/units', units)
  .route('/products', products)
  .route('/locations', locations)
  .route('/inventory', inventory)
  .route('/suppliers', suppliers)
  .route('/purchase-orders', purchases)
  .route('/purchase-returns', purchaseReturns)

export default v1
