"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrent } from "@/features/auth/api/use-current";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { settingsNav } from "./settings-nav";

const tabBase =
  "inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors";
const tabIdle = "text-foreground/60 hover:text-foreground hover:bg-white/60 dark:hover:bg-card/60";
const tabActive = "bg-white text-foreground shadow-sm dark:bg-card";

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: user } = useCurrent();

  // Keep only tabs the user can open, then drop groups left empty.
  const groups = React.useMemo(
    () =>
      settingsNav
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => can(user ?? null, item.module, "read")),
        }))
        .filter((group) => group.items.length > 0),
    [user]
  );

  const activeGroup = groups.find((group) =>
    group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your store configuration, integrations, and preferences
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Left tabs: one per group. Horizontal scroll on mobile. */}
        <nav
          aria-label="Settings sections"
          className="flex gap-1 overflow-x-auto rounded-2xl bg-muted p-1 md:w-56 md:shrink-0 md:flex-col md:overflow-visible"
        >
          {groups.map((group) => {
            const Icon = group.icon;
            const isActive = group.key === activeGroup?.key;
            return (
              <Link
                key={group.key}
                href={group.items[0].href}
                aria-current={isActive ? "page" : undefined}
                className={cn(tabBase, isActive ? tabActive : tabIdle)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {group.title}
              </Link>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1 space-y-6">
          {/* Nested tabs: pages inside the active group. */}
          {activeGroup && activeGroup.items.length > 1 && (
            <nav
              aria-label={`${activeGroup.title} settings`}
              className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl bg-muted p-1"
            >
              {activeGroup.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(tabBase, isActive ? tabActive : tabIdle)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
