"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Copy, Download, ImageOff } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetInfiniteProducts } from "@/features/product/api/use-get-products";

interface ImageRow {
  productId: string;
  productName: string;
  categoryLabel: string;
  imageUrl: string;
  imageIndex: number;
}

export default function ImagesClientPage() {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetInfiniteProducts({ admin: "true", limit: "100", sort: "newest" });

  // The list endpoint is paginated (capped at 100/page); pull every page up
  // front so the table + xlsx export always cover the full catalog, not just
  // the first page.
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const rows: ImageRow[] = useMemo(() => {
    const products = data?.pages.flatMap((page) => page.data) ?? [];
    return products.flatMap((product) =>
      (product.images || []).map((url: string, idx: number) => ({
        productId: product.id,
        productName: product.name,
        categoryLabel: product.categoryLabel || "Uncategorized",
        imageUrl: url,
        imageIndex: idx + 1,
      })),
    );
  }, [data]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.categoryLabel.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const selectedRows = filteredRows.filter((_, index) => rowSelection[index.toString()]);

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("Image URL copied to clipboard");
  };

  const handleExport = () => {
    if (selectedRows.length === 0) {
      toast.error("Select at least one image to export");
      return;
    }
    const sheetData = selectedRows.map((r) => ({
      Category: r.categoryLabel,
      Product: r.productName,
      "Image URL": r.imageUrl,
    }));
    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Images");
    XLSX.writeFile(
      workbook,
      `product-images-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    toast.success(`Exported ${selectedRows.length} image(s)`);
  };

  const columns: ColumnDef<ImageRow>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="rounded border-input"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="rounded border-input"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "categoryLabel",
      header: "Category",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.categoryLabel}</span>
      ),
    },
    {
      accessorKey: "productName",
      header: "Product",
      cell: ({ row }) => (
        <span className="block max-w-[220px] truncate">
          {row.original.productName}
        </span>
      ),
    },
    {
      id: "image",
      header: "Image",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.original.imageUrl}
            alt={row.original.productName}
            className="h-12 w-12 shrink-0 rounded-md object-cover bg-muted"
          />
        ) : (
          <div className="h-12 w-12 shrink-0 rounded-md bg-muted flex items-center justify-center">
            <ImageOff className="h-4 w-4 text-muted-foreground" />
          </div>
        ),
    },
    {
      accessorKey: "imageUrl",
      header: "Cloudinary URL",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 max-w-[380px]">
          <span className="truncate text-xs text-muted-foreground">
            {row.original.imageUrl}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => handleCopy(row.original.imageUrl)}
            title="Copy URL"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Images
          </h2>
          <p className="text-sm text-muted-foreground">
            All product images with their Cloudinary URLs, by category.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredRows}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          searchSlot={
            <Input
              placeholder="Search by product or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm rounded-full"
            />
          }
          actionSlot={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={selectedRows.length === 0}
              className="rounded-full gap-1.5 shrink-0 text-xs font-semibold border bg-slate-50 dark:bg-muted/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Selected ({selectedRows.length})</span>
            </Button>
          }
        />
      )}
    </div>
  );
}
