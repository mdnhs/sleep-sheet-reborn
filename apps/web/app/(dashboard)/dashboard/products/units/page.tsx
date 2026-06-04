"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DeleteAlertMessage } from "@/components/DeleteAlertMessage"
import { useGetUnits, useCreateUnit, useDeleteUnit } from "@/features/(erp-core)/catalog/api/units"
import { Plus, Ruler, Trash } from "lucide-react"

export default function UnitsPage() {
  const { data: units = [], isLoading } = useGetUnits()
  const { mutate: create, isPending: creating } = useCreateUnit()
  const { mutate: remove, isPending: deleting } = useDeleteUnit()

  const [name, setName] = useState("")
  const [shortName, setShortName] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !shortName) return
    create({ name, shortName }, { onSuccess: () => { setName(""); setShortName("") } })
  }

  return (
    <PageShell>
      <PageHeader title="Units of Measure" description="Manage measurement units for product variants." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="w-4 h-4" />New Unit</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Name</label>
                <Input placeholder="e.g. Kilogram" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Short Name</label>
                <Input placeholder="e.g. KG" value={shortName} onChange={(e) => setShortName(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating…" : "Create Unit"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                All Units
                {units.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({units.length})</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
              ) : units.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No units yet.</p>
              ) : (
                <div className="space-y-2">
                  {units.map((unit) => (
                    <div key={unit.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors">
                      <div className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{unit.name}</p>
                          <p className="text-xs text-muted-foreground">{unit.shortName}</p>
                        </div>
                      </div>
                      <DeleteAlertMessage
                        description={`Delete unit "${unit.name}"?`}
                        loading={deleting}
                        onConfirm={() => remove(unit.id)}
                      >
                        <Button variant="destructive" size="icon" className="h-7 w-7 rounded-full">
                          <Trash className="w-3 h-3" />
                        </Button>
                      </DeleteAlertMessage>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
