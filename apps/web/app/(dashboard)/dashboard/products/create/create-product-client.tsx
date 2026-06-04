"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { useCreateProductV1 } from "@/features/(erp-core)/catalog/api/products-v1"
import { useGetBrands } from "@/features/(erp-core)/catalog/api/brands"
import { useGetCategories } from "@/features/(erp-core)/categories/api/use-get-categories"
import { Package, Save } from "lucide-react"

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export default function CreateProductClient() {
  const router = useRouter()
  const { mutate: create, isPending } = useCreateProductV1()
  const { data: categories = [] } = useGetCategories()
  const { data: brands = [] } = useGetBrands()

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [brandId, setBrandId] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    create(
      {
        name,
        slug,
        description: description || undefined,
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
      },
      {
        onSuccess: (product) => {
          router.push(`/dashboard/products/update/${product.id}`)
        },
      }
    )
  }

  return (
    <PageShell>
      <PageHeader
        title="Create Product"
        description="Add a new product to your catalog. Add variants after saving."
      >
        <Button type="submit" form="create-product-form" disabled={isPending}>
          <Save className="w-4 h-4 mr-1" />{isPending ? "Saving…" : "Save Product"}
        </Button>
      </PageHeader>

      <form id="create-product-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-4 h-4" />Basic Info</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Product Name *</label>
                  <Input
                    placeholder="e.g. Basmati Rice"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)) }}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Slug *</label>
                  <Input
                    placeholder="basmati-rice"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    pattern="[a-z0-9-]+"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Unique per organization. URL-safe lowercase.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Description</label>
                  <Textarea
                    placeholder="Product description…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Classification</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Category</label>
                  <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Brand</label>
                  <Select value={brandId} onValueChange={(v) => setBrandId(v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">
                  After saving, you can add variants (SKU, price, unit) from the product detail page.
                  Inventory is tracked per variant per location — not on the product directly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </PageShell>
  )
}
