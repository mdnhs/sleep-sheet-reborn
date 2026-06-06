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
import accounts from './accounts'
import transactions from './transactions'
import expenses from './expenses'
import financeReports from './finance-reports'
import deliveryPartners from './delivery-partners'
import riders from './riders'
import shipments from './shipments'
import customers from './customers'
import customerGroups from './customer-groups'
import billing from './billing'
import storefront from './storefront'
import growth from './growth'
import marketplace from './marketplace'
import reports from './reports'
import notifications from './notifications'
import auditLogs from './audit-logs'
import demo from './demo'

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
  .route('/accounts', accounts)
  .route('/transactions', transactions)
  .route('/expenses', expenses)
  .route('/finance', financeReports)
  .route('/delivery-partners', deliveryPartners)
  .route('/riders', riders)
  .route('/shipments', shipments)
  .route('/customers', customers)
  .route('/customer-groups', customerGroups)
  .route('/billing', billing)
  .route('/storefront', storefront)
  .route('/growth', growth)
  .route('/marketplace', marketplace)
  .route('/reports', reports)
  .route('/notifications', notifications)
  .route('/audit-logs', auditLogs)
  .route('/demo', demo)

export default v1
