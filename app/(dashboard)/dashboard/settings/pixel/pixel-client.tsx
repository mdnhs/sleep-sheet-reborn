"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, useUpdateSettings } from "@/features/settings/api/use-settings";
import { isValidPixelId } from "@/lib/meta-pixel/pixel-mapping";
import { Loader2, Eye, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const pixelSchema = z.object({
  meta_pixel_enabled: z.enum(["true", "false"]),
  meta_pixel_default_id: z.string().optional(),
  meta_pixel_debug: z.enum(["true", "false"]),
});

type PixelFormValues = z.infer<typeof pixelSchema>;

interface PageMapping {
  page: string;
  pixelId: string;
}

function parseMappings(raw?: string): PageMapping[] {
  if (!raw) return [];
  try {
    const obj = JSON.parse(raw);
    if (typeof obj === "object" && obj !== null) {
      return Object.entries(obj).map(([page, pixelId]) => ({
        page,
        pixelId: String(pixelId),
      }));
    }
  } catch {
    /* ignore */
  }
  return [];
}

function serializeMappings(mappings: PageMapping[]): string {
  const obj: Record<string, string> = {};
  for (const m of mappings) {
    if (m.page.trim()) {
      obj[m.page.trim()] = m.pixelId.trim();
    }
  }
  return JSON.stringify(obj);
}

export function PixelSettings() {
  const { data, isLoading } = useSettings();
  const { mutate, isPending, variables } = useUpdateSettings();

  const [mappings, setMappings] = useState<PageMapping[]>([]);
  const [newPage, setNewPage] = useState("");
  const [newPixelId, setNewPixelId] = useState("");

  const form = useForm<PixelFormValues>({
    resolver: zodResolver(pixelSchema),
    defaultValues: {
      meta_pixel_enabled: "true",
      meta_pixel_default_id: "",
      meta_pixel_debug: "false",
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        meta_pixel_enabled: data.meta_pixel_enabled !== "false" ? "true" : "false",
        meta_pixel_default_id: data.meta_pixel_default_id || "",
        meta_pixel_debug: data.meta_pixel_debug === "true" ? "true" : "false",
      });
      setMappings(parseMappings(data.meta_pixel_mappings));
    }
  }, [data, form]);

  const handleAddMapping = useCallback(() => {
    const page = newPage.trim();
    const pixelId = newPixelId.trim();

    if (!page) {
      toast.error("Page name is required");
      return;
    }
    if (!pixelId) {
      toast.error("Pixel ID is required");
      return;
    }
    if (!isValidPixelId(pixelId)) {
      toast.error("Invalid Pixel ID — must be 15-16 digits");
      return;
    }
    if (mappings.some((m) => m.page === page)) {
      toast.error(`Page "${page}" already has a mapping`);
      return;
    }

    setMappings((prev) => [...prev, { page, pixelId }]);
    setNewPage("");
    setNewPixelId("");
  }, [newPage, newPixelId, mappings]);

  const handleRemoveMapping = useCallback((page: string) => {
    setMappings((prev) => prev.filter((m) => m.page !== page));
  }, []);

  const handleSaveMappings = useCallback(() => {
    const invalid = mappings.filter((m) => !isValidPixelId(m.pixelId));
    if (invalid.length > 0) {
      toast.error(`Invalid Pixel IDs: ${invalid.map((m) => m.page).join(", ")}`);
      return;
    }
    mutate({ meta_pixel_mappings: serializeMappings(mappings) });
  }, [mappings, mutate]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Eye className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Meta Pixel</h1>
          <p className="text-sm text-muted-foreground">
            Track conversions from multiple Facebook Pages with per-pixel attribution
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((values) => mutate(values))}
                  className="space-y-6"
                >
                  <FormField
                    name="meta_pixel_enabled"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3">
                        <div className="flex flex-col">
                          <FormLabel className="text-sm font-semibold">
                            Pixel Tracking
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Enable or disable all Meta Pixel tracking
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value === "true"}
                            onCheckedChange={(checked) =>
                              field.onChange(checked ? "true" : "false")
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="meta_pixel_debug"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3">
                        <div className="flex flex-col">
                          <FormLabel className="text-sm font-semibold">
                            Debug Mode
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Log pixel attribution, events, and errors to browser console
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value === "true"}
                            onCheckedChange={(checked) =>
                              field.onChange(checked ? "true" : "false")
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="meta_pixel_default_id"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">
                          Default Pixel ID
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Fallback pixel when no URL attribution is detected (15-16 digit ID)
                        </FormDescription>
                        <FormControl>
                          <Input
                            placeholder="000000000000000"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isPending} className="gap-2">
                      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save General Settings
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Page Mappings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Map Facebook Page names to Meta Pixel IDs. Visitors from ads with{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">?page=&lt;name&gt;</code>{" "}
              will be attributed to the mapped Pixel.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {mappings.length > 0 && (
              <div className="space-y-2">
                {mappings.map((m) => (
                  <div
                    key={m.page}
                    className="flex items-center gap-3 rounded-lg border px-4 py-3"
                  >
                    <code className="text-sm font-medium min-w-[100px]">{m.page}</code>
                    <span className="text-muted-foreground">&rarr;</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1">
                      {m.pixelId}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveMapping(m.page)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {mappings.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground justify-center">
                <AlertCircle className="h-4 w-4" />
                No page mappings configured. Add one below.
              </div>
            )}

            <div className="flex items-end gap-3 pt-2 border-t">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Page Name</label>
                <Input
                  placeholder="page_a"
                  value={newPage}
                  onChange={(e) => setNewPage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMapping())}
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Pixel ID</label>
                <Input
                  placeholder="000000000000000"
                  value={newPixelId}
                  onChange={(e) => setNewPixelId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMapping())}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddMapping}
                className="gap-1.5 shrink-0"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={handleSaveMappings}
                disabled={isPending}
                className="gap-2"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Mappings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
