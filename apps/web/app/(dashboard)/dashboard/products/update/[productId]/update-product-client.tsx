"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { DeleteAlertMessage } from "@/components/DeleteAlertMessage"
import { useProductId } from "@/features/(erp-core)/products/hooks/use-product-id"
import {
  useGetProductV1, useUpdateProductV1, useArchiveProductV1,
  useGetVariants, useCreateVariant,
  type Variant,
} from "@/features/(erp-core)/catalog/api/products-v1"
import { useGetCategoriesV1 } from "@/features/(erp-core)/catalog/api/categories-v1"
import { useGetBrands } from "@/features/(erp-core)/catalog/api/brands"
import { useGetUnits } from "@/features/(erp-core)/catalog/api/units"
import { useGetProductImages, useUploadProductImage, useDeleteProductImage } from "@/features/(erp-core)/catalog/api/product-images"
import { ArrowLeft, ImageIcon, Package, Plus, Save, Layers, Trash, Upload } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

const STATUS_OPTIONS = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"] as const
const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default", DRAFT: "secondary", INACTIVE: "outline", ARCHIVED: "destructive",
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

// ── Add Variant Dialog ────────────────────────────────────────────────────────

function AddVariantDialog({
  productId,
  open,
  onOpenChange,
}: {
  productId: string
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { data: units = [] } = useGetUnits()
  const { mutate: create, isPending } = useCreateVariant()

  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [barcode, setBarcode] = useState("")
  const [unitId, setUnitId] = useState("")
  const [costPrice, setCostPrice] = useState("")
  const [sellingPrice, setSellingPrice] = useState("")

  function reset() {
    setName(""); setSku(""); setBarcode(""); setUnitId(""); setCostPrice(""); setSellingPrice("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    create(
      {
        productId,
        name,
        sku,
        barcode: barcode || undefined,
        unitId: unitId || undefined,
        costPrice: costPrice ? parseFloat(costPrice) : 0,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : 0,
      },
      {
        onSuccess: () => { reset(); onOpenChange(false) },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Variant</DialogTitle>
        </DialogHeader>
        <form id="add-variant-form" onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Variant Name *</label>
            <Input placeholder="e.g. 1kg" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">SKU *</label>
              <Input placeholder="RICE-001-1KG" value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} required />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Barcode</label>
              <Input placeholder="Optional" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Unit</label>
            <Select value={unitId} onValueChange={(v) => setUnitId(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name} ({u.shortName})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Cost Price</label>
              <Input type="number" min={0} step={0.01} placeholder="0.00" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Selling Price</label>
              <Input type="number" min={0} step={0.01} placeholder="0.00" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }}>Cancel</Button>
          <Button type="submit" form="add-variant-form" disabled={isPending}>
            {isPending ? "Adding…" : "Add Variant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Variants Tab ──────────────────────────────────────────────────────────────

function VariantsTab({ productId }: { productId: string }) {
  const { data: variants = [], isLoading } = useGetVariants(productId)
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />Add Variant
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="w-4 h-4" />Variants
            {variants.length > 0 && <span className="text-sm font-normal text-muted-foreground">({variants.length})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
          ) : variants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Layers className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No variants yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Inventory is tracked per variant per location.</p>
              <Button className="mt-4" variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="w-3 h-3 mr-1" />Add First Variant
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(variants as Variant[]).map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell className="font-mono text-xs">{v.sku}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{v.barcode ?? "—"}</TableCell>
                    <TableCell className="text-right text-sm">{v.costPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{v.sellingPrice.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={v.status === "ACTIVE" ? "default" : "secondary"}>{v.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <DeleteAlertMessage
                        title="Deactivate variant?"
                        description={`Variant "${v.name}" (${v.sku}) will be marked inactive. Existing inventory records are preserved.`}
                        onConfirm={() => {/* deactivate handled by future hook */}}
                      >
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                          <Trash className="w-3 h-3" />
                        </Button>
                      </DeleteAlertMessage>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddVariantDialog productId={productId} open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}

// ── Images Tab ────────────────────────────────────────────────────────────────

function ImagesTab({ productId }: { productId: string }) {
  const { data: images = [], isLoading } = useGetProductImages(productId)
  const { mutate: upload, isPending: uploading } = useUploadProductImage(productId)
  const { mutate: remove, isPending: deleting } = useDeleteProductImage(productId)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) upload(file)
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="w-4 h-4 mr-1" />{uploading ? "Uploading…" : "Upload Image"}
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ImageIcon className="w-4 h-4" />Product Images</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
              <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No images yet.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => fileRef.current?.click()}>
                <Upload className="w-3 h-3 mr-1" />Upload First Image
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img) => (
                <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <DeleteAlertMessage
                      title="Delete image?"
                      description="Image will be removed from Cloudinary and cannot be recovered."
                      loading={deleting}
                      onConfirm={() => remove(img.id)}
                    >
                      <Button variant="destructive" size="icon" className="h-8 w-8">
                        <Trash className="w-4 h-4" />
                      </Button>
                    </DeleteAlertMessage>
                  </div>
                  <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1 rounded">
                    #{img.sortOrder + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Details Tab ───────────────────────────────────────────────────────────────

function DetailsTab({ productId }: { productId: string }) {
  const { data, isLoading } = useGetProductV1(productId)
  const { data: categories = [] } = useGetCategoriesV1()
  const { data: brands = [] } = useGetBrands()
  const { mutate: update, isPending: saving } = useUpdateProductV1()

  const product = data?.product

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [brandId, setBrandId] = useState("")
  const [status, setStatus] = useState<typeof STATUS_OPTIONS[number]>("DRAFT")

  useEffect(() => {
    if (!product) return
    setName(product.name)
    setSlug(product.slug)
    setDescription(product.description ?? "")
    setCategoryId(product.categoryId ?? "")
    setBrandId(product.brandId ?? "")
    setStatus(product.status)
  }, [product])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update({
      id: productId,
      name,
      slug,
      description: description || null,
      categoryId: categoryId || null,
      brandId: brandId || null,
      status,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Package className="w-4 h-4" />Basic Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Product Name *</label>
                <Input
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (!product || slug === slugify(product.name)) setSlug(slugify(e.target.value)) }}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Slug *</label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} pattern="[a-z0-9-]+" required />
                <p className="text-xs text-muted-foreground">Unique per organization.</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Classification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Status</label>
                <Select value={status} onValueChange={(v) => setStatus((v ?? "DRAFT") as typeof STATUS_OPTIONS[number])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Category</label>
                <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.filter((c) => c.status === "ACTIVE").map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Brand</label>
                <Select value={brandId} onValueChange={(v) => setBrandId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>
                    {brands.filter((b) => b.status === "ACTIVE").map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={saving}>
            <Save className="w-4 h-4 mr-1" />{saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UpdateProductClient() {
  const productId = useProductId()
  const router = useRouter()
  const { data, isLoading } = useGetProductV1(productId)
  const { mutate: archive, isPending: archiving } = useArchiveProductV1()

  const productName = data?.product.name ?? "Product"

  return (
    <PageShell>
      <PageHeader title={isLoading ? "Loading…" : productName} description="Edit product details and manage variants.">
        <Link href="/dashboard/products" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Link>
        <DeleteAlertMessage
          title="Archive product?"
          description="Archived products are hidden from sales and e-commerce. Inventory records are preserved."
          loading={archiving}
          onConfirm={() => archive(productId, { onSuccess: () => router.push("/dashboard/products") })}
        >
          <Button variant="destructive" size="sm">Archive</Button>
        </DeleteAlertMessage>
      </PageHeader>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-4">
          <DetailsTab productId={productId} />
        </TabsContent>
        <TabsContent value="variants" className="mt-4">
          <VariantsTab productId={productId} />
        </TabsContent>
        <TabsContent value="images" className="mt-4">
          <ImagesTab productId={productId} />
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
