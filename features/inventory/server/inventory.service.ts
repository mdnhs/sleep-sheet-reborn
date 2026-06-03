import { startOfMonth } from "date-fns";
import db from "@/lib/db";
import { ServiceError } from "@/lib/service-error";
import { MovementType } from "@/lib/enums";
import type {
  StockInValues,
  StockOutValues,
  AdjustValues,
  DamageLossValues,
} from "@/features/inventory/schema";

const DAY_MS = 24 * 60 * 60 * 1000;

type StockStatus = "OUT" | "LOW" | "OK";

function statusOf(stock: number, threshold: number): StockStatus {
  if (stock <= 0) return "OUT";
  if (stock <= threshold) return "LOW";
  return "OK";
}

/**
 * Consume `qty` units across a product's batches, earliest expiry first (FIFO).
 * Decrements each batch's remaining quantity in turn. Caller is responsible for
 * validating that enough stock exists.
 */
async function consumeBatches(productId: string, qty: number) {
  let remaining = qty;
  const batches = await db.inventoryBatch.findMany({
    where: { productId, quantity: { gt: 0 } },
    orderBy: [{ expiryDate: "asc" }, { receivedAt: "asc" }],
  });
  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantity, remaining);
    await db.inventoryBatch.update({
      where: { id: batch.id },
      data: { quantity: batch.quantity - take },
    });
    remaining -= take;
  }
}

async function getProductOrThrow(productId: string) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new ServiceError("Product not found", 404);
  return product;
}

/** Receive new stock as a tracked batch and log a STOCK_IN movement. */
export async function stockIn(input: StockInValues, userId?: string) {
  await getProductOrThrow(input.productId);
  const qty = input.quantity;

  const batch = await db.inventoryBatch.create({
    data: {
      productId: input.productId,
      batchNumber: input.batchNumber || null,
      quantity: qty,
      initialQuantity: qty,
      costPrice: input.costPrice ?? null,
      supplierName: input.supplierName || null,
      manufactureDate: input.manufactureDate ? new Date(input.manufactureDate) : null,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
      receivedAt: new Date(),
    },
  });

  await db.inventoryMovement.create({
    data: {
      productId: input.productId,
      batchId: batch?.id ?? null,
      type: MovementType.STOCK_IN,
      quantity: qty,
      unitCost: input.costPrice ?? null,
      reference: input.reference || null,
      note: input.note || null,
      createdBy: userId ?? null,
    },
  });

  await db.product.update({
    where: { id: input.productId },
    data: { stock: { increment: qty } },
  });

  return { success: true, batchId: batch?.id ?? null };
}

/** Manually issue stock (not a customer order). Consumes batches FIFO. */
export async function stockOut(input: StockOutValues, userId?: string) {
  const product = await getProductOrThrow(input.productId);
  const qty = input.quantity;
  if ((product.stock ?? 0) < qty) {
    throw new ServiceError("Insufficient stock for this operation", 400);
  }

  await consumeBatches(input.productId, qty);
  await db.inventoryMovement.create({
    data: {
      productId: input.productId,
      type: MovementType.STOCK_OUT,
      quantity: -qty,
      reason: input.reason,
      reference: input.reference || null,
      note: input.note || null,
      createdBy: userId ?? null,
    },
  });
  await db.product.update({
    where: { id: input.productId },
    data: { stock: { decrement: qty } },
  });

  return { success: true };
}

/** Set the absolute on-hand quantity (stock-take correction) and reconcile batches. */
export async function adjustStock(input: AdjustValues, userId?: string) {
  const product = await getProductOrThrow(input.productId);
  const current = product.stock ?? 0;
  const delta = input.newQuantity - current;

  if (delta === 0) return { success: true, delta: 0 };

  if (delta > 0) {
    await db.inventoryBatch.create({
      data: {
        productId: input.productId,
        batchNumber: "ADJUSTMENT",
        quantity: delta,
        initialQuantity: delta,
        receivedAt: new Date(),
      },
    });
  } else {
    await consumeBatches(input.productId, Math.min(current, -delta));
  }

  await db.inventoryMovement.create({
    data: {
      productId: input.productId,
      type: MovementType.ADJUSTMENT,
      quantity: delta,
      reason: input.reason,
      note: input.note || null,
      createdBy: userId ?? null,
    },
  });
  await db.product.update({
    where: { id: input.productId },
    data: { stock: input.newQuantity },
  });

  return { success: true, delta };
}

/** Write off stock as damage or loss. */
export async function recordDamageLoss(input: DamageLossValues, userId?: string) {
  const product = await getProductOrThrow(input.productId);
  const qty = input.quantity;
  if ((product.stock ?? 0) < qty) {
    throw new ServiceError("Insufficient stock to write off", 400);
  }

  if (input.batchId) {
    const batch = await db.inventoryBatch.findUnique({ where: { id: input.batchId } });
    if (batch) {
      await db.inventoryBatch.update({
        where: { id: batch.id },
        data: { quantity: Math.max(0, batch.quantity - qty) },
      });
    }
  } else {
    await consumeBatches(input.productId, qty);
  }

  await db.inventoryMovement.create({
    data: {
      productId: input.productId,
      batchId: input.batchId || null,
      type: input.type,
      quantity: -qty,
      reason: input.reason,
      note: input.note || null,
      createdBy: userId ?? null,
    },
  });
  await db.product.update({
    where: { id: input.productId },
    data: { stock: { decrement: qty } },
  });

  return { success: true };
}

