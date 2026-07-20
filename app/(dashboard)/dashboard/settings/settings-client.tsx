"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, DollarSign, CreditCard, Truck, Eye, Search, Image as ImageIcon, Mail, Globe, ArrowRight, Shield } from "lucide-react";

const sections = [
  {
    title: "Currency",
    description: "Set store currency used across all prices, orders, and receipts",
    href: "/dashboard/settings/currency",
    icon: DollarSign,
  },
  {
    title: "Payment Methods",
    description: "Enable or disable payment options available at checkout",
    href: "/dashboard/settings/payments",
    icon: CreditCard,
  },
  {
    title: "Shipping Costs",
    description: "Configure delivery charges for different zones",
    href: "/dashboard/settings/shipping",
    icon: Truck,
  },
  {
    title: "Meta Pixel",
    description: "Manage Facebook Pixel tracking, page mappings, and debug mode",
    href: "/dashboard/settings/pixel",
    icon: Eye,
  },
  {
    title: "SEO",
    description: "Configure meta tags, structured data, sitemaps, and search engine settings",
    href: "/dashboard/settings/seo",
    icon: Search,
  },
  {
    title: "CDN",
    description: "Manage Cloudinary API credentials for image uploads",
    href: "/dashboard/settings/cdn",
    icon: ImageIcon,
  },
  {
    title: "SMTP",
    description: "Manage Gmail SMTP credentials for transactional emails",
    href: "/dashboard/settings/smtp",
    icon: Mail,
  },
  {
    title: "Website",
    description: "Configure homepage hero, features, newsletter, footer, and site-wide content",
    href: "/dashboard/settings/website",
    icon: Globe,
  },
  {
    title: "Roles & Permissions",
    description: "Manage system access levels and create custom roles for your team",
    href: "/dashboard/settings/roles",
    icon: Shield,
  },
];

export function SettingsOverview() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your store configuration, integrations, and preferences
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <div className="group rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none flex items-center justify-between gap-4 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer h-full">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {section.description}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
