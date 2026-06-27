"use client"
import { useEffect, useState } from "react"
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
import { useGetProducts } from "@/features/product/api/use-get-products"
import { useDeleteProduct } from "@/features/dashboard/api/use-delete-product"
import { useBulkDeleteProducts } from "@/features/dashboard/api/use-bulk-delete-products"
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
  const [productToDelete, setProductToDelete] = useState<ProductColumn | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const { data: products, isLoading } = useGetProducts({
    page: (pagination.pageIndex + 1).toString(),
    search: debouncedSearch,
    sort: "newest",
    limit: pagination.pageSize.toString(),
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
      cell: ({ row }) => (row.original.isFeatured ? "Yes" : "No"),
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
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}>
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href={`/dashboard/products/update/${product.id}`}>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                </Link>
                <Link href={`/dashboard/products/create?duplicate=${product.id}`}>
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
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
    setSearchQuery(e.target.value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
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
    <div className="container mx-auto space-y-4 py-4 px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button nativeButton={false} render={<Link href="/dashboard/products/create" />}>
          <Plus />
          Add New
        </Button>
      </div>

      <DataTable<ProductColumn, unknown>
        columns={columns}
        data={products?.data ?? []}
        manualPagination
        pageCount={products?.totalPages ?? -1}
        pagination={pagination}
        onPaginationChange={(updater: Updater<PaginationState>) => {
          setPagination(typeof updater === "function" ? updater(pagination) : updater)
        }}
        rowSelection={rowSelection}
        onRowSelectionChange={(updater: Updater<Record<string, boolean>>) => {
          setRowSelection(typeof updater === "function" ? updater(rowSelection) : updater)
        }}
        searchSlot={
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-9 max-w-sm rounded-xl"
              />
            </div>
            {selectedCount > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm text-muted-foreground whitespace-nowrap">{selectedCount} selected</span>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setConfirmBulkDelete(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        }
      />

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
