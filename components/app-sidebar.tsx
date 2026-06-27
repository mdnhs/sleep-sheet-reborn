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
  IconShoppingCart,
  IconPackage,
  IconCategory,
  IconSettings,
  IconLayoutDashboard,
  IconBed,
  IconArticle,
  IconDollarSign,
  IconCreditCard,
  IconTruck,
  IconCashRegister,
} from "@tabler/icons-react"

const data = {
  user: {
    name: "Admin",
    email: "admin@sleepsheet.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <IconLayoutDashboard />,
      items: [],
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: <IconShoppingCart />,
      items: [],
    },
    {
      title: "POS",
      url: "/dashboard/pos",
      icon: <IconCashRegister />,
      items: [],
    },
    {
      title: "Products",
      url: "/dashboard/products",
      icon: <IconPackage />,
      items: [],
    },
    {
      title: "Categories",
      url: "/dashboard/categories",
      icon: <IconCategory />,
      items: [],
    },
    {
      title: "Testimonials",
      url: "/dashboard/testimonials",
      icon: <IconBed />, // Using IconBed temporarily, can be changed
      items: [],
    },
    {
      title: "Blog",
      url: "/dashboard/blog",
      icon: <IconArticle />,
      items: [],
    },
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
      ],
    },
  ],
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
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
