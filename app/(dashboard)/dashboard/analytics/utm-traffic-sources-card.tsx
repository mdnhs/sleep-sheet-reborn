"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Share2, Compass, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface UtmTrafficSourcesCardProps {
  topSources: [string, number][];
  loading?: boolean;
}

const SOURCE_COLORS: Record<string, string> = {
  Facebook: "bg-blue-500",
  "Google Search": "bg-emerald-500",
  Instagram: "bg-pink-500",
  TikTok: "bg-slate-900 dark:bg-slate-100",
  "Direct / Organic": "bg-indigo-500",
  Referral: "bg-purple-500",
};

export function UtmTrafficSourcesCard({ topSources, loading }: UtmTrafficSourcesCardProps) {
  if (loading) {
    return <Skeleton className="h-64 w-full rounded-3xl" />;
  }

  const totalHits = topSources.reduce((acc, [_, count]) => acc + count, 0) || 1;

  return (
    <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Traffic Channels & Marketing Sources
          </h2>
          <p className="text-xs text-muted-foreground">
            Acquisition sources breakdown via UTM parameters & referrer URLs
          </p>
        </div>
        <Badge variant="outline" className="rounded-full text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-muted/40">
          {topSources.length} Channels Detected
        </Badge>
      </div>

      {topSources.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-8">No traffic sources detected</div>
      ) : (
        <div className="space-y-4 pt-1">
          {topSources.map(([sourceName, count]) => {
            const percentage = Math.round((count / totalHits) * 100) || 0;
            const barColor = SOURCE_COLORS[sourceName] || "bg-indigo-500";

            return (
              <div key={sourceName} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2 text-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                    {sourceName}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {count} visits ({percentage}%)
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", barColor)}
                    style={{ width: `${Math.max(percentage, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
