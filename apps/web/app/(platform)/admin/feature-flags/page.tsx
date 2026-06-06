"use client"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAdminOrgs, useOrgFeatureFlags, useSetOrgFlag } from "@/features/(saas)/platform/api/admin-platform"

function OrgFlags({ orgId }: { orgId: string }) {
  const { data, isLoading } = useOrgFeatureFlags(orgId)
  const setFlag = useSetOrgFlag(orgId)
  if (isLoading || !data) return <Skeleton className="h-48 rounded-xl" />
  return (
    <div className="rounded-xl border divide-y">
      {data.flags.map(f => (
        <div key={f.flag} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="font-medium">{f.flag.replace(/_/g, " ")}</p>
            <p className="text-xs text-muted-foreground">{f.overridden ? "per-org override" : "plan default"}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={f.enabled ? "default" : "secondary"}>{f.enabled ? "Enabled" : "Disabled"}</Badge>
            <Button size="sm" variant="outline" disabled={setFlag.isPending} onClick={() => setFlag.mutate({ flag: f.flag, enabled: !f.enabled })}>
              {f.enabled ? "Disable" : "Enable"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FeatureFlagsPage() {
  const { data: orgs = [], isLoading } = useAdminOrgs()
  const [orgId, setOrgId] = useState<string>("")

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Feature Flags</h1>
        <p className="text-sm text-muted-foreground">Override plan capabilities per organization. Overrides win over the plan default.</p>
      </div>
      {isLoading ? <Skeleton className="h-10 w-72 rounded-md" /> : (
        <Select value={orgId} onValueChange={(v) => setOrgId(v ?? "")}>
          <SelectTrigger className="w-72"><SelectValue placeholder="Select an organization" /></SelectTrigger>
          <SelectContent>{orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {orgId ? <OrgFlags orgId={orgId} /> : <p className="text-sm text-muted-foreground">Pick an organization to manage its flags.</p>}
    </div>
  )
}
