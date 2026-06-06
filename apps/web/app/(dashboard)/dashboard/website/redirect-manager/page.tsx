"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Signpost } from "lucide-react"
import { useRedirects, useCreateRedirect, useDeleteRedirect } from "@/features/(storefront)/storefront/api/v1-storefront"

export default function RedirectManagerPage() {
  const { data: redirects = [], isLoading } = useRedirects()
  const create = useCreateRedirect()
  const del = useDeleteRedirect()
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [type, setType] = useState<"301" | "302">("301")

  return (
    <PageShell>
      <PageHeader title="Redirect Manager" description="301 / 302 redirects for changed or retired URLs." />

      <div className="flex flex-wrap items-end gap-2 rounded-xl border p-4">
        <div className="flex-1 min-w-40"><Input placeholder="/old-path" value={from} onChange={e => setFrom(e.target.value)} /></div>
        <div className="flex-1 min-w-40"><Input placeholder="/new-path" value={to} onChange={e => setTo(e.target.value)} /></div>
        <Select value={type} onValueChange={(v) => setType((v ?? "301") as "301" | "302")}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="301">301</SelectItem><SelectItem value="302">302</SelectItem></SelectContent>
        </Select>
        <Button disabled={create.isPending || !from || !to}
          onClick={() => create.mutate({ fromPath: from, toPath: to, type }, { onSuccess: () => { setFrom(""); setTo("") } })}>Add Redirect</Button>
      </div>

      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : !redirects.length ? (
        <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed">
          <div className="text-center space-y-2"><Signpost className="w-8 h-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">No redirects yet.</p></div>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader><TableRow><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {redirects.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm">{r.fromPath}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{r.toPath}</TableCell>
                  <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                  <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  )
}
