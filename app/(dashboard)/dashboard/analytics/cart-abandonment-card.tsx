"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, AlertTriangle, CheckCircle2, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CartAbandonmentCardProps {
  cartAbandonment?: {
    addToCarts: number;
    orderCompletes: number;
    abandonedCarts: number;
    abandonmentRate: number;
  };
  loading?: boolean;
}

export function CartAbandonmentCard({ cartAbandonment, loading }: CartAbandonmentCardProps) {
  if (loading) {
    return <Skeleton className="h-64 w-full rounded-3xl" />;
  }

  const addToCarts = cartAbandonment?.addToCarts || 0;
  const orderCompletes = cartAbandonment?.orderCompletes || 0;
  const abandonedCarts = cartAbandonment?.abandonedCarts || 0;
  const abandonmentRate = cartAbandonment?.abandonmentRate || 0;

  return (
    <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-rose-500" />
            Cart Abandonment Analytics
          </h2>
          <p className="text-xs text-muted-foreground">
            Analysis of customers who added products to cart vs completed order
          </p>
        </div>
        <Badge
          className={cn(
            "rounded-full text-xs font-bold border-none px-3 py-1",
            abandonmentRate > 70
              ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          )}
        >
          Abandonment Rate: {abandonmentRate}%
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {/* Total Added to Cart */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-muted/20 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Added to Cart</span>
            <ShoppingBag className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{addToCarts.toLocaleString()}</p>
          <span className="text-[10px] text-muted-foreground block">Items added by visitors</span>
        </div>

        {/* Completed Orders */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-muted/20 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Orders Placed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{orderCompletes.toLocaleString()}</p>
          <span className="text-[10px] text-muted-foreground block">Successfully checkout converted</span>
        </div>

        {/* Abandoned Carts */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 bg-rose-50/40 dark:bg-rose-950/20 space-y-1">
          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-semibold">
            <span>Abandoned Carts</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {abandonedCarts.toLocaleString()}
          </p>
          <span className="text-[10px] text-rose-500/80 block">{abandonmentRate}% did not finish order</span>
        </div>
      </div>
    </div>
  );
}
