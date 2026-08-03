"use client"
import { useEffect, useState } from "react"
import { useQueryState, parseAsString, parseAsInteger } from "nuqs"
import type { ColumnDef, PaginationState, Updater } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Copy, MoreVertical, Plus, Search, Trash2, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGetProducts } from "@/features/product/api/use-get-products"
import { useGetCategories } from "@/features/categories/api/use-get-categories"
import { useDeleteProduct } from "@/features/dashboard/api/use-delete-product"
import { useBulkDeleteProducts } from "@/features/dashboard/api/use-bulk-delete-products"
import { useBulkUpdateFeatured } from "@/features/dashboard/api/use-bulk-update-featured"
import { useCurrency } from "@/hooks/use-currency"
import Link from "next/link"

export type ProductColumn = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  isFeatured: boolean
  createdAt: string
  images: string[]
}

export default function ProductsClientPage() {
  const { formatAmount } = useCurrency()
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct()
  const { mutate: bulkDelete, isPending: isBulkDeleting } = useBulkDeleteProducts()
  const { mutate: updateFeatured, isPending: isUpdatingFeatured } = useBulkUpdateFeatured()
  const [productToDelete, setProductToDelete] = useState<ProductColumn | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  const [searchQuery, setSearchQuery] = useQueryState("search", parseAsString.withDefault(""))
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [limit, setLimit] = useQueryState("limit", parseAsInteger.withDefault(10))
  const [categoryId, setCategoryId] = useQueryState("category", parseAsString.withDefault("all"))
  const [featuredFilter, setFeaturedFilter] = useQueryState("featured", parseAsString.withDefault("all"))
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const pagination: PaginationState = {
    pageIndex: Math.max(0, page - 1),
    pageSize: limit,
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const { data: categories } = useGetCategories()

  const { data: products, isLoading } = useGetProducts({
    page: page.toString(),
    search: debouncedSearch,
    sort: "newest",
    limit: limit.toString(),
    admin: "true",
    category: categoryId === "all" ? undefined : categoryId,
    featured: featuredFilter === "all" ? undefined : featuredFilter,
  })

  const handleBulkDelete = () => {
    const ids = (products?.data ?? [])
      .filter((_, index) => rowSelection[index.toString()])
      .map((p) => p.id)
    if (ids.length === 0) return
    bulkDelete(ids, {
      onSuccess: () => {
        setRowSelection({})
        setConfirmBulkDelete(false)
      },
      onError: () => setConfirmBulkDelete(false),
    })
  }

  const columns: ColumnDef<ProductColumn>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="rounded border-input"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(value) => table.toggleAllPageRowsSelected(!!value.target.checked)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="rounded border-input"
          checked={row.getIsSelected()}
          onChange={(value) => row.toggleSelected(!!value.target.checked)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "images",
      header: "Image",
      enableHiding: false,
      cell: ({ row }) => (
        <img
          src={row.original.images[0] || "/placeholder.jpg"}
          alt="Product"
          className="h-10 w-10 object-cover rounded"
        />
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => formatAmount(row.original.price),
    },
    {
      accessorKey: "stock",
      header: "Stock",
    },
    {
      accessorKey: "isFeatured",
      header: "Featured",
      cell: ({ row }) => (
        <Switch
          checked={row.original.isFeatured}
          onCheckedChange={(checked) => 
            updateFeatured({ ids: [row.original.id], isFeatured: checked })
          }
          disabled={isUpdatingFeatured}
        />
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date Added",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <Link 
              href={`/dashboard/products/create?duplicate=${product.id}`}
              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
              title="Duplicate"
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}>
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href={`/dashboard/products/update/${product.id}`}>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  disabled={isDeleting}
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => setProductToDelete(product)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value || null)
    setPage(1)
  }

  const selectedCount = Object.keys(rowSelection).length

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-4 py-4 px-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex items-center justify-between py-4 gap-4">
          <Input placeholder="Search products..." disabled className="max-w-sm" />
          <Button disabled><Plus /> Add New</Button>
        </div>
        <div className="rounded-xl border p-12 text-center text-muted-foreground">
          Loading products...
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Manage your product catalog and inventory</p>
        </div>
        <Button nativeButton={false} render={<Link href="/dashboard/products/create" />} className="gap-2 text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 whitespace-nowrap rounded-full px-4 sm:px-5 h-9 text-xs font-semibold shrink-0">
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </div>

      <div className="rounded-3xl bg-white dark:bg-card p-4 sm:p-6 border-none shadow-none space-y-4">
        <DataTable<ProductColumn, unknown>
          columns={columns}
          data={products?.data ?? []}
          manualPagination
          pageCount={products?.totalPages ?? -1}
          pagination={pagination}
          onPaginationChange={(updater: Updater<PaginationState>) => {
            const next = typeof updater === "function" ? updater(pagination) : updater
            setPage(next.pageIndex + 1)
            setLimit(next.pageSize)
          }}
          rowSelection={rowSelection}
          onRowSelectionChange={(updater: Updater<Record<string, boolean>>) => {
            setRowSelection(typeof updater === "function" ? updater(rowSelection) : updater)
          }}
          searchSlot={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
              <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value || null)
                    setPage(1)
                  }}
                  className="pl-9 w-full rounded-full bg-slate-50 dark:bg-muted/40 border-none shadow-none text-xs font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto">
                <Select value={categoryId} onValueChange={(val) => { setCategoryId(val || "all"); setPage(1); }}>
                  <SelectTrigger className="w-full sm:w-[170px] rounded-full text-xs font-semibold bg-slate-50 dark:bg-muted/40 border-none shadow-none h-8 capitalize">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all" className="capitalize text-xs font-medium">All Categories</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.label} className="capitalize text-xs font-medium">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={featuredFilter} onValueChange={(val) => { setFeaturedFilter(val || "all"); setPage(1); }}>
                  <SelectTrigger className="w-full sm:w-[140px] rounded-full text-xs font-semibold bg-slate-50 dark:bg-muted/40 border-none shadow-none h-8 capitalize">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all" className="capitalize text-xs font-medium">All Statuses</SelectItem>
                    <SelectItem value="true" className="capitalize text-xs font-medium">Featured</SelectItem>
                    <SelectItem value="false" className="capitalize text-xs font-medium">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedCount > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{selectedCount} selected</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1.5 rounded-full text-xs font-semibold h-8 px-3"
                    onClick={() => setConfirmBulkDelete(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          }
        />
      </div>

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{productToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => {
                if (productToDelete) {
                  deleteProduct(productToDelete.id, { onSuccess: () => setProductToDelete(null) })
                }
              }}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Products</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected products? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBulkDeleting}
              onClick={handleBulkDelete}
            >
              {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
