"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain, type NavGroup } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  IconArticle,
  IconBed,
  IconCashRegister,
  IconCategory,
  IconLayoutDashboard,
  IconPackage,
  IconSettings,
  IconShoppingCart,
  IconChartBar,
  IconReceipt2,
  IconUsers,
  IconUserHeart,
  IconShield,
  IconHistory
} from "@tabler/icons-react"
import { useCurrent } from "@/features/auth/api/use-current"
import { can, type ModuleKey } from "@/lib/permissions"

// `module` gates an item: shown only if the user can read that module.
// Items with no `module` are always visible.
type GatedItem = {
  title: string
  url: string
  icon?: React.ReactNode
  module?: ModuleKey
  items?: { title: string; url: string }[]
}
type GatedGroup = { label: string; items: GatedItem[] }

const navGroups: GatedGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: <IconLayoutDashboard />, module: "dashboard" },
      { title: "Reports", url: "/dashboard/reports", icon: <IconChartBar />, module: "reports" },
    ],
  },
  {
    label: "Sales & POS",
    items: [
      { title: "Orders", url: "/dashboard/orders", icon: <IconShoppingCart />, module: "orders" },
      { title: "POS", url: "/dashboard/pos", icon: <IconCashRegister />, module: "pos" },
      { title: "Expenses", url: "/dashboard/expenses", icon: <IconReceipt2 />, module: "expenses" },
    ],
  },
  {
    label: "Catalog & Content",
    items: [
      { title: "Products", url: "/dashboard/products", icon: <IconPackage />, module: "products" },
      { title: "Categories", url: "/dashboard/categories", icon: <IconCategory />, module: "products" },
      { title: "Blog", url: "/dashboard/blog", icon: <IconArticle />, module: "blog" },
      { title: "Testimonials", url: "/dashboard/testimonials", icon: <IconBed />, module: "testimonials" },
    ],
  },
  {
    label: "People & Security",
    items: [
      { title: "Customers", url: "/dashboard/customers", icon: <IconUserHeart />, module: "users" },
      { title: "Staff", url: "/dashboard/users", icon: <IconUsers />, module: "users" },
      { title: "Roles", url: "/dashboard/settings/roles", icon: <IconShield />, module: "roles" },
      { title: "Activity Log", url: "/dashboard/activity", icon: <IconHistory />, module: "activity" },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: <IconSettings />,
        module: "settings",
        items: [
          { title: "Currency", url: "/dashboard/settings/currency" },
          { title: "Payments", url: "/dashboard/settings/payments" },
          { title: "Shipping", url: "/dashboard/settings/shipping" },
          { title: "Meta Pixel", url: "/dashboard/settings/pixel" },
          { title: "Meta Catalog", url: "/dashboard/settings/catalog" },
          { title: "SEO", url: "/dashboard/settings/seo" },
          { title: "CDN", url: "/dashboard/settings/cdn" },
          { title: "Website", url: "/dashboard/settings/website" },
          { title: "API Keys", url: "/dashboard/settings/api-keys" },
        ],
      },
    ],
  },
]

// Keep only items the user can see, then drop groups left empty.
function filterGroups(
  groups: GatedGroup[],
  user: { role?: string; permissions?: string[] } | null | undefined
): NavGroup[] {
  return groups
    .map((group) => ({
      label: group.label,
      items: group.items.filter(
        (item) => !item.module || can(user ?? null, item.module, "read")
      ),
    }))
    .filter((group) => group.items.length > 0)
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile } = useSidebar()
  const { data: user } = useCurrent()

  const groups = React.useMemo(() => filterGroups(navGroups, user), [user])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" onClick={() => setOpenMobile?.(false)} />}>
              <div className="flex aspect-square size-8.5 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-pink-600 text-white shadow-sm shadow-rose-500/20">
                <IconBed className="size-4.5" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-bold tracking-tight text-foreground text-sm">Sleep Sheet</span>
                <span className="text-[10px] font-semibold tracking-wide uppercase text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-full w-fit">Admin Panel</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
