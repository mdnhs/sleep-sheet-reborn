"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DeleteAlertMessage } from "@/components/DeleteAlertMessage"
import { useGetBrands, useCreateBrand, useArchiveBrand } from "@/features/(erp-core)/catalog/api/brands"
import { Plus, Tag, Trash } from "lucide-react"

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export default function BrandsPage() {
  const { data: brands = [], isLoading } = useGetBrands()
  const { mutate: create, isPending: creating } = useCreateBrand()
  const { mutate: archive, isPending: archiving } = useArchiveBrand()

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !slug) return
    create({ name, slug }, { onSuccess: () => { setName(""); setSlug("") } })
  }

  return (
    <PageShell>
      <PageHeader title="Brands" description="Manage product brands for this organization." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="w-4 h-4" />New Brand</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Name</label>
                <Input
                  placeholder="Brand name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)) }}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Slug</label>
                <Input
                  placeholder="brand-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating…" : "Create Brand"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                All Brands
                {brands.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({brands.length})</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
              ) : brands.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No brands yet. Create one above.</p>
              ) : (
                <div className="space-y-2">
                  {brands.map((brand) => (
                    <div key={brand.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{brand.name}</p>
                          <p className="text-xs text-muted-foreground">{brand.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={brand.status === "ACTIVE" ? "default" : "secondary"}>{brand.status}</Badge>
                        <DeleteAlertMessage
                          description={`Archive brand "${brand.name}"? It will be hidden from use.`}
                          loading={archiving}
                          onConfirm={() => archive(brand.id)}
                        >
                          <Button variant="destructive" size="icon" className="h-7 w-7 rounded-full">
                            <Trash className="w-3 h-3" />
                          </Button>
                        </DeleteAlertMessage>
                      </div>
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
