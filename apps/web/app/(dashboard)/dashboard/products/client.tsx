"use client"
import { useState } from "react"
import Link from "next/link"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeleteAlertMessage } from "@/components/DeleteAlertMessage"
import { useGetProductsV1, useArchiveProductV1 } from "@/features/(erp-core)/catalog/api/products-v1"
import { Plus, Pencil, Trash, Search } from "lucide-react"

const STATUS_OPTIONS = ["", "DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]
const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  DRAFT: "secondary",
  INACTIVE: "outline",
  ARCHIVED: "destructive",
}

export default function ProductsClientPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading } = useGetProductsV1({ search: search || undefined, status: status || undefined, page, limit })
  const { mutate: archive, isPending: archiving } = useArchiveProductV1()

  const products = data?.data ?? []
  const totalPages = data?.pagination.totalPages ?? 1
  const totalItems = data?.pagination.totalItems ?? 0

  return (
    <PageShell>
      <PageHeader title="Products" description={`${totalItems} total products`}>
        <Link href="/dashboard/products/create" className={buttonVariants()}><Plus className="w-4 h-4 mr-1" />New Product</Link>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search products…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(!v || v === "all" ? "" : v); setPage(1) }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  {search ? "No products match your search." : "No products yet. Create one to get started."}
                </TableCell>
              </TableRow>
            ) : (
              products.map(({ product, category, brand }) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{product.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{category?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{brand?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[product.status] ?? "secondary"}>{product.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/dashboard/products/update/${product.id}`} className={buttonVariants({ size: "icon", variant: "ghost" }) + " h-7 w-7"}><Pencil className="w-3 h-3" /></Link>
                      <DeleteAlertMessage
                        description={`Archive "${product.name}"? It will be hidden from sales.`}
                        loading={archiving}
                        onConfirm={() => archive(product.id)}
                      >
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                          <Trash className="w-3 h-3" />
                        </Button>
                      </DeleteAlertMessage>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </PageShell>
  )
}
