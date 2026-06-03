"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  IconBed,
  IconLayoutDashboard,
  IconCashRegister,
  IconShoppingCart,
  IconPackage,
  IconBoxSeam,
  IconReceipt2,
  IconBuildingWarehouse,
  IconUsers,
  IconSpeakerphone,
  IconTruckDelivery,
  IconWallet,
  IconUsersGroup,
  IconReportAnalytics,
  IconWorldWww,
  IconDeviceMobile,
  IconPlug,
  IconSettings,
  IconServerCog,
} from "@tabler/icons-react"

/** Slugify a label into a URL segment ("Stock In" -> "stock-in"). */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

/** A child is either a label (url derived from group base) or [label, urlOverride]. */
type Child = string | [string, string]

interface Group {
  title: string
  icon: React.ReactNode
  base: string
  children: Child[]
}

// Full ERP navigation. Routes without a dedicated page yet are placeholders;
// functionality is added module by module. Overrides point at pages that exist.
const groups: Group[] = [
  {
    title: "Overview",
    icon: <IconLayoutDashboard />,
    base: "overview",
    children: [
      "Sales Summary",
      "Revenue Analytics",
      "Top Products",
      ["Low Stock Alerts", "/dashboard/inventory"],
      ["Recent Orders", "/dashboard/orders"],
      "Recent Activities",
    ],
  },
  {
    title: "POS",
    icon: <IconCashRegister />,
    base: "pos",
    children: [
      "New Sale",
      "Hold Sale",
      "Return Sale",
      "Draft Orders",
      "Cash Register",
      "POS Settings",
    ],
  },
  {
    title: "Orders",
    icon: <IconShoppingCart />,
    base: "orders",
    children: [
      ["All Orders", "/dashboard/orders"],
      "Pending",
      "Confirmed",
      "Processing",
      "Packed",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Returned",
      "Refund Requests",
    ],
  },
  {
    title: "Products",
    icon: <IconPackage />,
    base: "products",
    children: [
      ["All Products", "/dashboard/products"],
      ["Add Product", "/dashboard/products/create"],
      ["Categories", "/dashboard/categories"],
      "Sub Categories",
      "Brands",
      "Tags",
      "Product Reviews",
      "Product Questions",
      "Product Attributes",
      "Variants",
      "Units",
      "Barcode Generator",
      "Bulk Import/Export",
    ],
  },
  {
    title: "Inventory",
    icon: <IconBoxSeam />,
    base: "inventory",
    children: [
      ["Stock Overview", "/dashboard/inventory"],
      "Warehouses",
      "Stock In",
      "Stock Out",
      "Stock Transfer",
      "Stock Adjustment",
      "Damage Products",
      "Expired Products",
      ["Low Stock Alerts", "/dashboard/inventory"],
      "Inventory Reports",
    ],
  },
  {
    title: "Purchases",
    icon: <IconReceipt2 />,
    base: "purchases",
    children: [
      "Purchase Orders",
      "Create Purchase",
      "Receive Products",
      "Purchase Returns",
      "Supplier Payments",
      "Purchase Reports",
    ],
  },
  {
    title: "Suppliers",
    icon: <IconBuildingWarehouse />,
    base: "suppliers",
    children: [
      "All Suppliers",
      "Add Supplier",
      "Supplier Ledger",
      "Due Payments",
      "Supplier Reports",
    ],
  },
  {
    title: "Customers",
    icon: <IconUsers />,
    base: "customers",
    children: [
      "All Customers",
      "Customer Groups",
      "Loyalty Program",
      "Reward Points",
      "Customer Wallet",
      "Customer Ledger",
      "Customer Reports",
    ],
  },
  {
    title: "Marketing",
    icon: <IconSpeakerphone />,
    base: "marketing",
    children: [
      "Coupons",
      "Discount Campaigns",
      "Flash Sales",
      "Banners",
      "Push Notifications",
      "SMS Marketing",
      "Email Marketing",
      "Abandoned Carts",
    ],
  },
  {
    title: "Delivery",
    icon: <IconTruckDelivery />,
    base: "delivery",
    children: [
      "Delivery Zones",
      "Delivery Charges",
      "Delivery Partners",
      "Riders",
      "Assign Deliveries",
      "Delivery Tracking",
      "Delivery Reports",
    ],
  },
  {
    title: "Finance",
    icon: <IconWallet />,
    base: "finance",
    children: [
      "Dashboard",
      "Income",
      "Expenses",
      "Accounts",
      "Transactions",
      "Cash Book",
      "Bank Accounts",
      "Customer Due",
      "Supplier Due",
      "Profit & Loss",
      "Balance Sheet",
    ],
  },
  {
    title: "Employees",
    icon: <IconUsersGroup />,
    base: "employees",
    children: [
      "All Employees",
      "Departments",
      "Attendance",
      "Leave Management",
      "Payroll",
      "Roles",
      "Permissions",
    ],
  },
  {
    title: "Reports",
    icon: <IconReportAnalytics />,
    base: "reports",
    children: [
      "Sales Reports",
      "POS Reports",
      "Product Reports",
      "Inventory Reports",
      "Purchase Reports",
      "Customer Reports",
      "Supplier Reports",
      "Delivery Reports",
      "Finance Reports",
      "Tax Reports",
      "Audit Logs",
    ],
  },
  {
    title: "Website Management",
    icon: <IconWorldWww />,
    base: "website",
    children: [
      "Themes",
      "Homepage Builder",
      "Menus",
      "Pages",
      "Blog",
      "Media Library",
      "SEO Settings",
      "Redirect Manager",
    ],
  },
  {
    title: "Mobile App",
    icon: <IconDeviceMobile />,
    base: "mobile-app",
    children: ["App Settings", "Home Sections", "Push Notifications", "App Banners"],
  },
  {
    title: "Integrations",
    icon: <IconPlug />,
    base: "integrations",
    children: [
      "bKash",
      "Nagad",
      "SSLCommerz",
      "Pathao",
      "SteadFast",
      "RedX",
      "Facebook Pixel",
      "Google Analytics",
      "WhatsApp API",
    ],
  },
  {
    title: "Settings",
    icon: <IconSettings />,
    base: "settings",
    children: [
      ["Store Information", "/dashboard/settings"],
      "Business Information",
      "Tax Settings",
      "Currency Settings",
      "Invoice Settings",
      "Barcode Settings",
      "Notification Settings",
      "Email Settings",
      "SMS Settings",
      "Payment Settings",
      "Shipping Settings",
      "Backup & Restore",
    ],
  },
  {
    title: "System",
    icon: <IconServerCog />,
    base: "system",
    children: [
      "User Management",
      "Activity Logs",
      "API Keys",
      "Webhooks",
      "Feature Flags",
      "Subscription",
      "Security Settings",
    ],
  },
]

const navMain = groups.map((group) => ({
  title: group.title,
  url: `/dashboard/${group.base}`,
  icon: group.icon,
  items: group.children.map((child) => {
    const [label, override] = Array.isArray(child) ? child : [child, undefined]
    return { title: label, url: override ?? `/dashboard/${group.base}/${slugify(label)}` }
  }),
}))

const user = {
  name: "Admin",
  email: "admin@sleepsheet.com",
  avatar: "/avatars/admin.jpg",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <IconBed className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Sleep Sheet</span>
                <span className="text-xs text-muted-foreground">Admin Panel</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
