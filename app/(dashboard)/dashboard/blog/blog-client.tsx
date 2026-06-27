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
import { MoreVertical, Plus, Search, Trash2, Loader2, EyeOff, CheckCircle } from "lucide-react"
import { useGetPosts } from "@/features/blog/api/use-get-posts"
import { useDeletePost } from "@/features/blog/api/use-delete-post"
import { useBulkDeletePosts } from "@/features/blog/api/use-bulk-delete-posts"
import Link from "next/link"

export type BlogColumn = {
  id: string
  title: string
  slug: string
  summary: string | null
  isPublished: boolean
  createdAt: string
  author: { id: string; name: string } | null
}

export default function BlogClientPage() {
  const { mutate: deletePost, isPending: isDeleting } = useDeletePost()
  const { mutate: bulkDelete, isPending: isBulkDeleting } = useBulkDeletePosts()
  const [postToDelete, setPostToDelete] = useState<BlogColumn | null>(null)
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

  const { data: postsData, isLoading } = useGetPosts({
    page: (pagination.pageIndex + 1).toString(),
    search: debouncedSearch,
    limit: pagination.pageSize.toString(),
  })

  const handleBulkDelete = () => {
    const ids = (postsData?.data ?? [])
      .filter((_: unknown, index: number) => rowSelection[index.toString()])
      .map((p: BlogColumn) => p.id)
    if (ids.length === 0) return
    bulkDelete(ids, {
      onSuccess: () => {
        setRowSelection({})
        setConfirmBulkDelete(false)
      },
      onError: () => setConfirmBulkDelete(false),
    })
  }

  const columns: ColumnDef<BlogColumn>[] = [
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
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium line-clamp-1">{row.original.title}</span>
          <span className="text-xs text-muted-foreground">/{row.original.slug}</span>
        </div>
      ),
    },
    {
      accessorKey: "author",
      header: "Author",
      cell: ({ row }) => row.original.author?.name || "—",
    },
    {
      accessorKey: "isPublished",
      header: "Status",
      cell: ({ row }) =>
        row.original.isPublished ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            <CheckCircle className="h-3 w-3" />
            Published
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            <EyeOff className="h-3 w-3" />
            Draft
          </span>
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
        const post = row.original
        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}>
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href={`/dashboard/blog/update/${post.id}`}>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  disabled={isDeleting}
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => setPostToDelete(post)}
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
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <div className="flex items-center justify-between py-4 gap-4">
          <Input placeholder="Search posts..." disabled className="max-w-sm" />
          <Button disabled><Plus /> Create Post</Button>
        </div>
        <div className="rounded-xl border p-12 text-center text-muted-foreground">
          Loading posts...
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-4 py-4 px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <Link href="/dashboard/blog/create">
          <Button>
            <Plus />
            Create Post
          </Button>
        </Link>
      </div>

      <DataTable<BlogColumn, unknown>
        columns={columns}
        data={postsData?.data ?? []}
        manualPagination
        pageCount={postsData?.totalPages ?? -1}
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
                placeholder="Search posts..."
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

      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{postToDelete?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => {
                if (postToDelete) {
                  deletePost(postToDelete.id, { onSuccess: () => setPostToDelete(null) })
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
            <AlertDialogTitle>Delete Selected Posts</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected posts? This action cannot be undone.
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
