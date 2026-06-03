import { Badge } from "@/components/ui/badge";
import type { StockStatus } from "@/features/inventory/api/use-inventory-queries";

const MAP: Record<StockStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  OK: { label: "In stock", variant: "secondary" },
  LOW: { label: "Low", variant: "outline" },
  OUT: { label: "Out", variant: "destructive" },
};

export function StatusBadge({ status }: { status: StockStatus }) {
  const { label, variant } = MAP[status];
  return (
    <Badge variant={variant} className={status === "LOW" ? "border-amber-500 text-amber-600" : ""}>
      {label}
    </Badge>
  );
}
