"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  useListPosSales,
  useGetPosSale,
  useCompletePosSale,
  useCancelPosSale,
  type PosSale,
  type PaymentMethod,
} from "@/features/(erp-core)/pos/api/v1-pos"
import { format } from "date-fns"
import { ShoppingCart, Eye, CheckCircle, XCircle } from "lucide-react"

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'BKASH', 'NAGAD', 'CARD', 'BANK', 'WALLET']

function CompleteDraftDialog({ saleId, grandTotal }: { saleId: string; grandTotal: number }) {
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>("CASH")
  const { mutate: complete, isPending } = useCompletePosSale()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" className="gap-1.5"><CheckCircle className="w-3.5 h-3.5" />Complete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Complete Sale</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex justify-between font-semibold"><span>Grand Total</span><span>৳{(grandTotal / 100).toLocaleString()}</span></div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Payment Method</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${method === m ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <Button
            className="w-full"
            disabled={isPending}
            onClick={() => {
              complete({ id: saleId, payments: [{ method, amount: grandTotal }] }, {
                onSuccess: () => setOpen(false),
              })
            }}
          >
            {isPending ? "Processing…" : `Collect ৳${(grandTotal / 100).toLocaleString()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DraftDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: sale, isLoading } = useGetPosSale(id)
  const { mutate: cancel, isPending: cancelling } = useCancelPosSale()

  if (isLoading) return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}</div>
  if (!sale) return <p className="text-sm text-muted-foreground">Sale not found.</p>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold font-mono text-sm">{sale.saleNumber}</p>
          <div className="flex gap-2 mt-0.5">
            <Badge variant="secondary">{sale.status}</Badge>
            <span className="text-xs text-muted-foreground">{format(new Date(sale.createdAt), "MMM d, HH:mm")}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>

      <div className="space-y-1">
        {sale.items.map(item => (
          <div key={item.id} className="flex justify-between text-sm py-1 border-b last:border-0">
            <span className="font-mono text-xs text-muted-foreground">{item.variantId.slice(0, 16)}…</span>
            <span>{item.quantity} × ৳{(item.unitPrice / 100).toLocaleString()}</span>
            <span className="font-medium">৳{(item.lineTotal / 100).toLocaleString()}</span>
          </div>
        ))}
      </div>

      <Separator />
      <div className="text-sm space-y-0.5">
        {sale.discount > 0 && <div className="flex justify-between text-muted-foreground"><span>Discount</span><span>-৳{(sale.discount / 100).toLocaleString()}</span></div>}
        <div className="flex justify-between font-semibold"><span>Grand Total</span><span>৳{(sale.grandTotal / 100).toLocaleString()}</span></div>
      </div>

      {sale.status === 'DRAFT' && (
        <div className="flex gap-2 pt-1">
          <CompleteDraftDialog saleId={sale.id} grandTotal={sale.grandTotal} />
          <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => cancel(sale.id)} disabled={cancelling}>
            <XCircle className="w-3.5 h-3.5" />{cancelling ? "…" : "Cancel"}
          </Button>
        </div>
      )}
    </div>
  )
}

export default function HoldSalePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: draftSales = [], isLoading } = useListPosSales('DRAFT')

  return (
    <PageShell>
      <PageHeader title="Held Sales" description="View draft sales on hold. Complete or cancel them." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />Draft Sales
                {draftSales.length > 0 && <Badge variant="secondary">{draftSales.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded" />)}</div>
              ) : !draftSales.length ? (
                <p className="text-center text-sm text-muted-foreground py-8">No held sales.</p>
              ) : (
                <div className="space-y-2">
                  {draftSales.map((s: PosSale) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className={`w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors ${selectedId === s.id ? "border-primary bg-accent" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm font-mono">{s.saleNumber}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(s.createdAt), "MMM d, HH:mm")}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">DRAFT</Badge>
                          <p className="text-xs text-muted-foreground mt-0.5">৳{(s.grandTotal / 100).toLocaleString()}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedId ? (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Eye className="w-4 h-4" />Sale Detail</CardTitle></CardHeader>
              <CardContent>
                <DraftDetail id={selectedId} onClose={() => setSelectedId(null)} />
              </CardContent>
            </Card>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
              <p className="text-sm text-muted-foreground">Select a held sale to view details</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
