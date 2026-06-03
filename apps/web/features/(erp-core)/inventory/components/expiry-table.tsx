"use client";

import { useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useExpiring } from "@/features/(erp-core)/inventory/api/use-inventory-queries";

const WINDOWS = [
  { value: "7", label: "Next 7 days" },
  { value: "30", label: "Next 30 days" },
  { value: "90", label: "Next 90 days" },
];

export function ExpiryTable() {
  const [days, setDays] = useState("30");
  const { data, isLoading } = useExpiring(Number(days));
  const rows = data?.data ?? [];

  return (
    <div className="space-y-4">
      <Select value={days} onValueChange={(v) => setDays(v ?? "30")}>
        <SelectTrigger className="sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WINDOWS.map((w) => (
            <SelectItem key={w.value} value={w.value}>
              {w.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Status</TableHead>
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
                  No batches expiring in this window.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((b) => {
                const left = b.expiryDate
                  ? differenceInCalendarDays(new Date(b.expiryDate), new Date())
                  : null;
                const expired = left !== null && left < 0;
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.productName}</TableCell>
                    <TableCell className="text-muted-foreground">{b.batchNumber || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{b.quantity}</TableCell>
                    <TableCell>
                      {b.expiryDate ? format(new Date(b.expiryDate), "dd MMM yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={expired ? "destructive" : "outline"}>
                        {expired ? "Expired" : left !== null ? `${left}d left` : "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
