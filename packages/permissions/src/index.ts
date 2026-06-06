export type OrgRole =
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'INVENTORY_MANAGER'
  | 'PURCHASE_MANAGER'
  | 'DELIVERY_MANAGER'
  | 'CASHIER'
  | 'EMPLOYEE'

export type PlatformRole = 'SUPER_ADMIN'

// Each permission maps to the roles that hold it.
// Source of truth: docs/RBAC.md §6.
const ALL: OrgRole[] = ['OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'PURCHASE_MANAGER', 'DELIVERY_MANAGER', 'CASHIER', 'EMPLOYEE']
const OWNER_ADMIN: OrgRole[] = ['OWNER', 'ADMIN']
const OWNER_ADMIN_MANAGER: OrgRole[] = ['OWNER', 'ADMIN', 'MANAGER']

export const ORG_PERMISSIONS = {
  // Products
  'products.view':    [...ALL],
  'products.create':  OWNER_ADMIN,
  'products.update':  OWNER_ADMIN_MANAGER,
  'products.archive': OWNER_ADMIN,
  'products.import':  OWNER_ADMIN,
  'products.export':  OWNER_ADMIN_MANAGER,
  // Categories
  'categories.view':    [...ALL],
  'categories.create':  OWNER_ADMIN,
  'categories.update':  OWNER_ADMIN,
  'categories.archive': OWNER_ADMIN,
  // Inventory
  'inventory.view':     ['OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'PURCHASE_MANAGER'] as OrgRole[],
  'inventory.adjust':   ['OWNER', 'ADMIN', 'INVENTORY_MANAGER'] as OrgRole[],
  'inventory.transfer': ['OWNER', 'ADMIN', 'INVENTORY_MANAGER'] as OrgRole[],
  'inventory.reserve':  ['OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER'] as OrgRole[],
  'inventory.audit':    ['OWNER', 'ADMIN', 'INVENTORY_MANAGER'] as OrgRole[],
  // Locations
  'warehouses.view':   ['OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'PURCHASE_MANAGER'] as OrgRole[],
  'warehouses.create': OWNER_ADMIN,
  'warehouses.update': OWNER_ADMIN,
  'outlets.view':      ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] as OrgRole[],
  'outlets.create':    OWNER_ADMIN,
  'outlets.update':    OWNER_ADMIN_MANAGER,
  // Purchases
  'purchases.view':    ['OWNER', 'ADMIN', 'MANAGER', 'PURCHASE_MANAGER'] as OrgRole[],
  'purchases.create':  ['OWNER', 'ADMIN', 'PURCHASE_MANAGER'] as OrgRole[],
  'purchases.update':  ['OWNER', 'ADMIN', 'PURCHASE_MANAGER'] as OrgRole[],
  'purchases.approve': OWNER_ADMIN,
  'purchases.receive': ['OWNER', 'ADMIN', 'PURCHASE_MANAGER', 'INVENTORY_MANAGER'] as OrgRole[],
  'purchases.return':  ['OWNER', 'ADMIN', 'PURCHASE_MANAGER'] as OrgRole[],
  // Suppliers
  'suppliers.view':    ['OWNER', 'ADMIN', 'MANAGER', 'PURCHASE_MANAGER'] as OrgRole[],
  'suppliers.create':  ['OWNER', 'ADMIN', 'PURCHASE_MANAGER'] as OrgRole[],
  'suppliers.update':  ['OWNER', 'ADMIN', 'PURCHASE_MANAGER'] as OrgRole[],
  'suppliers.archive': OWNER_ADMIN,
  // Orders
  'orders.view':   ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER', 'DELIVERY_MANAGER'] as OrgRole[],
  'orders.create': ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] as OrgRole[],
  'orders.update': OWNER_ADMIN_MANAGER,
  'orders.cancel': OWNER_ADMIN_MANAGER,
  'orders.refund': OWNER_ADMIN,
  // POS
  'pos.view':          ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] as OrgRole[],
  'pos.sale':          ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] as OrgRole[],
  'pos.return':        ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] as OrgRole[],
  'pos.cash_register': ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] as OrgRole[],
  // Customers
  'customers.view':    ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] as OrgRole[],
  'customers.create':  ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] as OrgRole[],
  'customers.update':  OWNER_ADMIN_MANAGER,
  'customers.wallet':  OWNER_ADMIN,
  'customers.loyalty': OWNER_ADMIN_MANAGER,
  'customers.reports': OWNER_ADMIN_MANAGER,
  // Delivery
  'delivery.view':    ['OWNER', 'ADMIN', 'MANAGER', 'DELIVERY_MANAGER'] as OrgRole[],
  'delivery.create':  ['OWNER', 'ADMIN', 'MANAGER', 'DELIVERY_MANAGER'] as OrgRole[],
  'delivery.assign':  ['OWNER', 'ADMIN', 'MANAGER', 'DELIVERY_MANAGER'] as OrgRole[],
  'delivery.track':   ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER', 'DELIVERY_MANAGER'] as OrgRole[],
  'delivery.update':  ['OWNER', 'ADMIN', 'DELIVERY_MANAGER'] as OrgRole[],
  'delivery.reports': OWNER_ADMIN_MANAGER,
  // Finance
  'finance.view':         OWNER_ADMIN,
  'finance.transactions': OWNER_ADMIN,
  'finance.expenses':     OWNER_ADMIN,
  'finance.accounts':     OWNER_ADMIN,
  'finance.reports':      OWNER_ADMIN,
  // Employees
  'employees.view':    OWNER_ADMIN_MANAGER,
  'employees.create':  OWNER_ADMIN,
  'employees.update':  OWNER_ADMIN,
  'employees.archive': OWNER_ADMIN,
  // Reports
  'reports.sales':      OWNER_ADMIN_MANAGER,
  'reports.inventory':  ['OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER'] as OrgRole[],
  'reports.purchase':   ['OWNER', 'ADMIN', 'PURCHASE_MANAGER'] as OrgRole[],
  'reports.finance':    OWNER_ADMIN,
  'reports.customers':  OWNER_ADMIN_MANAGER,
  'reports.growth':     OWNER_ADMIN,
  // Storefront / themes
  'storefront.view':   OWNER_ADMIN,
  'storefront.manage': OWNER_ADMIN,
  'themes.install':    OWNER_ADMIN,
  'themes.activate':   OWNER_ADMIN,
  'themes.update':     OWNER_ADMIN,
  'pages.manage':      OWNER_ADMIN,
  'blogs.manage':      OWNER_ADMIN,
  'menus.manage':      OWNER_ADMIN,
  'seo.manage':        OWNER_ADMIN,
  // Growth / marketing
  'campaigns.view':      OWNER_ADMIN_MANAGER,
  'campaigns.manage':    OWNER_ADMIN,
  'funnels.view':        OWNER_ADMIN,
  'funnels.install':     OWNER_ADMIN,
  'funnels.manage':      OWNER_ADMIN,
  'marketing.analytics': OWNER_ADMIN_MANAGER,
  // Organization admin
  'organization.view':      [...ALL],
  'organization.manage':    OWNER_ADMIN,
  'organization.demo_data': OWNER_ADMIN,
  'team.view':              OWNER_ADMIN_MANAGER,
  'team.invite':            OWNER_ADMIN,
  'team.manage':            OWNER_ADMIN,
  'billing.view':           ['OWNER'] as OrgRole[],
  'billing.manage':         ['OWNER'] as OrgRole[],
  'roles.view':             OWNER_ADMIN,
  'roles.create':           ['OWNER'] as OrgRole[],
  'roles.update':           ['OWNER'] as OrgRole[],
  'roles.delete':           ['OWNER'] as OrgRole[],
  'audit.view':             OWNER_ADMIN,
  'settings.view':          OWNER_ADMIN_MANAGER,
  'settings.update':        OWNER_ADMIN,
  'integrations.manage':    OWNER_ADMIN,
} satisfies Record<string, OrgRole[]>

export type OrgPermission = keyof typeof ORG_PERMISSIONS

export const PLATFORM_PERMISSIONS = [
  'platform.organizations.view',
  'platform.organizations.manage',
  'platform.organizations.suspend',
  'platform.plans.view',
  'platform.plans.manage',
  'platform.subscriptions.view',
  'platform.subscriptions.manage',
  'platform.invoices.view',
  'platform.invoices.manage',
  'platform.marketplace.themes',
  'platform.marketplace.funnels',
  'platform.marketplace.apps',
  'platform.demo_datasets.manage',
  'platform.analytics.view',
  'platform.feature_flags.manage',
] as const

export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[number]

export function hasPermission(role: OrgRole, permission: OrgPermission): boolean {
  return (ORG_PERMISSIONS[permission] as OrgRole[]).includes(role)
}

export function getPermissions(role: OrgRole): OrgPermission[] {
  return (Object.entries(ORG_PERMISSIONS) as [OrgPermission, OrgRole[]][])
    .filter(([, roles]) => roles.includes(role))
    .map(([perm]) => perm)
}
