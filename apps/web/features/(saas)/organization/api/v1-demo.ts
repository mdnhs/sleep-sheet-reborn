"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type ApiOk<T> = { success: true; data: T }
export type DemoDataset = { id: string; name: string; businessType: string | null; description: string | null }
export type DemoImport = { id: string; datasetName: string | null; status: 'COMPLETED' | 'CLEARED'; categoryCount: number; productCount: number; createdAt: string }

async function get<T>(url: string, fallback: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(fallback)
  return (await res.json() as ApiOk<T>).data
}
async function send<T>(url: string, method: string, body: unknown, fallback: string): Promise<T> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) { const e = await res.json().catch(() => ({})) as { message?: string }; throw new Error(e.message ?? fallback) }
  return (await res.json() as ApiOk<T>).data
}
const BASE = "/api/v1/demo"
const keys = { datasets: ["v1", "demo", "datasets"], imports: ["v1", "demo", "imports"] }

export function useDemoDatasets() {
  return useQuery<DemoDataset[]>({ queryKey: keys.datasets, queryFn: () => get(`${BASE}/datasets`, "Failed to load datasets") })
}
export function useDemoImports() {
  return useQuery<DemoImport[]>({ queryKey: keys.imports, queryFn: () => get(`${BASE}/imports`, "Failed to load imports") })
}
export function useImportDataset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (datasetId: string) => send(`${BASE}/import`, "POST", { datasetId }, "Failed to import"),
    onSuccess: () => { toast.success("Demo data imported"); qc.invalidateQueries({ queryKey: keys.imports }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useClearImport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => send(`${BASE}/imports/${id}/clear`, "POST", null, "Failed to clear"),
    onSuccess: () => { toast.success("Demo data cleared"); qc.invalidateQueries({ queryKey: keys.imports }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
