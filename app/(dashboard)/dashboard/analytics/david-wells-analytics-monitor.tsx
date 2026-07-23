"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/features/settings/api/use-settings";
import {
  initAnalytics,
  trackPageView,
  trackEvent,
  trackIdentify,
  getAnalyticsInstance,
  getAnalyticsState,
  getAnalyticsUser,
} from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  CheckCircle2,
  Play,
  UserCheck,
  Radio,
  FileCode,
  Zap,
  Terminal,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";

interface CapturedLog {
  id: string;
  type: string;
  eventName: string;
  timestamp: string;
  payload: any;
}

export function DavidWellsAnalyticsMonitor() {
  const { data: settings } = useSettings();
  const gaId = settings?.google_analytics_id || process.env.NEXT_PUBLIC_GA_ID || "G-Y62ZKHQGLV";

  const [logs, setLogs] = useState<CapturedLog[]>([]);
  const [customEventName, setCustomEventName] = useState("button_click");
  const [customPayload, setCustomPayload] = useState('{\n  "category": "demo",\n  "value": 100\n}');
  const [userId, setUserId] = useState("user_demo_101");
  const [userTraits, setUserTraits] = useState('{\n  "plan": "pro",\n  "role": "admin"\n}');
  
  const [currentState, setCurrentState] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Initialize analytics instance on mount
  useEffect(() => {
    if (!gaId || typeof window === "undefined") return;

    const instance = initAnalytics(gaId);
    if (!instance) return;

    // Listen to all events passing through DavidWells analytics core engine
    const unsubscribe = instance.on("*", ({ type, payload }: any) => {
      if (type && !type.startsWith("ready")) {
        const newLog: CapturedLog = {
          id: Math.random().toString(36).substring(7),
          type: type || "event",
          eventName: payload?.name || payload?.path || type,
          timestamp: new Date().toLocaleTimeString(),
          payload: payload || {},
        };

        setLogs((prev) => [newLog, ...prev].slice(0, 50));
      }
    });

    // Update state snapshot
    refreshInspectors();

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [gaId]);

  const refreshInspectors = () => {
    setCurrentState(getAnalyticsState());
    setCurrentUser(getAnalyticsUser());
  };

  // Pre-set Event Triggers
  const handleTriggerPage = (path: string) => {
    trackPageView(path, gaId);
    toast.success(`analytics.page('${path}') dispatched!`);
    refreshInspectors();
  };

  const handleTriggerTrack = (name: string, payloadObj: Record<string, any>) => {
    trackEvent(name, payloadObj);
    toast.success(`analytics.track('${name}') dispatched!`);
    refreshInspectors();
  };

  const handleTriggerCustomTrack = () => {
    if (!customEventName.trim()) {
      toast.error("Event name is required");
      return;
    }
    try {
      const parsed = customPayload ? JSON.parse(customPayload) : {};
      trackEvent(customEventName.trim(), parsed);
      toast.success(`Custom event '${customEventName}' dispatched!`);
      refreshInspectors();
    } catch {
      toast.error("Invalid JSON payload");
    }
  };

  const handleTriggerIdentify = () => {
    if (!userId.trim()) {
      toast.error("User ID is required");
      return;
    }
    try {
      const traits = userTraits ? JSON.parse(userTraits) : {};
      trackIdentify(userId.trim(), traits);
      toast.success(`analytics.identify('${userId}') dispatched!`);
      refreshInspectors();
    } catch {
      toast.error("Invalid traits JSON");
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    toast.info("Log stream cleared");
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-emerald-500 animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight">David Wells Analytics Engine & Live Monitor</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time event stream, plugin diagnostics, state inspection & live testing playground for David Wells <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">analytics</code> package.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-none rounded-full px-3 py-1 font-semibold text-xs flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            analytics v0.8.19 Active
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1 font-mono text-xs">
            Plugin: @analytics/google-analytics ({gaId ? gaId : "Not Set"})
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="playground" className="w-full space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl flex flex-wrap h-auto gap-1 border-none">
          <TabsTrigger value="playground" className="rounded-xl gap-2 text-xs font-semibold py-2 px-4 cursor-pointer">
            <Zap className="h-4 w-4 text-amber-500" />
            Live Event Dispatcher / Playground
          </TabsTrigger>
          <TabsTrigger value="stream" className="rounded-xl gap-2 text-xs font-semibold py-2 px-4 cursor-pointer">
            <Terminal className="h-4 w-4 text-indigo-500" />
            Real-time Stream ({logs.length})
          </TabsTrigger>
          <TabsTrigger value="state" className="rounded-xl gap-2 text-xs font-semibold py-2 px-4 cursor-pointer">
            <FileCode className="h-4 w-4 text-purple-500" />
            State & User Traits Inspector
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Live Event Dispatcher / Playground */}
        <TabsContent value="playground" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quick Actions */}
            <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-none bg-slate-50/50 dark:bg-muted/20">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Play className="h-4 w-4 text-blue-500" />
                  Pre-set Test Actions
                </CardTitle>
                <CardDescription className="text-xs">Dispatch standard events</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTriggerPage("/shop")}
                  className="w-full justify-start text-xs font-semibold rounded-xl bg-white dark:bg-card"
                >
                  <Activity className="h-3.5 w-3.5 mr-2 text-blue-500" />
                  analytics.page('/shop')
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTriggerTrack("add_to_cart", { product_id: "prod_comforter_01", price: 2500 })}
                  className="w-full justify-start text-xs font-semibold rounded-xl bg-white dark:bg-card"
                >
                  <Zap className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                  analytics.track('add_to_cart')
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTriggerTrack("checkout_start", { total_amount: 3200, items_count: 2 })}
                  className="w-full justify-start text-xs font-semibold rounded-xl bg-white dark:bg-card"
                >
                  <Zap className="h-3.5 w-3.5 mr-2 text-amber-500" />
                  analytics.track('checkout_start')
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTriggerTrack("purchase_complete", { order_id: "ORD-9988", total: 4500 })}
                  className="w-full justify-start text-xs font-semibold rounded-xl bg-white dark:bg-card"
                >
                  <Zap className="h-3.5 w-3.5 mr-2 text-rose-500" />
                  analytics.track('purchase_complete')
                </Button>
              </CardContent>
            </Card>

            {/* Custom Track Event */}
            <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-none bg-slate-50/50 dark:bg-muted/20">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-purple-500" />
                  Custom Track Event
                </CardTitle>
                <CardDescription className="text-xs">analytics.track(name, payload)</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Event Name</label>
                  <Input
                    value={customEventName}
                    onChange={(e) => setCustomEventName(e.target.value)}
                    placeholder="e.g. search_query"
                    className="h-8 text-xs font-mono rounded-xl bg-white dark:bg-card"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">JSON Payload</label>
                  <textarea
                    value={customPayload}
                    onChange={(e) => setCustomPayload(e.target.value)}
                    rows={3}
                    className="w-full text-xs font-mono rounded-xl bg-white dark:bg-card border border-input p-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleTriggerCustomTrack}
                  className="w-full text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                >
                  Dispatch Custom Event
                </Button>
              </CardContent>
            </Card>

            {/* Identify User */}
            <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-none bg-slate-50/50 dark:bg-muted/20">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-indigo-500" />
                  Identify User
                </CardTitle>
                <CardDescription className="text-xs">analytics.identify(id, traits)</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">User ID</label>
                  <Input
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="e.g. usr_123"
                    className="h-8 text-xs font-mono rounded-xl bg-white dark:bg-card"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Traits (JSON)</label>
                  <textarea
                    value={userTraits}
                    onChange={(e) => setUserTraits(e.target.value)}
                    rows={3}
                    className="w-full text-xs font-mono rounded-xl bg-white dark:bg-card border border-input p-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleTriggerIdentify}
                  className="w-full text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                  Set User Traits
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Real-time Stream */}
        <TabsContent value="stream" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Terminal className="h-4 w-4 text-indigo-500" />
              Live Events Captured by analytics.on('*')
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearLogs}
                className="h-8 text-xs rounded-full cursor-pointer"
              >
                Clear Console
              </Button>
            </div>
          </div>

          {logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground border border-dashed rounded-2xl">
              No live events captured in this session yet. Use the Live Event Dispatcher to trigger events!
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-950 text-slate-100 p-4 font-mono text-xs max-h-[400px] overflow-auto space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-2">
                      <span className="text-slate-400">[{log.timestamp}]</span>
                      <Badge className="bg-indigo-600 text-white border-none text-[10px] px-1.5 py-0">
                        {log.type}
                      </Badge>
                      <span className="font-bold text-amber-400">{log.eventName}</span>
                    </span>
                  </div>
                  <pre className="text-[11px] text-slate-300 overflow-x-auto p-1 bg-slate-950/60 rounded">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: State & User Traits Inspector */}
        <TabsContent value="state" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <FileCode className="h-4 w-4 text-purple-500" />
              analytics.getState() & analytics.user() Inspector
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshInspectors}
              className="h-8 text-xs rounded-full cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh State
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-muted/30 space-y-2">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-indigo-500" />
                analytics.user() Output:
              </h4>
              <pre className="p-3 bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto text-[11px]">
                {currentUser ? JSON.stringify(currentUser, null, 2) : "// No user traits initialized"}
              </pre>
            </div>

            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-muted/30 space-y-2">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileCode className="h-4 w-4 text-purple-500" />
                analytics.getState() Plugins & Queue:
              </h4>
              <pre className="p-3 bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto text-[11px] max-h-[300px]">
                {currentState ? JSON.stringify(currentState, null, 2) : "// State loading..."}
              </pre>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
