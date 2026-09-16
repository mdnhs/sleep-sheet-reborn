import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import { orders } from "@/db/schema";
import {
  isPendingSql,
  isConfirmedSql,
  isDeliveredSql,
  isCancelledSql,
  isReturnedSql,
  isTodaySqlFor,
  todayRange,
  bucketFor,
} from "./status-buckets";

// Run against a real Postgres (PGlite, in-memory). The bucket expressions are
// raw SQL whose correctness is mostly about SQL semantics — three-valued
// logic around NULL, ILIKE, coalesce — and a mock would happily agree with a
// wrong answer. The schema below is the subset of `orders` these expressions
// touch.
let client: PGlite;
let db: ReturnType<typeof drizzle>;

type Row = {
  id: string;
  status?: string;
  saleType?: string;
  trackingNumber?: string | null;
  courierStatus?: string | null;
  refundedAmount?: number;
  shippingAddress?: string;
  createdAt?: Date;
};

async function seed(rows: Row[]) {
  await db.execute(sql`delete from orders`);
  for (const r of rows) {
    await db.execute(sql`
      insert into orders (id, "orderNumber", status, "saleType", "trackingNumber",
        "courierStatus", "refundedAmount", "shippingAddress", "createdAt")
      values (${r.id}, ${`N-${r.id}`}, ${r.status ?? "PENDING"}, ${r.saleType ?? "WEBSITE"},
        ${r.trackingNumber ?? null}, ${r.courierStatus ?? null}, ${r.refundedAmount ?? 0},
        ${r.shippingAddress ?? "somewhere"}, ${r.createdAt ?? new Date("2026-06-01T12:00:00Z")})`);
  }
}

/** Ids matching a bucket expression. */
async function idsIn(expr: Parameters<typeof isPendingSql.append>[0] | typeof isPendingSql) {
  const res = await db
    .select({ id: orders.id })
    .from(orders)
    .where(expr as never)
    .orderBy(orders.id);
  return res.map((r) => r.id);
}

beforeAll(async () => {
  client = new PGlite();
  db = drizzle(client);
  await db.execute(sql`
    create table orders (
      id text primary key,
      "orderNumber" text not null,
      status text not null,
      "saleType" text not null,
      "trackingNumber" text,
      "courierStatus" text,
      "refundedAmount" numeric(12,2) not null default 0,
      "shippingAddress" text not null,
      "createdAt" timestamp(3) not null
    )`);
});

afterAll(async () => { await client.close(); });

describe("cancelled", () => {
  it("matches the order status and both courier cancellation values", async () => {
    await seed([
      { id: "a", status: "CANCELLED" },
      { id: "b", trackingNumber: "T1", courierStatus: "cancelled" },
      { id: "c", trackingNumber: "T2", courierStatus: "cancelled_approval_pending" },
      { id: "d", status: "PENDING" },
    ]);
    expect(await idsIn(isCancelledSql)).toEqual(["a", "b", "c"]);
  });
});

