"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMovements } from "@/features/inventory/api/use-inventory-queries";

const TYPE_LABELS: Record<string, string> = {
  STOCK_IN: "Stock In",
  STOCK_OUT: "Stock Out",
  ADJUSTMENT: "Adjustment",
  DAMAGE: "Damage",
  LOSS: "Loss",
  RETURN: "Return",
};

export function MovementsTable() {
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useMovements({
    type: type === "all" ? undefined : type,
    page,
  });
  const rows = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <Select
        value={type}
        onValueChange={(v) => {
          setType(v ?? "all");
          setPage(1);
        }}
      >
        <SelectTrigger className="sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Reason / Ref</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No movements yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {format(new Date(m.createdAt), "dd MMM yyyy, HH:mm")}
                  </TableCell>
                  <TableCell className="font-medium">{m.productName}</TableCell>
                  <TableCell>
                    <Badge variant={m.quantity >= 0 ? "secondary" : "destructive"}>
                      {TYPE_LABELS[m.type] ?? m.type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums font-medium ${
                      m.quantity >= 0 ? "text-emerald-600" : "text-destructive"
                    }`}
                  >
                    {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.reason || m.reference || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
