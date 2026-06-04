"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGetWarehouses, useGetOutlets, useCreateWarehouse, useCreateOutlet } from "@/features/(erp-core)/locations/api/locations"
import { Building2, Plus, Store } from "lucide-react"

function LocationForm({ type, onCreate }: { type: "WAREHOUSE" | "OUTLET"; onCreate: (d: { name: string; code: string }) => void; isPending?: boolean }) {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onCreate({ name, code }); setName(""); setCode("") }}>
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Name</label>
        <Input placeholder={type === "WAREHOUSE" ? "Main Warehouse" : "Dhaka Outlet"} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Code</label>
        <Input placeholder={type === "WAREHOUSE" ? "WH-001" : "OUT-001"} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
      </div>
      <Button type="submit" className="w-full"><Plus className="w-4 h-4 mr-1" />Create {type === "WAREHOUSE" ? "Warehouse" : "Outlet"}</Button>
    </form>
  )
}

function LocationList({ items, isLoading, icon: Icon }: { items: Array<{ id: string; name: string; code: string; status: string }>; isLoading: boolean; icon: React.ElementType }) {
  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
  if (!items.length) return <p className="text-center text-sm text-muted-foreground py-8">None yet.</p>
  return (
    <div className="space-y-2">
      {items.map((loc) => (
        <div key={loc.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">{loc.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{loc.code}</p>
            </div>
          </div>
          <Badge variant={loc.status === "ACTIVE" ? "default" : "secondary"}>{loc.status}</Badge>
        </div>
      ))}
    </div>
  )
}

export default function WarehousesPage() {
  const { data: warehouses = [], isLoading: wLoading } = useGetWarehouses()
  const { data: outlets = [], isLoading: oLoading } = useGetOutlets()
  const { mutate: createWarehouse, isPending: cwPending } = useCreateWarehouse()
  const { mutate: createOutlet, isPending: coPending } = useCreateOutlet()

  return (
    <PageShell>
      <PageHeader title="Locations" description="Manage warehouses and outlets for inventory tracking." />

      <Tabs defaultValue="warehouses">
        <TabsList>
          <TabsTrigger value="warehouses" className="gap-1.5"><Building2 className="w-4 h-4" />Warehouses ({warehouses.length})</TabsTrigger>
          <TabsTrigger value="outlets" className="gap-1.5"><Store className="w-4 h-4" />Outlets ({outlets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="warehouses" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">New Warehouse</CardTitle></CardHeader>
              <CardContent>
                <LocationForm type="WAREHOUSE" onCreate={(d) => createWarehouse(d)} isPending={cwPending} />
              </CardContent>
            </Card>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader><CardTitle>Warehouses</CardTitle></CardHeader>
                <CardContent><LocationList items={warehouses} isLoading={wLoading} icon={Building2} /></CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="outlets" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">New Outlet</CardTitle></CardHeader>
              <CardContent>
                <LocationForm type="OUTLET" onCreate={(d) => createOutlet(d)} isPending={coPending} />
              </CardContent>
            </Card>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader><CardTitle>Outlets</CardTitle></CardHeader>
                <CardContent><LocationList items={outlets} isLoading={oLoading} icon={Store} /></CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
