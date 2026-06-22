"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ClipboardList,
  Home,
  Package,
  Plus,
  Receipt,
  Settings,
  Tags,
} from "lucide-react";
import Link from "next/link";

interface DashBoardSideBarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideBarItems = [
  { name: "DashBoard", href: "/dashboard", icon: <Home size={21} /> },
  {
    name: "Products Manager",
    href: "/dashboard/products",
    icon: <Package size={21} />,
  },
  {
    name: "Add New Product",
    href: "/dashboard/products/create",
    icon: <Plus size={21} />,
  },
  {
    name: "Categories Manager",
    href: "/dashboard/categories",
    icon: <Tags size={21} />,
  },
  {
    name: "Blog Manager",
    href: "/dashboard/blog",
    icon: <ClipboardList size={21} />,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: <Settings size={21} />,
  },
];

const OrderManagementItems = [
  {
    name: "All Orders",
    href: "/dashboard/orders",
    icon: <ClipboardList size={21} />,
  },
  {
    name: "Invoices",
    href: "/dashboard/orders/invoices",
    icon: <Receipt size={21} />,
  },
];

const DashBoardSideBar = ({ isOpen, onClose }: DashBoardSideBarProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-full sm:w-[400px] lg:w-[300px] flex flex-col"
      >
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              LUXESTORE
            </SheetTitle>
          </div>
        </SheetHeader>
        <ul className="p-4">
          {SideBarItems.map((sideBarItem) => (
            <Link
              key={sideBarItem.name}
              href={sideBarItem.href}
              onClick={() => onClose()}
            >
              <li
                key={sideBarItem.name}
                className="flex flex-row items-center justify-between space-y-4"
              >
                <h1 className=" text-md">{sideBarItem.name}</h1>
                {sideBarItem.icon}
              </li>
            </Link>
          ))}
        </ul>
        <div className=" p-4 flex flex-col">
          <label className=" border-t border-b py-4">
            Order&apos;s Management
          </label>

          <ul className=" mt-4">
            {OrderManagementItems.map((orderManagement) => (
              <Link
                key={orderManagement.name}
                href={orderManagement.href}
                onClick={() => onClose()}
              >
                <li
                  key={orderManagement.name}
                  className="flex flex-row items-center justify-between space-y-4"
                >
                  <h1 className=" text-md">{orderManagement.name}</h1>
                  {orderManagement.icon}
                </li>
              </Link>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DashBoardSideBar;
