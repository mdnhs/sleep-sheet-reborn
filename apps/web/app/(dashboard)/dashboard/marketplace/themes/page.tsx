"use client"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Palette, Check, Crown } from "lucide-react"
import {
  useMarketplaceThemes, usePurchaseTheme, useInstallTheme, useActivateMarketTheme, useUpdateMarketTheme,
} from "@/features/(saas)/marketplace/api/v1-marketplace"

const taka = (n: number) => `৳${(n / 100).toLocaleString()}`

export default function MarketplaceThemesPage() {
  const { data: themes = [], isLoading } = useMarketplaceThemes()
  const purchase = usePurchaseTheme()
  const install = useInstallTheme()
  const activate = useActivateMarketTheme()
  const update = useUpdateMarketTheme()

  return (
    <PageShell>
      <PageHeader title="Theme Marketplace" description="Browse, install and activate storefront themes. Premium themes require purchase." />
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map(t => (
            <Card key={t.id} className={t.active ? "border-primary" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" />{t.name}</CardTitle>
                  {t.type === "PREMIUM" ? <Badge variant="outline" className="gap-1"><Crown className="w-3 h-3" />{taka(t.price)}</Badge> : <Badge variant="outline">Free</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {t.category && <p>{t.category}</p>}
                {t.description && <p className="line-clamp-2">{t.description}</p>}
                <div className="flex flex-wrap gap-2">
                  {t.active && <Badge className="gap-1"><Check className="w-3 h-3" />Active</Badge>}
                  {t.type === "PREMIUM" && !t.owned && (
                    <Button size="sm" disabled={purchase.isPending} onClick={() => purchase.mutate(t.id)}>Buy {taka(t.price)}</Button>
                  )}
                  {!t.installed && (t.owned || t.type === "FREE") && (
                    <Button size="sm" variant="outline" disabled={install.isPending} onClick={() => install.mutate(t.id)}>Install</Button>
                  )}
                  {t.installed && !t.active && t.orgThemeId && (
                    <Button size="sm" variant="outline" disabled={activate.isPending} onClick={() => activate.mutate(t.orgThemeId!)}>Activate</Button>
                  )}
                  {t.installed && t.orgThemeId && (
                    <Button size="sm" variant="ghost" disabled={update.isPending} onClick={() => update.mutate(t.orgThemeId!)}>Update</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  )
}
