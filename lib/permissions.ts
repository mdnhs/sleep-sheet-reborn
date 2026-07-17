export const PERMISSIONS = {
  // Products
  MANAGE_PRODUCTS: "manage_products",
  
  // Blog
  MANAGE_BLOG: "manage_blog",
  
  // Orders & POS
  MANAGE_ORDERS: "manage_orders",
  POS_ACCESS: "pos_access",
  
  // Settings & Analytics
  VIEW_ANALYTICS: "view_analytics",
  MANAGE_SETTINGS: "manage_settings",
  
  // Users & Roles
  MANAGE_USERS: "manage_users",
  MANAGE_ROLES: "manage_roles",

  // Audit
  VIEW_ACTIVITY_LOGS: "view_activity_logs",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const PERMISSION_GROUPS = [
  {
    label: "Products & Blog",
    permissions: [
      { id: PERMISSIONS.MANAGE_PRODUCTS, label: "Manage Products" },
      { id: PERMISSIONS.MANAGE_BLOG, label: "Manage Blog" },
    ]
  },
  {
    label: "Orders & Point of Sale",
    permissions: [
      { id: PERMISSIONS.MANAGE_ORDERS, label: "Manage Orders" },
      { id: PERMISSIONS.POS_ACCESS, label: "Access POS" },
    ]
  },
  {
    label: "Analytics & Settings",
    permissions: [
      { id: PERMISSIONS.VIEW_ANALYTICS, label: "View Analytics" },
      { id: PERMISSIONS.MANAGE_SETTINGS, label: "Manage Settings" },
    ]
  },
  {
    label: "Administration",
    permissions: [
      { id: PERMISSIONS.MANAGE_USERS, label: "Manage Users" },
      { id: PERMISSIONS.MANAGE_ROLES, label: "Manage Roles" },
      { id: PERMISSIONS.VIEW_ACTIVITY_LOGS, label: "View Activity Logs" },
    ]
  }
];

export function hasPermission(user: { role?: string, permissions?: string[] } | null, permission: Permission): boolean {
  if (!user) return false;
  
  // The system ADMIN always has access
  if (user.role === "ADMIN") return true;

  // Check custom role permissions
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }

  return false;
}
