"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, FileText } from "lucide-react"
import { usePages, useCreatePage, useUpdatePage } from "@/features/(storefront)/storefront/api/v1-storefront"

function CreatePageDialog() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [content, setContent] = useState("")
  const { mutate: create, isPending } = useCreatePage()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger><Button className="gap-1.5"><Plus className="w-4 h-4" />New Page</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Page</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="About Us" /></div>
          <div className="space-y-2"><Label>Slug (optional)</Label><Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="about-us" /></div>
          <div className="space-y-2"><Label>Content</Label><Textarea value={content} onChange={e => setContent(e.target.value)} rows={6} /></div>
          <Button className="w-full" disabled={isPending || !title}
            onClick={() => create({ title, slug: slug || undefined, content }, { onSuccess: () => { setOpen(false); setTitle(""); setSlug(""); setContent("") } })}>
            {isPending ? "Creating…" : "Create Page"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function PagesPage() {
  const { data: pages = [], isLoading } = usePages()
  const { mutate: update } = useUpdatePage()
  return (
    <PageShell>
      <PageHeader title="Pages" description="Static content pages (About, Contact, Policies). SEO fields per page.">
        <CreatePageDialog />
      </PageHeader>
      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : !pages.length ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
          <div className="text-center space-y-2"><FileText className="w-8 h-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">No pages yet.</p></div>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Slug</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {pages.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="text-muted-foreground">/{p.slug}</TableCell>
                  <TableCell><Badge variant={p.status === "PUBLISHED" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => update({ id: p.id, status: p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" })}>
                      {p.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  )
}
