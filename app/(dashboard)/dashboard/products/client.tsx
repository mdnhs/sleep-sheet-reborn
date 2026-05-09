/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowUpDown, MoreVertical, Plus } from "lucide-react";
import { useGetProducts } from "@/features/product/api/use-get-products";
import { useDeleteProduct } from "@/features/dashboard/api/use-delete-product";
import { useCurrency } from "@/hooks/use-currency";
import Link from "next/link";
import { Pagination, PaginationContent } from "@/components/ui/pagination";

export type ProductColumn = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  isFeatured: boolean;
  createdAt: string;
  images: string[];
};

export default function ProductsClientPage() {
  const { formatAmount } = useCurrency();
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();
  const [productToDelete, setProductToDelete] = useState<ProductColumn | null>(null);

  const columns: ColumnDef<ProductColumn>[] = [
    {
      accessorKey: "images",
      header: "Image",
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
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => formatAmount(parseFloat(row.getValue("price"))),
    },
    {
      accessorKey: "stock",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "isFeatured",
      header: "Featured",
      cell: ({ row }) => (row.getValue("isFeatured") ? "Yes" : "No"),
    },
    {
      accessorKey: "createdAt",
      header: "Date Added",
      cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" className="h-8 w-8 p-0" />}
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
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
        );
      },
    },
  ];
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 8,
  });

  const { data: products, isLoading } = useGetProducts({
    page: (pagination.pageIndex + 1).toString(),
    search: debouncedSearch,
    sort: "newest",
    // sort: sorting[0]?.id
    //   ? `${sorting[0].id}-${sorting[0].desc ? "desc" : "asc"}`
    //   : undefined,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const table = useReactTable({
    data: products?.data || [],
    columns,
    pageCount: products?.totalPages || -1,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  if (isLoading) return <div className="p-4">Loading products...</div>;

  return (
    <div className=" container mx-auto space-y-4 py-4 px-4">
      <h1 className="text-2xl font-bold">Products</h1>

      <div className="flex items-center justify-between py-4 gap-4">
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={handleSearch}
          className="max-w-sm"
        />

        <Button
          nativeButton={false}
          render={<Link href="/dashboard/products/create" />}
        >
          <Plus />
          Add New
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination className=" flex justify-end">
        <PaginationContent>
          <Button
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="mx-4">
            Page {pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </PaginationContent>
      </Pagination>

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
                  deleteProduct(productToDelete.id, { onSuccess: () => setProductToDelete(null) });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
