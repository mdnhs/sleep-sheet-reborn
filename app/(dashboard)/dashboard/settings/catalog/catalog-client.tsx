"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Database, Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type FeedFormat = "xml" | "csv" | "json";

const FORMATS: FeedFormat[] = ["xml", "csv", "json"];
const LABELS: Record<FeedFormat, string> = { xml: "XML", csv: "CSV", json: "JSON" };
const EXT: Record<FeedFormat, string> = { xml: ".xml", csv: ".csv", json: ".json" };

const PREVIEW_LINES = 50;

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CatalogSettings() {
  const [baseUrl, setBaseUrl] = useState("");
  const [copied, setCopied] = useState<FeedFormat | null>(null);
  const [previewTab, setPreviewTab] = useState<FeedFormat>("xml");
  const [preview, setPreview] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewMeta, setPreviewMeta] = useState<{
    format: FeedFormat;
    totalLines: number;
    byteSize: number;
  } | null>(null);

  useEffect(() => {
    setBaseUrl(getBaseUrl());
  }, []);

  const feedUrl = (format: FeedFormat) => `${baseUrl}/facebook-feed${EXT[format]}`;

  const handleCopy = useCallback(async (format: FeedFormat) => {
    try {
      await navigator.clipboard.writeText(feedUrl(format));
      setCopied(format);
      toast.success(`Feed URL copied`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [baseUrl]);

  const handlePreview = useCallback(async (format: FeedFormat) => {
    setPreviewLoading(true);
    setPreview(null);
    setPreviewMeta(null);

    try {
      const resp = await fetch(feedUrl(format));
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const text = await resp.text();
      const lines = text.split("\n");
      const truncated = lines.slice(0, PREVIEW_LINES).join("\n");

      setPreview(truncated);
      setPreviewMeta({
        format,
        totalLines: lines.length,
        byteSize: text.length,
      });
    } catch (err) {
      toast.error(`Failed to load feed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setPreview("Failed to load feed preview.");
    } finally {
      setPreviewLoading(false);
    }
  }, [baseUrl]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Meta Catalog</h1>
          <p className="text-sm text-muted-foreground">
            Product feed for Facebook / Meta Commerce Catalog
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Feed URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {FORMATS.map((format) => (
              <div
                key={format}
                className="flex items-center gap-3 rounded-lg border px-4 py-3"
              >
                <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                  {LABELS[format]}
                </Badge>
                <code className="flex-1 text-sm truncate font-mono text-muted-foreground">
                  {baseUrl ? feedUrl(format) : "Loading..."}
                </code>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleCopy(format)}
                  className="shrink-0"
                >
                  {copied === format ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Preview</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreview(previewTab)}
                disabled={previewLoading || !baseUrl}
                className="gap-2"
              >
                {previewLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {previewLoading ? "Loading..." : "Load Preview"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={previewTab}
              onValueChange={(v) => {
                setPreviewTab(v as FeedFormat);
                setPreview(null);
                setPreviewMeta(null);
              }}
            >
              <TabsList className="mb-4">
                {FORMATS.map((f) => (
                  <TabsTrigger key={f} value={f}>
                    {LABELS[f]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {FORMATS.map((format) => (
                <TabsContent key={format} value={format}>
                  {!preview ? (
                    previewLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
                        Click &quot;Load Preview&quot; to fetch the {LABELS[format]} feed
                      </div>
                    )
                  ) : previewMeta && previewMeta.format === format ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          <strong className="font-medium text-foreground">
                            {previewMeta.totalLines.toLocaleString()}
                          </strong>{" "}
                          {previewMeta.totalLines === 1 ? "line" : "lines"}
                        </span>
                        <span>
                          <strong className="font-medium text-foreground">
                            {formatSize(previewMeta.byteSize)}
                          </strong>{" "}
                          total
                        </span>
                        {previewMeta.totalLines > PREVIEW_LINES && (
                          <Badge variant="outline" className="text-xs">
                            Showing first {PREVIEW_LINES} lines
                          </Badge>
                        )}
                      </div>
                      <pre className="max-h-96 overflow-auto rounded-lg border bg-muted p-4 text-xs font-mono leading-relaxed">
                        {preview}
                        {previewMeta.totalLines > PREVIEW_LINES && (
                          <span className="block text-muted-foreground italic pt-2 border-t mt-2">
                            ... {previewMeta.totalLines - PREVIEW_LINES} more lines
                          </span>
                        )}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
                      Switch tab and load preview
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
