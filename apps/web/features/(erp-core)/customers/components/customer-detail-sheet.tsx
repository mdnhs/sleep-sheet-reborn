"use client"
import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCustomer, useWallet, useLoyalty, useWalletAction, useLoyaltyAction, useCustomerStatus,
  type CustomerStatus,
} from "@/features/(erp-core)/customers/api/v1-customers"

const STATUS_VARIANT: Record<CustomerStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default", INACTIVE: "secondary", BLOCKED: "destructive", ARCHIVED: "outline",
}
const taka = (n: number) => `৳${n.toLocaleString()}`
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—")

export function CustomerDetailSheet({ customerId, onClose }: { customerId: string | null; onClose: () => void }) {
  const { data: c, isLoading } = useCustomer(customerId)
  const { data: wallet } = useWallet(customerId)
  const { data: loyalty } = useLoyalty(customerId)
  const credit = useWalletAction("credit")
  const debit = useWalletAction("debit")
  const earn = useLoyaltyAction("earn")
  const redeem = useLoyaltyAction("redeem")
  const block = useCustomerStatus("block")
  const unblock = useCustomerStatus("unblock")
  const archive = useCustomerStatus("archive")

  const [amount, setAmount] = useState("")
  const [points, setPoints] = useState("")
  const id = c?.id ?? ""
  const blocked = c?.status === "BLOCKED" || c?.status === "ARCHIVED"

  return (
    <Sheet open={!!customerId} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        {isLoading || !c ? (
          <div className="p-4"><Skeleton className="h-64 rounded-lg" /></div>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle>{c.name}</SheetTitle>
                <Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{c.phone}{c.email ? ` · ${c.email}` : ""} · {c.type}</p>
            </SheetHeader>

            <div className="px-4 pb-6">
              <div className="grid grid-cols-3 gap-2 py-4">
                <Stat label="Spent" value={taka(c.stats.totalSpent)} />
                <Stat label="Orders" value={String(c.stats.totalOrders)} />
                <Stat label="Last buy" value={fmt(c.stats.lastPurchaseAt)} />
              </div>

              <Tabs defaultValue="wallet">
                <TabsList className="w-full">
                  <TabsTrigger value="wallet" className="flex-1">Wallet</TabsTrigger>
                  <TabsTrigger value="loyalty" className="flex-1">Loyalty</TabsTrigger>
                  <TabsTrigger value="addresses" className="flex-1">Addresses</TabsTrigger>
                </TabsList>

                {/* Wallet */}
                <TabsContent value="wallet" className="space-y-3 pt-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-2xl font-bold">{taka(wallet?.balance ?? c.walletBalance)}</p>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1"><Label>Amount</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
                    <Button size="sm" disabled={!amount || credit.isPending}
                      onClick={() => credit.mutate({ id, amount: Number(amount), source: "MANUAL" }, { onSuccess: () => setAmount("") })}>Credit</Button>
                    <Button size="sm" variant="outline" disabled={!amount || debit.isPending || blocked}
                      onClick={() => debit.mutate({ id, amount: Number(amount), source: "MANUAL" }, { onSuccess: () => setAmount("") })}>Debit</Button>
                  </div>
                  <TxnList rows={(wallet?.transactions ?? []).map(t => ({ id: t.id, left: `${t.type} ${t.source}`, amount: `${t.type === "CREDIT" ? "+" : "-"}${taka(t.amount)}`, sub: `bal ${taka(t.balanceAfter)} · ${fmt(t.createdAt)}` }))} empty="No wallet activity" />
                </TabsContent>

                {/* Loyalty */}
                <TabsContent value="loyalty" className="space-y-3 pt-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Points</p>
                    <p className="text-2xl font-bold">{loyalty?.points ?? c.loyaltyPoints}</p>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1"><Label>Points</Label><Input type="number" value={points} onChange={e => setPoints(e.target.value)} /></div>
                    <Button size="sm" disabled={!points || earn.isPending}
                      onClick={() => earn.mutate({ id, points: Number(points) }, { onSuccess: () => setPoints("") })}>Earn</Button>
                    <Button size="sm" variant="outline" disabled={!points || redeem.isPending || blocked}
                      onClick={() => redeem.mutate({ id, points: Number(points) }, { onSuccess: () => setPoints("") })}>Redeem</Button>
                  </div>
                  <TxnList rows={(loyalty?.transactions ?? []).map(t => ({ id: t.id, left: `${t.type} ${t.source}`, amount: `${t.type === "EARN" ? "+" : "-"}${t.points}`, sub: `bal ${t.balanceAfter} · ${fmt(t.createdAt)}` }))} empty="No loyalty activity" />
                </TabsContent>

                {/* Addresses */}
                <TabsContent value="addresses" className="space-y-2 pt-3">
                  {!c.addresses.length ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No addresses</p>
                  ) : c.addresses.map(a => (
                    <div key={a.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{a.type}{a.isDefault ? " · default" : ""}</span>
                        {a.phone && <span className="text-muted-foreground">{a.phone}</span>}
                      </div>
                      <p className="text-muted-foreground">{a.addressLine}{a.area ? `, ${a.area}` : ""}{a.city ? `, ${a.city}` : ""}</p>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-5">
                {c.status === "BLOCKED"
                  ? <Button size="sm" variant="outline" className="flex-1" onClick={() => unblock.mutate(id)}>Unblock</Button>
                  : <Button size="sm" variant="outline" className="flex-1" disabled={c.status === "ARCHIVED"} onClick={() => block.mutate(id)}>Block</Button>}
                <Button size="sm" variant="destructive" className="flex-1" disabled={c.status === "ARCHIVED"} onClick={() => archive.mutate(id)}>Archive</Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-2 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  )
}

function TxnList({ rows, empty }: { rows: Array<{ id: string; left: string; amount: string; sub: string }>; empty: string }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground py-4 text-center">{empty}</p>
  return (
    <div className="space-y-1">
      {rows.map(r => (
        <div key={r.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
          <div><p className="font-medium">{r.left}</p><p className="text-xs text-muted-foreground">{r.sub}</p></div>
          <span className="font-semibold">{r.amount}</span>
        </div>
      ))}
    </div>
  )
}
