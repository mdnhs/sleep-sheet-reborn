"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
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

const data = {
  user: {
    name: "Admin",
    email: "admin@sleepsheet.com",
    avatar: "/avatars/admin.jpg",
  },
}

const navGroups = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: <IconLayoutDashboard /> },
      { title: "Reports", url: "/dashboard/reports", icon: <IconChartBar /> },
    ],
  },
  {
    label: "Sales & POS",
    items: [
      { title: "Orders", url: "/dashboard/orders", icon: <IconShoppingCart /> },
      { title: "POS", url: "/dashboard/pos", icon: <IconCashRegister /> },
      { title: "Expenses", url: "/dashboard/expenses", icon: <IconReceipt2 /> },
    ],
  },
  {
    label: "Catalog & Content",
    items: [
      { title: "Products", url: "/dashboard/products", icon: <IconPackage /> },
      { title: "Categories", url: "/dashboard/categories", icon: <IconCategory /> },
      { title: "Blog", url: "/dashboard/blog", icon: <IconArticle /> },
      { title: "Testimonials", url: "/dashboard/testimonials", icon: <IconBed /> },
    ],
  },
  {
    label: "People & Security",
    items: [
      { title: "Customers", url: "/dashboard/customers", icon: <IconUserHeart /> },
      { title: "Staff", url: "/dashboard/users", icon: <IconUsers /> },
      { title: "Roles", url: "/dashboard/settings/roles", icon: <IconShield /> },
      { title: "Activity Log", url: "/dashboard/activity", icon: <IconHistory /> },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: <IconSettings />,
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile } = useSidebar()
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
        <NavMain groups={navGroups} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
