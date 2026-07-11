"use client"
import { useState, useMemo, useRef } from "react"
import type { ColumnDef, Updater } from "@tanstack/react-table"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Loader2,
  FolderOpen,
  ImagePlus,
  X,
} from "lucide-react"
import Image from "next/image"
import { useGetCategories } from "@/features/categories/api/use-get-categories"
import { useCreateCategories } from "@/features/categories/api/use-create-categories"
import { useUpdateCategory } from "@/features/categories/api/use-update-category"
import { useDeleteCategory } from "@/features/categories/api/use-delete-category"
import { useBulkDeleteCategories } from "@/features/categories/api/use-bulk-delete-categories"
import { toast } from "sonner"

type FlatCategory = {
  id: string
  label: string
  value: string
  parentId: string | null
  image: string | null
}

type CategoryRow = FlatCategory & {
  parentLabel: string
  subCount: number
}

function CategoriesClientPage() {
  const { data: rawCategories, isLoading } = useGetCategories()
  const { mutate: createCategory, isPending: isCreating } = useCreateCategories()
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory()
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory()
  const { mutate: bulkDelete, isPending: isBulkDeleting } = useBulkDeleteCategories()

  const [searchQuery, setSearchQuery] = useState("")
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CategoryRow | null>(null)
  
  const [categoryName, setCategoryName] = useState("")
  const [categoryValue, setCategoryValue] = useState("")
  const [selectedParentValue, setSelectedParentValue] = useState("none")
  const [imageUrl, setImageUrl] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories = (rawCategories as FlatCategory[] | undefined) ?? []

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, "-").trim()

  const rows: CategoryRow[] = useMemo(() => {
    const parentMap = new Map(categories.map((c) => [c.value, c.label]))
    const subCounts = new Map<string, number>()
    for (const c of categories) {
      if (c.parentId) {
        const parent = categories.find((p) => p.id === c.parentId)
        if (parent) {
          subCounts.set(parent.value, (subCounts.get(parent.value) || 0) + 1)
        }
      }
    }
    const filtered = searchQuery
      ? categories.filter(
          (c) =>
            c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.value.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : categories
    return filtered.map((c) => ({
      ...c,
      parentLabel: c.parentId ? parentMap.get(categories.find((p) => p.id === c.parentId)?.value ?? "") ?? "—" : "—",
      subCount: subCounts.get(c.value) ?? 0,
    }))
  }, [categories, searchQuery])

  const handleImageSelect = (file: File) => {
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imageUrl || null
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("image", imageFile)
      const res = await fetch("/api/categories/upload-image", { method: "POST", body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error((json as { error?: string }).error || "Upload failed")
      return (json as { url: string }).url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image")
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalImage = await uploadImage()
    if (imageFile && !finalImage) return

    const parentCategory = selectedParentValue !== "none"
      ? categories.find((c) => c.value === selectedParentValue)
      : null
    createCategory(
      { label: categoryName, value: categoryValue, parentId: parentCategory?.id ?? null, image: finalImage ?? null },
      {
        onSuccess: () => {
          setCategoryName("")
          setCategoryValue("")
          setSelectedParentValue("none")
          setImageFile(null)
          setImagePreview("")
          setImageUrl("")
          setCreateOpen(false)
        },
      }
    )
  }

  const handleEdit = (category: CategoryRow) => {
    setCategoryName(category.label)
    setCategoryValue(category.value)
    setSelectedParentValue(category.parentId ? categories.find(c => c.id === category.parentId)?.value ?? "none" : "none")
    setImagePreview(category.image || "")
    setImageUrl(category.image || "")
    setImageFile(null)
    setEditTarget(category)
    setEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return

    const finalImage = await uploadImage()
    if (imageFile && !finalImage) return

    const parentCategory = selectedParentValue !== "none"
      ? categories.find((c) => c.value === selectedParentValue)
      : null

    updateCategory(
      { 
        currentValue: editTarget.value, 
        value: categoryValue, 
        label: categoryName, 
        parentId: parentCategory?.id ?? null, 
        image: finalImage ?? null 
      },
      {
        onSuccess: () => {
          setCategoryName("")
          setCategoryValue("")
          setSelectedParentValue("none")
          setImageFile(null)
          setImagePreview("")
          setImageUrl("")
          setEditTarget(null)
          setEditOpen(false)
        },
      }
    )
  }

  const rootCategories = categories.filter((c) => !c.parentId)
  const selectedCount = Object.keys(rowSelection).length

  const columns: ColumnDef<CategoryRow>[] = [
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
      accessorKey: "image",
      header: "Image",
      enableHiding: false,
      cell: ({ row }) =>
        row.original.image ? (
          <img
            src={row.original.image}
            alt={row.original.label}
            className="h-10 w-10 object-cover rounded"
          />
        ) : (
          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </div>
        ),
    },
    {
      accessorKey: "label",
      header: "Label",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.label}</span>
      ),
    },
    {
      accessorKey: "value",
      header: "Slug",
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.value}</code>
      ),
    },
    {
      accessorKey: "parentLabel",
      header: "Parent",
      cell: ({ row }) =>
        row.original.parentLabel !== "—" ? (
          <span>{row.original.parentLabel}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "subCount",
      header: "Subcategories",
      cell: ({ row }) =>
        row.original.subCount > 0 ? (
          <Badge variant="secondary">{row.original.subCount}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableHiding: false,
      cell: ({ row }) => {
        const cat = row.original
        const canDelete = cat.subCount === 0
        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}>
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => handleEdit(cat)}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={!canDelete ? "text-destructive focus:text-destructive" : ""}
                  disabled={!canDelete || isDeleting}
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => canDelete && setDeleteTarget(cat)}
                >
                  {!canDelete ? "Has subcategories" : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const handleBulkDelete = () => {
    const values = rows.filter((_, i) => rowSelection[i.toString()]).map((r) => r.value)
    if (values.length === 0) return
    bulkDelete(values, {
      onSuccess: () => {
        setRowSelection({})
        setConfirmBulkDelete(false)
      },
      onError: () => setConfirmBulkDelete(false),
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold">Categories</h1>
        <div className="rounded-xl border p-12 text-center text-muted-foreground">
          Loading categories...
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className={buttonVariants()}>
            <Plus />
            Add Category
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedParentValue !== "none" ? "Add Subcategory" : "Create Category"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Parent Category</label>
                <select
                  value={selectedParentValue}
                  onChange={(e) => setSelectedParentValue(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="none">None (top-level)</option>
                  {rootCategories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Name</label>
                <Input
                  placeholder="Category Name"
                  value={categoryName}
                  onChange={(e) => {
                    setCategoryName(e.target.value)
                    setCategoryValue(generateSlug(e.target.value))
                  }}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Slug</label>
                <Input
                  placeholder="category-slug"
                  value={categoryValue}
                  onChange={(e) => setCategoryValue(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Image</label>
                <div className="flex items-start gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageSelect(file)
                    }}
                  />
                  {imagePreview ? (
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden border">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-background/80 flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-20 w-20 rounded-lg border-2 border-dashed border-input flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:border-foreground/50 transition-colors"
                    >
                      <ImagePlus className="h-5 w-5" />
                      Upload
                    </button>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isCreating || isUploading}>
                {(isCreating || isUploading) ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> {isUploading ? "Uploading..." : "Creating..."}</>
                ) : (
                  selectedParentValue !== "none" ? "Add Subcategory" : "Create Category"
                )}
              </Button>

              {selectedParentValue !== "none" && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => setSelectedParentValue("none")}
                >
                  Switch to top-level
                </Button>
              )}
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) {
            setCategoryName("")
            setCategoryValue("")
            setSelectedParentValue("none")
            setImageFile(null)
            setImagePreview("")
            setImageUrl("")
            setEditTarget(null)
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Parent Category</label>
                <select
                  value={selectedParentValue}
                  onChange={(e) => setSelectedParentValue(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="none">None (top-level)</option>
                  {rootCategories.filter(c => c.value !== editTarget?.value).map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Name</label>
                <Input
                  placeholder="Category Name"
                  value={categoryName}
                  onChange={(e) => {
                    setCategoryName(e.target.value)
                    setCategoryValue(generateSlug(e.target.value))
                  }}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Slug</label>
                <Input
                  placeholder="category-slug"
                  value={categoryValue}
                  onChange={(e) => setCategoryValue(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Image</label>
                <div className="flex items-start gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageSelect(file)
                    }}
                  />
                  {imagePreview ? (
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden border">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-background/80 flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-20 w-20 rounded-lg border-2 border-dashed border-input flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:border-foreground/50 transition-colors"
                    >
                      <ImagePlus className="h-5 w-5" />
                      Upload
                    </button>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isUpdating || isUploading}>
                {(isUpdating || isUploading) ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> {isUploading ? "Uploading..." : "Updating..."}</>
                ) : (
                  "Update Category"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable<CategoryRow, unknown>
        columns={columns}
        data={rows}
        rowSelection={rowSelection}
        onRowSelectionChange={(updater: Updater<Record<string, boolean>>) => {
          setRowSelection(typeof updater === "function" ? updater(rowSelection) : updater)
        }}
        searchSlot={
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.label}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => {
                if (deleteTarget) {
                  deleteCategory({ value: deleteTarget.value }, { onSuccess: () => setDeleteTarget(null) })
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
            <AlertDialogTitle>Delete Selected Categories</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected categories? Categories with subcategories will be skipped.
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

export default CategoriesClientPage