describe("returned", () => {
  it("matches REFUNDED, any refunded amount, and the courier's return values", async () => {
    await seed([
      { id: "a", status: "REFUNDED" },
      { id: "b", refundedAmount: 0.01 },
      { id: "c", trackingNumber: "T", courierStatus: "returned" },
      { id: "d", trackingNumber: "T", courierStatus: "partial-return" },
      { id: "e", trackingNumber: "T", courierStatus: "not_delivered" },
      { id: "f", trackingNumber: "T", courierStatus: "partial-not-delivered" },
      { id: "g", status: "PENDING" },
    ]);
    expect(await idsIn(isReturnedSql)).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  // mapSteadfastStatus had no slot for these, so before courierStatus was
  // stored raw they were being folded away and the orders misfiled.
  it("does not treat a partial return as a delivery", async () => {
    await seed([{ id: "a", trackingNumber: "T", courierStatus: "partial-return" }]);
    expect(await idsIn(isDeliveredSql)).toEqual([]);
    expect(await idsIn(isReturnedSql)).toEqual(["a"]);
  });
});

describe("delivered", () => {
  it("matches DELIVERED and the four courier delivery values", async () => {
    await seed([
      { id: "a", status: "DELIVERED" },
      { id: "b", trackingNumber: "T", courierStatus: "delivered" },
      { id: "c", trackingNumber: "T", courierStatus: "partial_delivered" },
      { id: "d", trackingNumber: "T", courierStatus: "delivered_approval_pending" },
      { id: "e", trackingNumber: "T", courierStatus: "partial_delivered_approval_pending" },
      { id: "f", status: "PENDING" },
    ]);
    expect(await idsIn(isDeliveredSql)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("yields to cancelled and returned", async () => {
    await seed([
      { id: "a", status: "DELIVERED", refundedAmount: 50 },
      { id: "b", status: "CANCELLED" },
    ]);
    expect(await idsIn(isDeliveredSql)).toEqual([]);
  });
});

describe("confirmed", () => {
  it("matches a POS showroom sale by its in-store pickup address, case-insensitively", async () => {
    await seed([
      { id: "a", saleType: "POS", shippingAddress: "POS - In-store pickup" },
      { id: "b", saleType: "POS", shippingAddress: "pos - IN-STORE PICKUP" },
      { id: "c", saleType: "POS", shippingAddress: "Online Delivery (POS)" },
    ]);
    expect(await idsIn(isConfirmedSql)).toEqual(["a", "b"]);
  });

  it("matches anything with a tracking number, or PROCESSING/SHIPPED", async () => {
    await seed([
      { id: "a", trackingNumber: "T" },
      { id: "b", status: "PROCESSING" },
      { id: "c", status: "SHIPPED" },
      { id: "d", status: "PENDING" },
    ]);
    expect(await idsIn(isConfirmedSql)).toEqual(["a", "b", "c"]);
  });

  it("treats an empty tracking number as no tracking number", async () => {
    await seed([{ id: "a", trackingNumber: "" }]);
    expect(await idsIn(isConfirmedSql)).toEqual([]);
    expect(await idsIn(isPendingSql)).toEqual(["a"]);
  });

  // Documented on purpose: the buckets are not a partition, and a POS
  // showroom sale legitimately appears under both.
  it("overlaps with delivered for a POS showroom sale", async () => {
    await seed([{ id: "a", saleType: "POS", status: "DELIVERED", shippingAddress: "POS - In-store pickup" }]);
    expect(await idsIn(isConfirmedSql)).toEqual(["a"]);
    expect(await idsIn(isDeliveredSql)).toEqual(["a"]);
  });
});

describe("pending", () => {
  it("is what is left over once every other bucket has had its say", async () => {
    await seed([
      { id: "a", status: "PENDING" },
      { id: "b", status: "PENDING", trackingNumber: "T" },      // confirmed
      { id: "c", status: "PENDING", refundedAmount: 5 },         // returned
      { id: "d", status: "DELIVERED" },                          // delivered
    ]);
    expect(await idsIn(isPendingSql)).toEqual(["a"]);
  });
});

// The trap the module comment calls out: `NULL IN (...)` is NULL, and
// `NOT NULL` is NULL, which drops the row rather than keeping it. Every
// courier test is wrapped in coalesce(..., false) for this reason — these
// cases fail loudly if that wrapping is ever removed.
describe("NULL courier status", () => {
  it("keeps a never-synced order in pending rather than dropping it", async () => {
    await seed([{ id: "a", status: "PENDING", trackingNumber: null, courierStatus: null }]);
    expect(await idsIn(isPendingSql)).toEqual(["a"]);
  });

  it("keeps a tracked but unsynced order in confirmed", async () => {
    await seed([{ id: "a", status: "PENDING", trackingNumber: "T", courierStatus: null }]);
    expect(await idsIn(isConfirmedSql)).toEqual(["a"]);
  });

  it("files every row into at least one bucket", async () => {
    await seed([
      { id: "a", status: "PENDING" },
      { id: "b", status: "PROCESSING", trackingNumber: "T" },
      { id: "c", status: "DELIVERED" },
      { id: "d", status: "CANCELLED" },
      { id: "e", status: "REFUNDED" },
      { id: "f", status: "SHIPPED", trackingNumber: "T", courierStatus: "hold" },
    ]);
    const all = new Set([
      ...(await idsIn(isPendingSql)),
      ...(await idsIn(isConfirmedSql)),
      ...(await idsIn(isDeliveredSql)),
      ...(await idsIn(isCancelledSql)),
      ...(await idsIn(isReturnedSql)),
    ]);
    expect([...all].sort()).toEqual(["a", "b", "c", "d", "e", "f"]);
  });
});

describe("courier status is ignored once an order is finished", () => {
  // The dashboard only ever fetched courier state for tracked, unfinished
  // orders. Mirroring that here is what keeps the server's classification
  // identical to the one the page used to compute.
  it("does not let a stale courier value move a delivered order", async () => {
    await seed([{ id: "a", status: "DELIVERED", trackingNumber: "T", courierStatus: "cancelled" }]);
    expect(await idsIn(isCancelledSql)).toEqual([]);
    expect(await idsIn(isDeliveredSql)).toEqual(["a"]);
  });

  it("does not let a stale courier value move a cancelled order", async () => {
    await seed([{ id: "a", status: "CANCELLED", trackingNumber: "T", courierStatus: "delivered" }]);
    expect(await idsIn(isDeliveredSql)).toEqual([]);
    expect(await idsIn(isCancelledSql)).toEqual(["a"]);
  });
});

describe("todayRange", () => {
  const now = new Date("2026-09-16T02:00:00Z").getTime(); // 08:00 in UTC+6

  // Dhaka is UTC+6, so getTimezoneOffset() returns -360. At 02:00 UTC it is
  // already the 16th locally, and a UTC day boundary would hide the morning's
  // orders — the range has to start at 2026-09-15T18:00Z.
  it("brackets the viewer's local day, not the UTC one", () => {
    const { from, to } = todayRange("-360", now);
    expect(from.toISOString()).toBe("2026-09-15T18:00:00.000Z");
    expect(to.toISOString()).toBe("2026-09-16T18:00:00.000Z");
  });

  it("falls back to the UTC day when no offset is sent", () => {
    const { from, to } = todayRange(undefined, now);
    expect(from.toISOString()).toBe("2026-09-16T00:00:00.000Z");
    expect(to.toISOString()).toBe("2026-09-17T00:00:00.000Z");
  });

  it("falls back to UTC on an unparseable offset rather than guessing", () => {
    expect(todayRange("abc", now).from.toISOString()).toBe("2026-09-16T00:00:00.000Z");
  });

  it("selects only orders inside the viewer's day", async () => {
    await seed([
      { id: "before", createdAt: new Date("2026-09-15T17:59:00Z") },
      { id: "inside", createdAt: new Date("2026-09-15T18:30:00Z") },
      { id: "after", createdAt: new Date("2026-09-16T18:30:00Z") },
    ]);
    expect(await idsIn(isTodaySqlFor(todayRange("-360", now)))).toEqual(["inside"]);
  });
});

describe("bucketFor", () => {
  const today = isTodaySqlFor(todayRange(undefined));

  it("maps each filter value to its bucket", () => {
    expect(bucketFor("PENDING", today)).toBe(isPendingSql);
    expect(bucketFor("CONFIRMED", today)).toBe(isConfirmedSql);
    expect(bucketFor("DELIVERED", today)).toBe(isDeliveredSql);
    expect(bucketFor("CANCELLED", today)).toBe(isCancelledSql);
    expect(bucketFor("RETURNED", today)).toBe(isReturnedSql);
    expect(bucketFor("TODAY", today)).toBe(today);
  });

  it("returns undefined for no filter, so the query is unrestricted", () => {
    expect(bucketFor(undefined, today)).toBeUndefined();
    expect(bucketFor("", today)).toBeUndefined();
    expect(bucketFor("NONSENSE", today)).toBeUndefined();
  });
});
