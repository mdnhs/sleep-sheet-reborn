"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio, Users, Eye, Monitor, Smartphone, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";

interface RealtimeActiveUsersCardProps {
  realtimeData?: {
    activeUsersCount: number;
    totalEvents: number;
    activePages: [string, number][];
    activeDevices: Record<string, number>;
  };
  loading?: boolean;
}

export function RealtimeActiveUsersCard({ realtimeData, loading }: RealtimeActiveUsersCardProps) {
  if (loading) {
    return <Skeleton className="h-64 w-full rounded-3xl" />;
  }

  const activeUsersCount = realtimeData?.activeUsersCount || 0;
  const activePages = realtimeData?.activePages || [];
  const activeDevices = realtimeData?.activeDevices || {};

  return (
    <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-6 border-none shadow-xl space-y-6 relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between border-b border-indigo-800/50 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <Radio className="h-5 w-5 text-emerald-400 animate-pulse" />
            <span className="absolute w-3 h-3 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white">GA4 Real-Time Active Users</h2>
            <p className="text-xs text-indigo-200/80">Active visitors across site in the last 30 minutes</p>
          </div>
        </div>

        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full px-3 py-1 text-xs font-semibold">
          LIVE
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Main Active Count */}
        <div className="lg:col-span-4 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-2">
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
            Users in last 30 min
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-extrabold tracking-tight font-mono text-white">
              {activeUsersCount}
            </span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              active right now
            </span>
          </div>
          <p className="text-[11px] text-indigo-200/70 pt-1">
            {realtimeData?.totalEvents || 0} total events captured recently
          </p>
        </div>

        {/* Active Pages Breakdown */}
        <div className="lg:col-span-8 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-200 border-b border-white/10 pb-2">
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-indigo-400" />
              Top Active Pages Right Now
            </span>
            <span>Views</span>
          </div>

          {activePages.length === 0 ? (
            <p className="text-xs text-indigo-300/60 py-3 text-center">No active page views in the last 30 minutes</p>
          ) : (
            <div className="space-y-2">
              {activePages.map(([path, count]) => (
                <div key={path} className="flex items-center justify-between text-xs font-medium">
                  <span className="truncate max-w-[280px] font-mono text-indigo-100">{path}</span>
                  <Badge variant="outline" className="border-indigo-400/30 text-indigo-300 text-[10px] font-mono rounded-full bg-indigo-950/40">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
