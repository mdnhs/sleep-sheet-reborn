"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMenus, useSaveMenu, type Menu } from "@/features/(storefront)/storefront/api/v1-storefront"

const LOCATIONS: Menu["location"][] = ["HEADER", "FOOTER", "MOBILE"]
const PLACEHOLDER = `[
  { "label": "Home", "url": "/" },
  { "label": "Shop", "url": "/shop" }
]`

function MenuEditor({ location, menu }: { location: Menu["location"]; menu?: Menu }) {
  const [items, setItems] = useState(menu?.items ?? "")
  const [error, setError] = useState("")
  const { mutate: save, isPending } = useSaveMenu()
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{location}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Items (JSON)</Label>
          <Textarea value={items} onChange={e => { setItems(e.target.value); setError("") }} rows={8} className="font-mono text-xs" placeholder={PLACEHOLDER} />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <Button size="sm" disabled={isPending} onClick={() => {
          let parsed: unknown = []
          if (items.trim()) {
            try { parsed = JSON.parse(items) } catch { setError("Invalid JSON"); return }
          }
          save({ location, name: location, items: parsed })
        }}>Save {location} menu</Button>
      </CardContent>
    </Card>
  )
}

export default function MenusPage() {
  const { data: menus = [], isLoading } = useMenus()
  const byLoc = new Map(menus.map(m => [m.location, m]))
  return (
    <PageShell>
      <PageHeader title="Menus" description="Header, footer and mobile navigation. Nested links supported via JSON." />
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{LOCATIONS.map(l => <Skeleton key={l} className="h-64 rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LOCATIONS.map(l => <MenuEditor key={l} location={l} menu={byLoc.get(l)} />)}
        </div>
      )}
    </PageShell>
  )
}
