"use client"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Palette, Check } from "lucide-react"
import {
  useThemeCatalog, useInstalledThemes, useInstallTheme, useActivateTheme,
} from "@/features/(storefront)/storefront/api/v1-storefront"

export default function ThemesPage() {
  const { data: catalog = [], isLoading } = useThemeCatalog()
  const { data: installed = [] } = useInstalledThemes()
  const install = useInstallTheme()
  const activate = useActivateTheme()

  const installedByTheme = new Map(installed.map(i => [i.themeId, i]))

  return (
    <PageShell>
      <PageHeader title="Themes" description="Install a storefront theme and activate one (one active per organization)." />
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalog.map(t => {
            const orgTheme = installedByTheme.get(t.id)
            const isActive = orgTheme?.isActive
            return (
              <Card key={t.id} className={isActive ? "border-primary" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" />{t.name}</CardTitle>
                    {isActive ? <Badge className="gap-1"><Check className="w-3 h-3" />Active</Badge>
                      : orgTheme ? <Badge variant="secondary">Installed</Badge>
                      : <Badge variant="outline">{t.type}</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {t.category && <p>{t.category}</p>}
                  {t.description && <p className="line-clamp-2">{t.description}</p>}
                  {!orgTheme ? (
                    <Button size="sm" className="w-full" disabled={install.isPending} onClick={() => install.mutate(t.id)}>Install</Button>
                  ) : isActive ? (
                    <Button size="sm" variant="outline" className="w-full" disabled>Active theme</Button>
                  ) : (
                    <Button size="sm" variant="outline" className="w-full" disabled={activate.isPending} onClick={() => activate.mutate(orgTheme.id)}>Activate</Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
