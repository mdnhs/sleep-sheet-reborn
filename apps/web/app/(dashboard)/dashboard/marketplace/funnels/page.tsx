"use client"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Filter, Crown } from "lucide-react"
import { useMarketplaceFunnels, usePurchaseFunnel, useInstallFunnel } from "@/features/(saas)/marketplace/api/v1-marketplace"

const taka = (n: number) => `৳${(n / 100).toLocaleString()}`

export default function MarketplaceFunnelsPage() {
  const { data: templates = [], isLoading } = useMarketplaceFunnels()
  const purchase = usePurchaseFunnel()
  const install = useInstallFunnel()

  return (
    <PageShell>
      <PageHeader title="Funnel Marketplace" description="Install funnel templates as ready-to-edit funnels. Funnels require a plan that enables them." />
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><Filter className="w-4 h-4" />{t.name}</CardTitle>
                  {t.price > 0 ? <Badge variant="outline" className="gap-1"><Crown className="w-3 h-3" />{taka(t.price)}</Badge> : <Badge variant="outline">Free</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{t.type}{t.installs > 0 ? ` · ${t.installs} installed` : ""}</p>
                <div className="flex flex-wrap gap-2">
                  {t.price > 0 && !t.owned && (
                    <Button size="sm" disabled={purchase.isPending} onClick={() => purchase.mutate(t.id)}>Buy {taka(t.price)}</Button>
                  )}
                  {(t.owned || t.price === 0) && (
                    <Button size="sm" variant="outline" disabled={install.isPending} onClick={() => install.mutate({ templateId: t.id })}>Install</Button>
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
