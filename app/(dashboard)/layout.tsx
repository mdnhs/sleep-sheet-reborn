import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeaderActions } from "@/components/dashboard-header-actions";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import React from "react";
import { BottomNav } from "@/components/bottom-nav";

interface DashBoardLayoutProps {
  children: React.ReactNode;
}

function DashBoardLayout({ children }: DashBoardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          {/* <DashboardBreadcrumb /> */}
          <DashboardHeaderActions />
        </header>
        {/* min-w-0 overrides the flex default of min-width:auto — without it,
            a wide child (e.g. a many-column table) forces this flex item,
            and the whole page, wider than the viewport instead of scrolling
            internally within its own overflow-x-auto wrapper. */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default DashBoardLayout;
