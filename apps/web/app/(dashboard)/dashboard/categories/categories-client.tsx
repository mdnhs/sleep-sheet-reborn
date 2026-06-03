"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetCategories } from "@/features/(erp-core)/categories/api/use-get-categories";
import { ChevronDown, ChevronRight, FolderOpen, Tag, Trash } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCreateCategories } from "@/features/(erp-core)/categories/api/use-create-categories";
import { useDeleteCategory } from "@/features/(erp-core)/categories/api/use-delete-category";
import { DeleteAlertMessage } from "@/components/DeleteAlertMessage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FlatCategory = { id: string; label: string; value: string; parentId: string | null };
type CategoryNode = FlatCategory & { children: CategoryNode[] };

function buildTree(flat: FlatCategory[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>();
  flat.forEach((c) => byId.set(c.id, { ...c, children: [] }));

  const roots: CategoryNode[] = [];
  flat.forEach((c) => {
    const node = byId.get(c.id)!;
    if (!c.parentId) {
      roots.push(node);
    } else {
      const parent = byId.get(c.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  });

  return roots;
}

function SubcategoryRow({
  node,
  onDelete,
  isDeleting,
}: {
  node: CategoryNode;
  onDelete: (value: string) => void;
  isDeleting: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg p-3 border transition-all hover:bg-accent bg-card">
      <div className="flex items-center gap-2 min-w-0">
        <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
        <div>
          <p className="font-medium text-foreground text-sm">{node.label}</p>
          <p className="text-xs text-muted-foreground">{node.value}</p>
        </div>
      </div>
      <DeleteAlertMessage
        description={`This will permanently delete "${node.label}" subcategory.`}
        loading={isDeleting}
        onConfirm={() => onDelete(node.value)}
      >
        <Button variant="destructive" size="icon" className="rounded-full h-7 w-7">
          <Trash className="w-3 h-3" />
          <span className="sr-only">Delete</span>
        </Button>
      </DeleteAlertMessage>
    </div>
  );
}

function CategoryTreeNode({
  node,
  onDelete,
  isDeleting,
  onAddChild,
  expanded,
  onToggle,
}: {
  node: CategoryNode;
  onDelete: (value: string) => void;
  isDeleting: boolean;
  onAddChild: (parentValue: string, parentLabel: string) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center justify-between rounded-lg p-3 border",
          "transition-all hover:bg-accent bg-card"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={onToggle}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <div>
            <p className="font-medium text-foreground text-sm">{node.label}</p>
            <p className="text-xs text-muted-foreground">{node.value}</p>
          </div>
          {hasChildren && (
            <span className="ml-1 text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              {node.children.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => onAddChild(node.value, node.label)}
          >
            + Sub
          </Button>
          <DeleteAlertMessage
            description={
              hasChildren
                ? `"${node.label}" has subcategories. Delete them first.`
                : `This will permanently delete "${node.label}" category.`
            }
            loading={isDeleting}
            onConfirm={() => {
              if (!hasChildren) onDelete(node.value);
            }}
          >
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full h-7 w-7"
              disabled={hasChildren}
            >
              <Trash className="w-3 h-3" />
              <span className="sr-only">Delete</span>
            </Button>
          </DeleteAlertMessage>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="ml-6 mt-1 space-y-1 border-l pl-3">
          {node.children.map((child) => (
            <SubcategoryRow
              key={child.value}
              node={child}
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoriesClientPage() {
  const { data: rawCategories, isLoading } = useGetCategories();
  const { mutate, isPending: isCreatingCategory } = useCreateCategories();
  const { mutate: deleteCategory, isPending: isCategoryLoading } = useDeleteCategory();

  const [categoryName, setCategoryName] = React.useState("");
  const [categoryValue, setCategoryValue] = React.useState("");
  const [selectedParentValue, setSelectedParentValue] = React.useState<string>("none");
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(new Set());

  const categories = (rawCategories as FlatCategory[] | undefined) ?? [];
  const rootCategories = categories.filter((c) => !c.parentId);
  const tree = React.useMemo(() => buildTree(categories), [categories]);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, "-").trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parentCategory = selectedParentValue !== "none"
      ? categories.find((c) => c.value === selectedParentValue)
      : null;

    mutate(
      {
        label: categoryName,
        value: categoryValue,
        parentId: parentCategory?.id ?? null,
      },
      {
        onSuccess: () => {
          setCategoryName("");
          setCategoryValue("");
          setSelectedParentValue("none");
        },
      }
    );
  };

  const handleAddChild = (parentValue: string, parentLabel: string) => {
    setSelectedParentValue(parentValue);
    setCategoryName(`${parentLabel} `);
    setCategoryValue(generateSlug(`${parentLabel}-`));
    // auto-expand the parent so user sees where child will land
    setExpandedNodes((prev) => new Set(prev).add(parentValue));
  };

  const toggleExpand = (value: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="pb-4">
        <h1 className="text-3xl font-bold text-foreground">Category Manager</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage top-level categories and their subcategories.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              {selectedParentValue !== "none" ? "Add Subcategory" : "Create Category"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Parent Category</label>
                <Select value={selectedParentValue} onValueChange={(v) => setSelectedParentValue(v ?? "none")}>
                  <SelectTrigger>
                    <SelectValue placeholder="None (top-level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top-level)</SelectItem>
                    {rootCategories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Name</label>
                <Input
                  placeholder="Category Name"
                  value={categoryName}
                  onChange={(e) => {
                    setCategoryName(e.target.value);
                    setCategoryValue(generateSlug(e.target.value));
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

              <Button type="submit" className="w-full" disabled={isCreatingCategory}>
                {isCreatingCategory
                  ? "Creating..."
                  : selectedParentValue !== "none"
                  ? "Add Subcategory"
                  : "Create Category"}
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
          </CardContent>
        </Card>

        {/* Tree */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Categories
                {categories.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({rootCategories.length} top-level, {categories.length - rootCategories.length} sub)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-lg" />
                  ))}
                </div>
              ) : tree.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No categories yet. Create one to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {tree.map((node) => (
                    <CategoryTreeNode
                      key={node.value}
                      node={node}
                      onDelete={(value) => deleteCategory({ value })}
                      isDeleting={isCategoryLoading}
                      onAddChild={handleAddChild}
                      expanded={expandedNodes.has(node.value)}
                      onToggle={() => toggleExpand(node.value)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CategoriesClientPage;