/** Dashboard summary cards. */
export async function getInventorySummary() {
  const horizon = new Date(Date.now() + 30 * DAY_MS).toISOString();
  const monthStart = startOfMonth(new Date()).toISOString();

  const [totalSkus, agg, lowRows, outRows, expRows, dmgRows] = await Promise.all([
    db.product.count(),
    db.product.aggregate({ _sum: { stock: true } }),
    db.$queryRaw<{ c: number }[]>`SELECT COUNT(*) as c FROM products WHERE "productStock" <= "lowStockThreshold" AND "productStock" > 0`,
    db.$queryRaw<{ c: number }[]>`SELECT COUNT(*) as c FROM products WHERE "productStock" <= 0`,
    db.$queryRaw<{ c: number }[]>`SELECT COUNT(*) as c FROM inventory_batches WHERE "quantity" > 0 AND "expiryDate" IS NOT NULL AND "expiryDate" <= ${horizon}`,
    db.$queryRaw<{ s: number }[]>`SELECT COALESCE(SUM(ABS("quantity")), 0) as s FROM inventory_movements WHERE "type" IN ('DAMAGE', 'LOSS') AND "createdAt" >= ${monthStart}`,
  ]);

  return {
    totalSkus,
    totalUnits: agg._sum.stock || 0,
    lowStockCount: Number(lowRows[0]?.c ?? 0),
    outOfStockCount: Number(outRows[0]?.c ?? 0),
    expiringSoonCount: Number(expRows[0]?.c ?? 0),
    damageLossThisMonth: Number(dmgRows[0]?.s ?? 0),
  };
}

export interface StockListItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  threshold: number;
  status: StockStatus;
}

/** Live stock list with reorder status. `status` filter: low | out | ok | all. */
export async function listStock(params: { search?: string; status?: string } = {}) {
  const where = params.search ? { name: { contains: params.search } } : undefined;
  const products = await db.product.findMany({ where, orderBy: { name: "asc" } });

  let items: StockListItem[] = products.map((p) => {
    const stock = p.stock ?? 0;
    const threshold = p.lowStockThreshold ?? 0;
    return { id: p.id, name: p.name, sku: p.sku, stock, threshold, status: statusOf(stock, threshold) };
  });

  const filter = params.status;
  if (filter === "low") items = items.filter((i) => i.status === "LOW");
  else if (filter === "out") items = items.filter((i) => i.status === "OUT");
  else if (filter === "ok") items = items.filter((i) => i.status === "OK");

  return { data: items, total: items.length };
}

/** Products at or below their reorder threshold (includes out of stock). */
export async function listLowStock() {
  const { data } = await listStock();
  return { data: data.filter((i) => i.status !== "OK") };
}

/** Full inventory detail for one product: batches + recent movements. */
export async function getProductInventory(productId: string) {
  const product = await getProductOrThrow(productId);
  const [batches, movements] = await Promise.all([
    db.inventoryBatch.findMany({ where: { productId }, orderBy: { receivedAt: "desc" } }),
    db.inventoryMovement.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    stock: product.stock ?? 0,
    threshold: product.lowStockThreshold ?? 0,
    batches,
    movements,
  };
}

/** Paginated movement ledger. */
export async function listMovements(params: {
  productId?: string;
  type?: string;
  page?: number;
  limit?: number;
} = {}) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const where: Record<string, unknown> = {};
  if (params.productId) where.productId = params.productId;
  if (params.type) where.type = params.type;

  const [movements, total] = await Promise.all([
    db.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: { product: true },
    }),
    db.inventoryMovement.count({ where }),
  ]);

  return {
    data: movements.map((m) => ({
      id: m.id,
      productId: m.productId,
      productName: m.product?.name ?? "—",
      type: m.type,
      quantity: m.quantity,
      reason: m.reason,
      reference: m.reference,
      note: m.note,
      createdAt: m.createdAt,
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** Batches expiring within `days` (default 30), soonest first. */
export async function listExpiring(days = 30) {
  const horizon = new Date(Date.now() + days * DAY_MS);
  const batches = await db.inventoryBatch.findMany({
    where: { quantity: { gt: 0 }, expiryDate: { lte: horizon } },
    orderBy: { expiryDate: "asc" },
    include: { product: true },
  });
  return {
    data: batches.map((b) => ({
      id: b.id,
      productId: b.productId,
      productName: b.product?.name ?? "—",
      batchNumber: b.batchNumber,
      quantity: b.quantity,
      expiryDate: b.expiryDate,
    })),
  };
}

/** Batches for one product, newest receipt first. */
export async function listBatches(productId: string) {
  const batches = await db.inventoryBatch.findMany({
    where: { productId },
    orderBy: { receivedAt: "desc" },
  });
  return { data: batches };
}
