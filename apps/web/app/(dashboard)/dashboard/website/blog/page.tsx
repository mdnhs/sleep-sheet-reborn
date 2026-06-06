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
import { Plus, Newspaper } from "lucide-react"
import { useBlogPosts, useCreatePost, useUpdatePost } from "@/features/(storefront)/storefront/api/v1-storefront"

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—")

function CreatePostDialog() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const { mutate: create, isPending } = useCreatePost()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger><Button className="gap-1.5"><Plus className="w-4 h-4" />New Post</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Blog Post</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="space-y-2"><Label>Category (optional)</Label><Input value={category} onChange={e => setCategory(e.target.value)} /></div>
          <div className="space-y-2"><Label>Excerpt</Label><Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} /></div>
          <div className="space-y-2"><Label>Content</Label><Textarea value={content} onChange={e => setContent(e.target.value)} rows={6} /></div>
          <Button className="w-full" disabled={isPending || !title}
            onClick={() => create({ title, category: category || undefined, excerpt, content }, { onSuccess: () => { setOpen(false); setTitle(""); setCategory(""); setExcerpt(""); setContent("") } })}>
            {isPending ? "Creating…" : "Create Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function BlogPage() {
  const { data: posts = [], isLoading } = useBlogPosts()
  const { mutate: update } = useUpdatePost()
  return (
    <PageShell>
      <PageHeader title="Blog" description="Content marketing posts with categories, tags and SEO.">
        <CreatePostDialog />
      </PageHeader>
      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : !posts.length ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
          <div className="text-center space-y-2"><Newspaper className="w-8 h-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">No posts yet.</p></div>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Published</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {posts.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="text-muted-foreground">{p.category ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{fmt(p.publishedAt)}</TableCell>
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
