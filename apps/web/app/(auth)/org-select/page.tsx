'use client'

import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { IconBuilding } from '@tabler/icons-react'

export default function OrgSelectPage() {
  const router = useRouter()
  const { data: orgs, isPending } = authClient.useListOrganizations()

  async function select(orgId: string) {
    await authClient.organization.setActive({ organizationId: orgId })
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Select organization</CardTitle>
            <CardDescription>Choose an organization to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
            {orgs?.map((org) => (
              <Button
                key={org.id}
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={() => select(org.id)}
              >
                <div className="flex size-8 items-center justify-center rounded-md border text-sm font-medium">
                  {org.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-medium">{org.name}</p>
                  <p className="text-xs text-muted-foreground">{org.slug}</p>
                </div>
              </Button>
            ))}
            {!isPending && orgs?.length === 0 && (
              <div className="text-center py-4 space-y-3">
                <IconBuilding className="mx-auto size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No organizations found.</p>
                <Button render={<a href="/onboarding/new-org" />} className="w-full">
                  Create organization
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
