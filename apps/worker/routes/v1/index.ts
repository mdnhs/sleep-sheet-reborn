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
import orders from './orders'
import orderRefunds from './order-refunds'
import orderReturns from './order-returns'
import cashRegisters from './cash-registers'
import registerSessions from './register-sessions'
import posSales from './pos-sales'
import posSaleReturns from './pos-sale-returns'

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
  .route('/orders', orders)
  .route('/order-refunds', orderRefunds)
  .route('/order-returns', orderReturns)
  .route('/cash-registers', cashRegisters)
  .route('/register-sessions', registerSessions)
  .route('/pos-sales', posSales)
  .route('/pos-sale-returns', posSaleReturns)

export default v1
