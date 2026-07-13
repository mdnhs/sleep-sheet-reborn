"use client";

import { useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, Users, ShoppingBag, UserPlus } from "lucide-react";
import { format, startOfMonth } from "date-fns";

import { useGetCustomers } from "@/features/users/api/use-get-customers";
import { useCurrency } from "@/hooks/use-currency";

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export function CustomersClient() {
  const { data: customers, isLoading } = useGetCustomers();
  const { formatAmount } = useCurrency();

  const [searchQuery, setSearchQuery] = useState("");

  const safeCustomers = useMemo(
    () => (customers ?? []) as CustomerRow[],
    [customers]
  );

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return safeCustomers;
    const q = searchQuery.toLowerCase();
    return safeCustomers.filter(
      (cust) =>
        cust.name.toLowerCase().includes(q) ||
        cust.email.toLowerCase().includes(q) ||
        (cust.phone ?? "").toLowerCase().includes(q)
    );
  }, [safeCustomers, searchQuery]);

  const stats = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    return {
      total: safeCustomers.length,
      buyers: safeCustomers.filter((cust) => cust.orderCount > 0).length,
      newThisMonth: safeCustomers.filter(
        (cust) => new Date(cust.createdAt) >= monthStart
      ).length,
    };
  }, [safeCustomers]);

  const columns: ColumnDef<CustomerRow>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone || <span className="text-muted-foreground">-</span>,
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => format(new Date(row.original.createdAt), "MMM d, yyyy"),
    },
    {
      accessorKey: "orderCount",
      header: "Orders",
      cell: ({ row }) =>
        row.original.orderCount > 0 ? (
          <Badge variant="secondary">{row.original.orderCount}</Badge>
        ) : (
          <span className="text-muted-foreground">0</span>
        ),
    },
    {
      accessorKey: "totalSpent",
      header: "Total Spent",
      cell: ({ row }) => (
        <span className="font-medium">{formatAmount(row.original.totalSpent)}</span>
      ),
    },
    {
      accessorKey: "lastOrderAt",
      header: "Last Order",
      cell: ({ row }) =>
        row.original.lastOrderAt ? (
          format(new Date(row.original.lastOrderAt), "MMM d, yyyy")
        ) : (
          <span className="text-muted-foreground">Never</span>
        ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4 md:pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
        <p className="text-muted-foreground">
          Shoppers who registered on your storefront
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Made a Purchase</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.buyers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? `${((stats.buyers / stats.total) * 100).toFixed(0)}% of customers` : "No customers yet"}
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisMonth.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-2 py-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <DataTable columns={columns} data={filteredCustomers} />
    </div>
  );
}
