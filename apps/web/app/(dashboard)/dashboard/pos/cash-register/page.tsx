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
import {
  useListRegisters,
  useCreateRegister,
  useListSessions,
  useOpenSession,
  useCloseSession,
  useGetSession,
  type CashRegister,
  type RegisterSession,
} from "@/features/(erp-core)/pos/api/v1-pos"
import { useGetOutlets } from "@/features/(erp-core)/locations/api/locations"
import { format } from "date-fns"
import { Monitor, Plus, Lock, Unlock } from "lucide-react"

function OpenSessionDialog({ register }: { register: CashRegister }) {
  const [open, setOpen] = useState(false)
  const [openingCash, setOpeningCash] = useState("")
  const { mutate: openSession, isPending } = useOpenSession()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" className="gap-1.5"><Unlock className="w-3.5 h-3.5" />Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Open Register Session</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">Register: <span className="font-medium text-foreground">{register.name}</span></p>
          <div className="space-y-2">
            <Label>Opening Cash (৳)</Label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={openingCash}
              onChange={e => setOpeningCash(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            disabled={isPending || !openingCash}
            onClick={() => {
              openSession({ registerId: register.id, openingCash: Number(openingCash) }, {
                onSuccess: () => setOpen(false),
              })
            }}
          >
            {isPending ? "Opening…" : "Open Session"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CloseSessionDialog({ session }: { session: RegisterSession }) {
  const [open, setOpen] = useState(false)
  const [closingCash, setClosingCash] = useState("")
  const { mutate: closeSession, isPending } = useCloseSession()
  const { data: detail } = useGetSession(session.id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" variant="outline" className="gap-1.5"><Lock className="w-3.5 h-3.5" />Close</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Close Register Session</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          {detail && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Sales</span>
                <span className="font-medium">৳{((detail.totalSales ?? 0) / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transactions</span>
                <span className="font-medium">{detail.saleCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opening Cash</span>
                <span className="font-medium">৳{(session.openingCash / 100).toLocaleString()}</span>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Closing Cash Count (৳)</Label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={closingCash}
              onChange={e => setClosingCash(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            disabled={isPending || !closingCash}
            onClick={() => {
              closeSession({ sessionId: session.id, closingCash: Number(closingCash) }, {
                onSuccess: () => setOpen(false),
              })
            }}
          >
            {isPending ? "Closing…" : "Close Session"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CreateRegisterDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [locationId, setLocationId] = useState("")
  const { mutate: create, isPending } = useCreateRegister()
  const { data: outlets = [] } = useGetOutlets()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="gap-1.5"><Plus className="w-4 h-4" />New Register</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Cash Register</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input placeholder="e.g. Counter 1" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Outlet Location</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
            >
              <option value="">Select outlet…</option>
              {outlets.map((l) => (
                <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
              ))}
            </select>
          </div>
          <Button
            className="w-full"
            disabled={isPending || !name || !locationId}
            onClick={() => {
              create({ name, locationId }, {
                onSuccess: () => { setOpen(false); setName(""); setLocationId("") },
              })
            }}
          >
            {isPending ? "Creating…" : "Create Register"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RegisterCard({ register }: { register: CashRegister }) {
  const { data: sessions = [], isLoading } = useListSessions(register.id)
  const openSession = sessions.find(s => s.status === 'OPEN')

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">{register.name}</CardTitle>
          </div>
          <Badge variant={register.status === 'ACTIVE' ? 'default' : 'secondary'}>{register.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-8 rounded" />
        ) : openSession ? (
          <div className="flex items-center justify-between rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-3 py-2">
            <div>
              <p className="text-xs font-medium text-green-700 dark:text-green-400">Session Open</p>
              <p className="text-xs text-muted-foreground">{format(new Date(openSession.openedAt), "MMM d, HH:mm")}</p>
            </div>
            <CloseSessionDialog session={openSession} />
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">No active session</p>
            {register.status === 'ACTIVE' && <OpenSessionDialog register={register} />}
          </div>
        )}

        {sessions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recent Sessions</p>
            {sessions.slice(0, 3).map(s => (
              <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                <span className="text-muted-foreground">{format(new Date(s.openedAt), "MMM d, HH:mm")}</span>
                <Badge variant={s.status === 'OPEN' ? 'default' : 'secondary'} className="text-xs">{s.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function CashRegisterPage() {
  const { data: registers = [], isLoading } = useListRegisters()

  return (
    <PageShell>
      <PageHeader title="Cash Registers" description="Manage POS registers and open/close sessions.">
        <CreateRegisterDialog />
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : !registers.length ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-dashed">
          <div className="text-center space-y-2">
            <Monitor className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No registers yet. Create one to start using POS.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {registers.map(r => <RegisterCard key={r.id} register={r} />)}
        </div>
      )}
    </PageShell>
  )
}
