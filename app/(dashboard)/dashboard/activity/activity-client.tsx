"use client";

import { useState } from "react";
import type { ColumnDef, PaginationState, Updater } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, History, Loader2, Search } from "lucide-react";
import { format } from "date-fns";
import { useActivityLogs } from "@/features/activity/api/use-activity-logs";

interface ActivityLogRow {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  action: string;
  method: string;
  path: string;
  status: number;
  ip: string;
  createdAt: string;
}

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400 border-slate-200/40",
  POST: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200/40",
  PUT: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200/40",
  PATCH: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200/40",
  DELETE: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200/40",
};

const columns: ColumnDef<ActivityLogRow>[] = [
  {
    accessorKey: "createdAt",
    header: "Date & Time",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        <div className="font-medium">{format(new Date(row.original.createdAt), "MMM d, yyyy")}</div>
        <div className="text-xs text-muted-foreground">{format(new Date(row.original.createdAt), "h:mm:ss a")}</div>
      </div>
    ),
  },
  {
    accessorKey: "userName",
    header: "User",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.userName}</div>
        <div className="text-xs text-muted-foreground">{row.original.userEmail}</div>
      </div>
    ),
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const isError = row.original.status >= 400;
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={METHOD_STYLES[row.original.method] ?? ""}>
            {row.original.method}
          </Badge>
          <span className={isError ? "text-red-600 dark:text-red-400" : ""}>{row.original.action}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "path",
    header: "Endpoint",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground max-w-55 truncate inline-block align-middle">
        {row.original.path}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const ok = row.original.status >= 200 && row.original.status < 400;
      return (
        <Badge
          variant="outline"
          className={
            ok
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200/40"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200/40"
          }
        >
          {row.original.status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "ip",
    header: "IP Address",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.ip}</span>,
  },
];

export function ActivityClient() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ERROR">("ALL");
  const [selectedLog, setSelectedLog] = useState<ActivityLogRow | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const { data, isLoading } = useActivityLogs({
    page: String(pagination.pageIndex + 1),
    limit: String(pagination.pageSize),
    search: search || undefined,
    status: statusFilter === "ERROR" ? "error" : undefined,
  });

  const logs = (data && "data" in data ? data.data : []) as ActivityLogRow[];
  const totalPages = data && "totalPages" in data ? data.totalPages : 0;
  const total = data && "total" in data ? data.total : 0;
  const errorTotal = data && "errorTotal" in data ? data.errorTotal : 0;

  const handlePaginationChange = (updater: Updater<PaginationState>) => {
    setPagination((old) => (typeof updater === "function" ? updater(old) : updater));
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Audit trail of dashboard user actions and system events
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2">
        <div className="rounded-3xl bg-white dark:bg-card p-4 sm:p-6 border-none shadow-none flex flex-col justify-between min-h-[120px] sm:min-h-[136px]">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
              Total Events
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 shrink-0">
              <History className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-2.5 mb-1">
            <p className="text-base sm:text-2xl lg:text-3xl font-extrabold tracking-tight">{total.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-3xl bg-white dark:bg-card p-4 sm:p-6 border-none shadow-none flex flex-col justify-between min-h-[120px] sm:min-h-[136px]">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
              System Errors
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-red-50 dark:bg-red-950/40 shrink-0">
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-2.5 mb-1">
            <p className="text-base sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-red-600 dark:text-red-400">{errorTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-card p-4 sm:p-6 border-none shadow-none space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Tabs
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as "ALL" | "ERROR");
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            className="w-fit"
          >
            <TabsList className="flex flex-nowrap items-center h-9 w-max sm:w-fit gap-1 bg-slate-100 dark:bg-muted/40 p-1 rounded-full">
              <TabsTrigger
                value="ALL"
                className="shrink-0 rounded-full px-3.5 h-7 text-xs font-semibold cursor-pointer transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                All Events
              </TabsTrigger>
              <TabsTrigger
                value="ERROR"
                className="shrink-0 rounded-full px-3.5 h-7 text-xs font-semibold cursor-pointer transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                Errors ({errorTotal})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search user, action, IP..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              className="pl-9 w-full rounded-full bg-slate-50 dark:bg-muted/40 border-none shadow-none text-xs font-semibold"
            />
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : (
          <DataTable
            columns={columns}
            data={logs}
            manualPagination
            pageCount={totalPages}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            onRowClick={(row) => setSelectedLog(row)}
          />
        )}
      </div>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedLog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Activity Details
                  {selectedLog.status >= 400 && (
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200/40"
                    >
                      Error
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Action</div>
                  <div className={selectedLog.status >= 400 ? "text-red-600 dark:text-red-400 font-medium" : "font-medium"}>
                    {selectedLog.action}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Date & Time</div>
                    <div>{format(new Date(selectedLog.createdAt), "MMM d, yyyy 'at' h:mm:ss a")}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">IP Address</div>
                    <div className="font-mono">{selectedLog.ip}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">User</div>
                    <div className="font-medium">{selectedLog.userName}</div>
                    <div className="text-muted-foreground text-xs">{selectedLog.userEmail}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Status</div>
                    <Badge
                      variant="outline"
                      className={
                        selectedLog.status < 400
                          ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200/40"
                          : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200/40"
                      }
                    >
                      {selectedLog.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Request</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={METHOD_STYLES[selectedLog.method] ?? ""}>
                      {selectedLog.method}
                    </Badge>
                    <span className="font-mono text-xs break-all">{selectedLog.path}</span>
                  </div>
                </div>

                {selectedLog.userId && (
                  <div>
                    <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">User ID</div>
                    <div className="font-mono text-xs">{selectedLog.userId}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
