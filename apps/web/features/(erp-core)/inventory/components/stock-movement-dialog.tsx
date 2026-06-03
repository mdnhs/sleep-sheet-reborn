"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StockInSchema,
  StockOutSchema,
  AdjustSchema,
  DamageLossSchema,
  type StockInValues,
  type StockOutValues,
  type AdjustValues,
  type DamageLossValues,
} from "@/features/(erp-core)/inventory/schema";
import {
  useStockIn,
  useStockOut,
  useAdjustStock,
  useDamageLoss,
} from "@/features/(erp-core)/inventory/api/use-inventory-mutations";

interface TargetProduct {
  id: string;
  name: string;
  stock: number;
}

interface Props {
  product: TargetProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function StockMovementDialog({ product, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Stock</DialogTitle>
          <DialogDescription>
            {product ? `${product.name} · on hand: ${product.stock}` : ""}
          </DialogDescription>
        </DialogHeader>

        {product ? (
          <Tabs defaultValue="in">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="in">In</TabsTrigger>
              <TabsTrigger value="out">Out</TabsTrigger>
              <TabsTrigger value="adjust">Adjust</TabsTrigger>
              <TabsTrigger value="damage">Damage</TabsTrigger>
            </TabsList>

            <TabsContent value="in">
              <StockInForm product={product} onDone={() => onOpenChange(false)} />
            </TabsContent>
            <TabsContent value="out">
              <StockOutForm product={product} onDone={() => onOpenChange(false)} />
            </TabsContent>
            <TabsContent value="adjust">
              <AdjustForm product={product} onDone={() => onOpenChange(false)} />
            </TabsContent>
            <TabsContent value="damage">
              <DamageForm product={product} onDone={() => onOpenChange(false)} />
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function StockInForm({ product, onDone }: { product: TargetProduct; onDone: () => void }) {
  const mutation = useStockIn();
  const form = useForm<StockInValues>({
    resolver: zodResolver(StockInSchema),
    defaultValues: { productId: product.id, quantity: 1 },
  });
  useEffect(() => form.setValue("productId", product.id), [product.id, form]);
  const { errors } = form.formState;

  return (
    <form
      className="space-y-3 pt-2"
      onSubmit={form.handleSubmit((v) => mutation.mutate(v, { onSuccess: onDone }))}
    >
      <Field label="Quantity" error={errors.quantity?.message}>
        <Input type="number" min={1} {...form.register("quantity", { valueAsNumber: true })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Batch No. (optional)" error={errors.batchNumber?.message}>
          <Input {...form.register("batchNumber")} />
        </Field>
        <Field label="Unit Cost (optional)" error={errors.costPrice?.message}>
          <Input
            type="number"
            min={0}
            step="0.01"
            {...form.register("costPrice", {
              setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)),
            })}
          />
        </Field>
      </div>
      <Field label="Supplier (optional)" error={errors.supplierName?.message}>
        <Input {...form.register("supplierName")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Mfg Date (optional)" error={errors.manufactureDate?.message}>
          <Input type="date" {...form.register("manufactureDate")} />
        </Field>
        <Field label="Expiry Date (optional)" error={errors.expiryDate?.message}>
          <Input type="date" {...form.register("expiryDate")} />
        </Field>
      </div>
      <Field label="Reference (optional)" error={errors.reference?.message}>
        <Input {...form.register("reference")} />
      </Field>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving…" : "Add Stock"}
      </Button>
    </form>
  );
}

function StockOutForm({ product, onDone }: { product: TargetProduct; onDone: () => void }) {
  const mutation = useStockOut();
  const form = useForm<StockOutValues>({
    resolver: zodResolver(StockOutSchema),
    defaultValues: { productId: product.id, quantity: 1, reason: "" },
  });
  useEffect(() => form.setValue("productId", product.id), [product.id, form]);
  const { errors } = form.formState;

  return (
    <form
      className="space-y-3 pt-2"
      onSubmit={form.handleSubmit((v) => mutation.mutate(v, { onSuccess: onDone }))}
    >
      <Field label="Quantity" error={errors.quantity?.message}>
        <Input type="number" min={1} {...form.register("quantity", { valueAsNumber: true })} />
      </Field>
      <Field label="Reason" error={errors.reason?.message}>
        <Input placeholder="e.g. internal use, sample" {...form.register("reason")} />
      </Field>
      <Field label="Reference (optional)" error={errors.reference?.message}>
        <Input {...form.register("reference")} />
      </Field>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving…" : "Issue Stock"}
      </Button>
    </form>
  );
}

function AdjustForm({ product, onDone }: { product: TargetProduct; onDone: () => void }) {
  const mutation = useAdjustStock();
  const form = useForm<AdjustValues>({
    resolver: zodResolver(AdjustSchema),
    defaultValues: { productId: product.id, newQuantity: product.stock, reason: "" },
  });
  useEffect(() => {
    form.setValue("productId", product.id);
    form.setValue("newQuantity", product.stock);
  }, [product.id, product.stock, form]);
  const { errors } = form.formState;

  return (
    <form
      className="space-y-3 pt-2"
      onSubmit={form.handleSubmit((v) => mutation.mutate(v, { onSuccess: onDone }))}
    >
      <Field label="New on-hand quantity" error={errors.newQuantity?.message}>
        <Input type="number" min={0} {...form.register("newQuantity", { valueAsNumber: true })} />
      </Field>
      <Field label="Reason" error={errors.reason?.message}>
        <Input placeholder="e.g. stock-take correction" {...form.register("reason")} />
      </Field>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving…" : "Adjust"}
      </Button>
    </form>
  );
}

function DamageForm({ product, onDone }: { product: TargetProduct; onDone: () => void }) {
  const mutation = useDamageLoss();
  const form = useForm<DamageLossValues>({
    resolver: zodResolver(DamageLossSchema),
    defaultValues: { productId: product.id, quantity: 1, type: "DAMAGE", reason: "" },
  });
  useEffect(() => form.setValue("productId", product.id), [product.id, form]);
  const { errors } = form.formState;
  const type = form.watch("type");

  return (
    <form
      className="space-y-3 pt-2"
      onSubmit={form.handleSubmit((v) => mutation.mutate(v, { onSuccess: onDone }))}
    >
      <Field label="Type" error={errors.type?.message}>
        <Select value={type} onValueChange={(val) => form.setValue("type", val as "DAMAGE" | "LOSS")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DAMAGE">Damage</SelectItem>
            <SelectItem value="LOSS">Loss</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Quantity" error={errors.quantity?.message}>
        <Input type="number" min={1} {...form.register("quantity", { valueAsNumber: true })} />
      </Field>
      <Field label="Reason" error={errors.reason?.message}>
        <Textarea placeholder="What happened?" {...form.register("reason")} />
      </Field>
      <Button type="submit" variant="destructive" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving…" : "Record Write-off"}
      </Button>
    </form>
  );
}
