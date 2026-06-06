import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createDb, organization } from '@repo/database'
import { getCurrentSession } from '@/lib/auth-server'
import { TenantProvider } from '@/providers/tenant-provider'
import { AppSidebar } from '@/components/app-sidebar'
import { DashboardHeaderActions } from '@/components/dashboard-header-actions'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import React from 'react'
import { env } from '@/env'

interface DashBoardLayoutProps {
  children: React.ReactNode
}

async function DashBoardLayout({ children }: DashBoardLayoutProps) {
  const session = await getCurrentSession()
  if (!session) redirect('/login')

  // Resolve the active org from the session so the TenantProvider has data.
  let activeOrg = null
  const activeOrgId = (session.session as Record<string, unknown>).activeOrganizationId as string | null | undefined
  if (activeOrgId) {
    const { env: cfEnv } = await getCloudflareContext({ async: true })
    const db = createDb(cfEnv.DB)
    activeOrg = await db.query.organization.findFirst({
      where: eq(organization.id, activeOrgId),
    })
  }

  // Logged in but no store yet → onboard.
  if (!activeOrg) redirect('/onboarding/new-org')

  return (
    <TenantProvider organization={activeOrg ?? null}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <DashboardHeaderActions />
          </header>
          <main className="flex-1">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TenantProvider>
  )
}

export default DashBoardLayout
