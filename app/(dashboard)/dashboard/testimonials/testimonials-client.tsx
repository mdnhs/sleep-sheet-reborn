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
import { MoreVertical, Search, Trash2, Loader2, Star, ImageIcon } from "lucide-react"
import { useGetTestimonials } from "@/features/testimonials/api/use-get-testimonials"
import { useDeleteTestimonial } from "@/features/testimonials/api/use-delete-testimonial"
import { useBulkDeleteTestimonials } from "@/features/testimonials/api/use-bulk-delete-testimonials"

export type TestimonialColumn = {
  id: string
  name: string
  message: string
  rating: number
  role: string
  screenshot: string | null
  createdAt: string
}

const roleLabel: Record<string, string> = {
  FASHION_ENTHUSIAST: "Fashion Enthusiast",
  CUSTOMER: "Customer",
  INFLUENCER: "Influencer",
  OTHER: "Other",
}

export default function TestimonialsClientPage() {
  const { mutate: deleteTestimonial, isPending: isDeleting } = useDeleteTestimonial()
  const { mutate: bulkDelete, isPending: isBulkDeleting } = useBulkDeleteTestimonials()
  const [testimonialToDelete, setTestimonialToDelete] = useState<TestimonialColumn | null>(null)
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

  const { data: testimonials, isLoading } = useGetTestimonials({
    page: (pagination.pageIndex + 1).toString(),
    search: debouncedSearch,
    limit: pagination.pageSize.toString(),
  })

  const handleBulkDelete = () => {
    const ids = (testimonials?.data ?? [])
      .filter((_: unknown, index: number) => rowSelection[index.toString()])
      .map((t: TestimonialColumn) => t.id)
    if (ids.length === 0) return
    bulkDelete(ids, {
      onSuccess: () => {
        setRowSelection({})
        setConfirmBulkDelete(false)
      },
      onError: () => setConfirmBulkDelete(false),
    })
  }

  const columns: ColumnDef<TestimonialColumn>[] = [
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
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm line-clamp-2 max-w-xs">
          {row.original.message || <span className="italic">Screenshot only</span>}
        </span>
      ),
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span>{row.original.rating}/5</span>
        </div>
      ),
    },
    {
      accessorKey: "screenshot",
      header: "Screenshot",
      cell: ({ row }) =>
        row.original.screenshot ? (
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        ) : (
          <span className="text-muted-foreground/50 text-sm">—</span>
        ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => roleLabel[row.original.role] || row.original.role,
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
        const testimonial = row.original
        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}>
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  disabled={isDeleting}
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => setTestimonialToDelete(testimonial)}
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
        <h1 className="text-2xl font-bold">Testimonials</h1>
        <div className="flex items-center justify-between py-4 gap-4">
          <Input placeholder="Search testimonials..." disabled className="max-w-sm" />
        </div>
        <div className="rounded-xl border p-12 text-center text-muted-foreground">
          Loading testimonials...
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-4 py-4 px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Testimonials</h1>
      </div>

      <DataTable<TestimonialColumn, unknown>
        columns={columns}
        data={testimonials?.data ?? []}
        manualPagination
        pageCount={testimonials?.totalPages ?? -1}
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
                placeholder="Search testimonials..."
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

      <AlertDialog open={!!testimonialToDelete} onOpenChange={(open) => !open && setTestimonialToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the testimonial from &quot;{testimonialToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => {
                if (testimonialToDelete) {
                  deleteTestimonial(testimonialToDelete.id, { onSuccess: () => setTestimonialToDelete(null) })
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
            <AlertDialogTitle>Delete Selected Testimonials</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected testimonials? This action cannot be undone.
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
