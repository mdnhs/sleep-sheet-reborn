"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUp, ArrowDown, Trash2, LayoutTemplate } from "lucide-react"
import {
  useHomepageSections, useAddSection, useUpdateSection, useDeleteSection, type SectionType,
} from "@/features/(storefront)/storefront/api/v1-storefront"

const TYPES: SectionType[] = ["HERO", "CATEGORY_GRID", "FEATURED_PRODUCTS", "FLASH_SALE", "BEST_SELLERS", "TESTIMONIALS", "BLOG_POSTS", "BANNER", "CUSTOM_HTML"]
const label = (t: string) => t.replace(/_/g, " ")

export default function HomepageBuilderPage() {
  const { data: sections = [], isLoading } = useHomepageSections()
  const add = useAddSection()
  const update = useUpdateSection()
  const del = useDeleteSection()
  const [type, setType] = useState<SectionType>("HERO")

  const swap = (i: number, j: number) => {
    const a = sections[i], b = sections[j]
    if (!a || !b) return
    update.mutate({ id: a.id, position: b.position })
    update.mutate({ id: b.id, position: a.position })
  }

  return (
    <PageShell>
      <PageHeader title="Homepage Builder" description="Section-based homepage. Add, reorder, enable/disable sections.">
        <div className="flex items-center gap-2">
          <Select value={type} onValueChange={(v) => setType((v ?? "HERO") as SectionType)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{label(t)}</SelectItem>)}</SelectContent>
          </Select>
          <Button disabled={add.isPending} onClick={() => add.mutate({ type })}>Add Section</Button>
        </div>
      </PageHeader>

      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : !sections.length ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
          <div className="text-center space-y-2"><LayoutTemplate className="w-8 h-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">No sections yet. Add one above.</p></div>
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((s, i) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-6">{i + 1}</span>
                <span className="font-medium">{label(s.type)}</span>
                <Badge variant={s.enabled ? "default" : "secondary"}>{s.enabled ? "Enabled" : "Disabled"}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => swap(i, i - 1)}><ArrowUp className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" disabled={i === sections.length - 1} onClick={() => swap(i, i + 1)}><ArrowDown className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => update.mutate({ id: s.id, enabled: !s.enabled })}>{s.enabled ? "Disable" : "Enable"}</Button>
                <Button size="icon" variant="ghost" onClick={() => del.mutate(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}
