"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, ArrowDown, Eye, ShoppingCart, CreditCard, CheckCircle2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface FunnelStep {
  step: number;
  name: string;
  count: number;
  percentage: number;
}

interface AnalyticsFunnelCardProps {
  funnelData: FunnelStep[];
  loading?: boolean;
}

const STEP_ICONS: Record<number, React.ReactNode> = {
  1: <Users className="h-4 w-4 text-blue-500" />,
  2: <Eye className="h-4 w-4 text-purple-500" />,
  3: <ShoppingCart className="h-4 w-4 text-amber-500" />,
  4: <CreditCard className="h-4 w-4 text-indigo-500" />,
  5: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
};

const STEP_COLORS: Record<number, string> = {
  1: "bg-blue-500",
  2: "bg-purple-500",
  3: "bg-amber-500",
  4: "bg-indigo-500",
  5: "bg-emerald-500",
};

export function AnalyticsFunnelCard({ funnelData, loading }: AnalyticsFunnelCardProps) {
  if (loading) {
    return <Skeleton className="h-72 w-full rounded-3xl" />;
  }

  const firstStepCount = funnelData[0]?.count || 1;
  const overallConversion = funnelData[funnelData.length - 1]?.count
    ? Math.round((funnelData[funnelData.length - 1].count / firstStepCount) * 100)
    : 0;

  return (
    <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Filter className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            E-Commerce Conversion Funnel
          </h2>
          <p className="text-xs text-muted-foreground">
            Customer buying journey from initial site visit to final order completion
          </p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-none rounded-full px-3 py-1 text-xs font-bold">
          Overall Conversion: {overallConversion}%
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
        {funnelData.map((stepItem, idx) => {
          const stepPercentOfFirst = Math.round((stepItem.count / firstStepCount) * 100) || 0;
          const dropOffPercent = idx > 0 ? 100 - stepItem.percentage : 0;

          return (
            <div key={stepItem.step} className="relative group">
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-muted/20 p-4 space-y-3 transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-white dark:bg-card border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs font-bold shadow-xs">
                    {STEP_ICONS[stepItem.step]}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono font-bold rounded-full">
                    Step {stepItem.step}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-foreground truncate">{stepItem.name}</h3>
                  <p className="text-2xl font-bold tracking-tight mt-1 font-mono">
                    {stepItem.count.toLocaleString()}
                  </p>
                </div>

                {/* Step Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                    <span>Reach</span>
                    <span>{stepPercentOfFirst}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", STEP_COLORS[stepItem.step])}
                      style={{ width: `${Math.max(stepPercentOfFirst, 6)}%` }}
                    />
                  </div>
                </div>

                {/* Drop-off tag */}
                {idx > 0 && (
                  <div className="pt-1 text-[10px] font-medium text-rose-500 flex items-center gap-1">
                    <ArrowDown className="h-3 w-3" />
                    <span>{dropOffPercent}% drop-off</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
