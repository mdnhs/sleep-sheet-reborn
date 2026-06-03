import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";
import cuid from "cuid";

type AnyRecord = Record<string, any>;

type ModelConfig = {
  table: string;
  fields: Record<string, string>;
  bools?: string[];
  dates?: string[];
};

type ModelClient = {
  findMany(args?: AnyRecord): Promise<AnyRecord[]>;
  findUnique(args: AnyRecord): Promise<AnyRecord | null>;
  findFirst(args?: AnyRecord): Promise<AnyRecord | null>;
  count(args?: AnyRecord): Promise<number>;
  aggregate(args?: AnyRecord): Promise<AnyRecord>;
  groupBy(args: AnyRecord): Promise<AnyRecord[]>;
  create(args: AnyRecord): Promise<AnyRecord | null>;
  createMany(args: AnyRecord): Promise<{ count: number }>;
  update(args: AnyRecord): Promise<AnyRecord | null>;
  upsert(args: AnyRecord): Promise<AnyRecord | null>;
  delete(args: AnyRecord): Promise<AnyRecord | null>;
  deleteMany(args?: AnyRecord): Promise<{ count: number }>;
};

const models = {
  user: { table: "User", fields: map(["id", "name", "email", "password", "phone", "address", "role", "createdAt"]), dates: ["createdAt"] },
  product: {
    table: "products",
    fields: {
      id: "id",
      name: "productName",
      description: "productDescription",
      price: "productPrice",
      stock: "productStock",
      sku: "productSKU",
      variants: "productVariants",
      tags: "productTags",
      images: "productImages",
      sizes: "productSize",
      features: "productFeatures",
      careInstruction: "careInstruction",
      categoryId: "productCategory",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      isFeatured: "productIsFeatured",
      lowStockThreshold: "lowStockThreshold",
    },
    bools: ["isFeatured"],
    dates: ["createdAt", "updatedAt"],
  },
  inventoryBatch: {
    table: "inventory_batches",
    fields: map(["id", "productId", "batchNumber", "quantity", "initialQuantity", "costPrice", "supplierName", "manufactureDate", "expiryDate", "receivedAt", "createdAt", "updatedAt"]),
    dates: ["manufactureDate", "expiryDate", "receivedAt", "createdAt", "updatedAt"],
  },
  inventoryMovement: {
    table: "inventory_movements",
    fields: map(["id", "productId", "batchId", "type", "quantity", "reason", "reference", "unitCost", "note", "createdBy", "createdAt"]),
    dates: ["createdAt"],
  },
  campaign: { table: "campaigns", fields: map(["id", "title", "slug", "headline", "subheadline", "badgeLabel", "ctaLabel", "layout", "pageLayout", "startsAt", "endsAt", "status", "productId", "createdAt", "updatedAt"]), dates: ["startsAt", "endsAt", "createdAt", "updatedAt"] },
  review: { table: "product_reviews", fields: map(["id", "comment", "rating", "userId", "productId", "createdAt", "updatedAt"]), dates: ["createdAt", "updatedAt"] },
  specification: { table: "product_specifications", fields: map(["id", "key", "value", "productId"]) },
  category: { table: "Category", fields: map(["id", "label", "value", "parentId", "createdAt"]), dates: ["createdAt"] },
  orderTimelineEvent: { table: "order_timeline_events", fields: map(["id", "orderId", "status", "message", "createdAt"]), dates: ["createdAt"] },
  order: { table: "orders", fields: map(["id", "orderNumber", "userId", "guestName", "guestPhone", "guestEmail", "totalAmount", "subtotal", "shippingCost", "tax", "paymentMethod", "paymentStatus", "shippingAddress", "shippingCity", "shippingState", "shippingPostalCode", "shippingCountry", "shippingMethodId", "status", "createdAt", "updatedAt", "trackingNumber", "cancellationReason"]), dates: ["createdAt", "updatedAt"] },
  orderItem: { table: "order_items", fields: map(["id", "orderId", "productId", "quantity", "price", "size", "color", "createdAt"]), dates: ["createdAt"] },
  payment: { table: "payments", fields: map(["id", "orderId", "amount", "method", "transactionId", "last4Digits", "expirationDate", "status", "createdAt", "updatedAt"]), dates: ["createdAt", "updatedAt"] },
  shippingMethod: { table: "shipping_methods", fields: map(["id", "name", "cost", "duration", "active"]), bools: ["active"] },
  cart: { table: "carts", fields: map(["id", "userId", "createdAt", "updatedAt"]), dates: ["createdAt", "updatedAt"] },
  cartItem: { table: "cart_items", fields: map(["id", "cartId", "productId", "quantity", "size", "color", "createdAt"]), dates: ["createdAt"] },
  testimonial: { table: "Testimonial", fields: map(["id", "name", "message", "rating", "image", "role", "createdAt", "updatedAt"]), dates: ["createdAt", "updatedAt"] },
  wishlist: { table: "wishlists", fields: map(["id", "userId", "createdAt", "updatedAt"]), dates: ["createdAt", "updatedAt"] },
  wishlistItem: { table: "wishlist_items", fields: map(["id", "wishlistId", "productId", "createdAt"]), dates: ["createdAt"] },
  oTPVerification: { table: "OTPVerification", fields: map(["id", "userId", "email", "code", "type", "expiresAt", "verified", "createdAt"]), bools: ["verified"], dates: ["expiresAt", "createdAt"] },
  siteSetting: { table: "site_settings", fields: map(["key", "value", "updatedAt"]), dates: ["updatedAt"] },
} satisfies Record<string, ModelConfig>;

function map(fields: string[]) {
  return Object.fromEntries(fields.map((field) => [field, field]));
}

/** Worker (Hono) sets this in middleware so the legacy ORM works outside Next.js.
 *  Next.js still resolves DB via getCloudflareContext(). Remove once all
 *  services migrate to Drizzle (packages/database/src/db.ts). */
export function setWorkerD1(db: D1Database) {
  (globalThis as { __WORKER_D1__?: D1Database }).__WORKER_D1__ = db;
}

/** Resolves the raw D1 binding in either context (Worker or Next.js).
 *  Use this instead of calling getCloudflareContext() directly in services. */
export function resolveD1(): D1Database {
  // Worker context (no OpenNext): use the binding stashed by middleware.
  const workerDb = (globalThis as { __WORKER_D1__?: D1Database }).__WORKER_D1__;
  if (workerDb) return workerDb;

  const { env } = getCloudflareContext();
  const db = (env as { DB?: D1Database }).DB;
  if (!db) throw new Error("D1 binding `DB` not found");
  return db;
}

function getDb(): D1Database {
  return resolveD1();
}

function q(name: string) {
  return `"${name.replaceAll('"', '""')}"`;
}

function toColumn(config: ModelConfig, field: string) {
  return config.fields[field] ?? field;
}

function toDbValue(value: any) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}

function fromRow(model: keyof typeof models, row: AnyRecord | null | undefined) {
  if (!row) return row;
  const config = models[model] as ModelConfig;
  const out: AnyRecord = {};
  for (const [field, column] of Object.entries(config.fields)) {
    out[field] = row[column];
  }
  for (const field of config.bools ?? []) out[field] = Boolean(out[field]);
  for (const field of config.dates ?? []) if (out[field] != null) out[field] = new Date(out[field]);
  return out;
}

function whereSql(model: keyof typeof models, where?: AnyRecord): { sql: string; values: any[] } {
  if (!where || Object.keys(where).length === 0) return { sql: "", values: [] };
  const config = models[model] as ModelConfig;
  const values: any[] = [];
  const parts: string[] = [];

  const add = (sql: string, vals: any[] = []) => {
    parts.push(sql);
    values.push(...vals);
  };

  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;
    if (key === "AND" && Array.isArray(value)) {
      const nested = value.map((v) => whereSql(model, v)).filter((v) => v.sql);
      if (nested.length) add(`(${nested.map((v) => v.sql).join(" AND ")})`, nested.flatMap((v) => v.values));
      continue;
    }
    if (key === "OR" && Array.isArray(value)) {
      const nested = value.map((v) => whereSql(model, v)).filter((v) => v.sql);
      if (nested.length) add(`(${nested.map((v) => v.sql).join(" OR ")})`, nested.flatMap((v) => v.values));
      continue;
    }
    if (model === "product" && key === "category") {
      const clause = relationWhere("Category", "c", value as AnyRecord, "c.id = products.productCategory");
      add(`EXISTS (${clause.sql})`, clause.values);
      continue;
    }
    if (model === "order" && key === "user") {
      const clause = relationWhere("User", "u", value as AnyRecord, "u.id = orders.userId");
      add(`EXISTS (${clause.sql})`, clause.values);
      continue;
    }
    if (model === "cart" && key === "user" && (value as AnyRecord).Order?.some) {
      add(`EXISTS (SELECT 1 FROM ${q(models.order.table)} o WHERE o.userId = carts.userId)`);
      continue;
    }
    if (model === "cartItem" && key === "cart") {
      const userId = (value as AnyRecord).userId;
      if (userId) add(`cartId IN (SELECT id FROM ${q(models.cart.table)} WHERE userId = ?)`, [userId]);
      continue;
    }

    const column = q(toColumn(config, key));
    if (value && typeof value === "object" && !(value instanceof Date) && !Array.isArray(value)) {
      if ("in" in value && Array.isArray(value.in)) {
        if (value.in.length === 0) add("1 = 0");
        else add(`${column} IN (${value.in.map(() => "?").join(", ")})`, value.in.map(toDbValue));
      } else if ("contains" in value) {
        add(`${column} LIKE ?`, [`%${value.contains}%`]);
      } else if ("not" in value) {
        value.not === null ? add(`${column} IS NOT NULL`) : add(`${column} <> ?`, [toDbValue(value.not)]);
      } else {
        if ("gte" in value) add(`${column} >= ?`, [toDbValue(value.gte)]);
        if ("lte" in value) add(`${column} <= ?`, [toDbValue(value.lte)]);
        if ("gt" in value) add(`${column} > ?`, [toDbValue(value.gt)]);
        if ("lt" in value) add(`${column} < ?`, [toDbValue(value.lt)]);
      }
    } else {
      value === null ? add(`${column} IS NULL`) : add(`${column} = ?`, [toDbValue(value)]);
    }
  }

  return parts.length ? { sql: parts.join(" AND "), values } : { sql: "", values: [] };
}

function relationWhere(table: string, alias: string, where: AnyRecord, join: string) {
  const values: any[] = [];
  const parts = [join];
  for (const [field, value] of Object.entries(where ?? {})) {
    if (field === "OR" && Array.isArray(value)) {
      const nested = value.map((v) => relationWhere(table, alias, v, join)).map((v) => {
        values.push(...v.values);
        return v.sql.replace(/^SELECT 1 FROM .*? WHERE /, "");
      });
      parts.push(`(${nested.join(" OR ")})`);
      continue;
    }
    if (value && typeof value === "object" && "contains" in value) {
      parts.push(`${alias}.${field} LIKE ?`);
      values.push(`%${value.contains}%`);
    } else {
      parts.push(`${alias}.${field} = ?`);
      values.push(toDbValue(value));
    }
  }
  return { sql: `SELECT 1 FROM ${q(table)} ${alias} WHERE ${parts.join(" AND ")}`, values };
}

function orderSql(model: keyof typeof models, orderBy?: AnyRecord | AnyRecord[]) {
  if (!orderBy) return "";
  const config = models[model] as ModelConfig;
  const items = Array.isArray(orderBy) ? orderBy : [orderBy];
  const parts = items.flatMap((item) =>
    Object.entries(item).map(([field, dir]) => `${q(toColumn(config, field))} ${String(dir).toUpperCase() === "DESC" ? "DESC" : "ASC"}`)
  );
  return parts.length ? ` ORDER BY ${parts.join(", ")}` : "";
}

async function hydrate(model: keyof typeof models, item: any, include?: AnyRecord): Promise<any> {
  if (!item || !include) return item;
  if (model === "product") {
    if (include.category) item.category = await db.category.findUnique({ where: { id: item.categoryId } });
    if (include.specifications) item.specifications = await db.specification.findMany({ where: { productId: item.id } });
    if (include.reviews) item.reviews = await db.review.findMany({ where: { productId: item.id }, include: { user: true } });
  }
  if (model === "category") {
    if (include.children) item.children = await db.category.findMany({ where: { parentId: item.id } });
    if (include.products) item.products = await db.product.findMany({ where: { categoryId: item.id }, include: include.products.include });
  }
  if (model === "review" && include.user) item.user = await db.user.findUnique({ where: { id: item.userId } });
  if (model === "cart" && include.items) item.items = await db.cartItem.findMany({ where: { cartId: item.id }, include: include.items.include });
  if (model === "cartItem" && include.product) item.product = await db.product.findUnique({ where: { id: item.productId } });
  if (model === "wishlist" && include.items) item.items = await db.wishlistItem.findMany({ where: { wishlistId: item.id }, include: { product: true } });
  if (model === "wishlistItem" && include.product) item.product = await db.product.findUnique({ where: { id: item.productId } });
  if (model === "order") {
    if (include.user) item.user = item.userId ? await db.user.findUnique({ where: { id: item.userId } }) : null;
    if (include.items) item.items = await db.orderItem.findMany({ where: { orderId: item.id }, include: include.items.include });
    if (include.payment) item.payment = await db.payment.findUnique({ where: { orderId: item.id } });
    if (include.shippingMethod) item.shippingMethod = item.shippingMethodId ? await db.shippingMethod.findUnique({ where: { id: item.shippingMethodId } }) : null;
    if (include.OrderTimelineEvent) item.OrderTimelineEvent = await db.orderTimelineEvent.findMany({ where: { orderId: item.id }, orderBy: include.OrderTimelineEvent.orderBy });
  }
  if (model === "orderItem" && include.product) item.product = item.productId ? await db.product.findUnique({ where: { id: item.productId } }) : null;
  if (model === "inventoryMovement") {
    if (include.product) item.product = item.productId ? await db.product.findUnique({ where: { id: item.productId } }) : null;
    if (include.batch) item.batch = item.batchId ? await db.inventoryBatch.findUnique({ where: { id: item.batchId } }) : null;
  }
  if (model === "inventoryBatch" && include.product) item.product = item.productId ? await db.product.findUnique({ where: { id: item.productId } }) : null;
  return item;
}

function modelClient(model: keyof typeof models): ModelClient {
  const config = models[model] as ModelConfig;

  return {
    async findMany(args: AnyRecord = {}) {
      const where = whereSql(model, args.where);
      const sql = `SELECT * FROM ${q(config.table)}${where.sql ? ` WHERE ${where.sql}` : ""}${orderSql(model, args.orderBy)}${args.take ? ` LIMIT ${Number(args.take)}` : ""}${args.skip ? ` OFFSET ${Number(args.skip)}` : ""}`;
      const { results } = await getDb().prepare(sql).bind(...where.values).all();
      const rows = (results ?? []).map((row) => fromRow(model, row));
      return Promise.all(rows.map((row) => hydrate(model, row, args.include)));
    },
    async findUnique(args: AnyRecord) {
      if (model === "wishlistItem" && args.where?.wishlistId_productId) {
        return this.findFirst({ where: args.where.wishlistId_productId, include: args.include });
      }
      return this.findFirst({ where: args.where, include: args.include });
    },
    async findFirst(args: AnyRecord = {}) {
      const rows = await this.findMany({ ...args, take: 1 });
      return rows[0] ?? null;
    },
    async count(args: AnyRecord = {}) {
      const where = whereSql(model, args.where);
      const row = await getDb().prepare(`SELECT COUNT(*) as count FROM ${q(config.table)}${where.sql ? ` WHERE ${where.sql}` : ""}`).bind(...where.values).first<{ count: number }>();
      return Number(row?.count ?? 0);
    },
    async aggregate(args: AnyRecord = {}) {
      const where = whereSql(model, args.where);
      const sums = Object.keys(args._sum ?? {});
      const select = sums.length ? sums.map((field) => `SUM(${q(toColumn(config, field))}) as ${q(field)}`).join(", ") : "COUNT(*) as count";
      const row = await getDb().prepare(`SELECT ${select} FROM ${q(config.table)}${where.sql ? ` WHERE ${where.sql}` : ""}`).bind(...where.values).first<AnyRecord>();
      return { _sum: Object.fromEntries(sums.map((field) => [field, Number(row?.[field] ?? 0)])) };
    },
    async groupBy(args: AnyRecord) {
      const fields = args.by as string[];
      const where = whereSql(model, args.where);
      const select = [...fields.map((f) => q(toColumn(config, f)))];
      if (args._sum) for (const f of Object.keys(args._sum)) select.push(`SUM(${q(toColumn(config, f))}) as ${q(`sum_${f}`)}`);
      if (args._count) for (const f of Object.keys(args._count)) select.push(`COUNT(${q(toColumn(config, f))}) as ${q(`count_${f}`)}`);
      const sql = `SELECT ${select.join(", ")} FROM ${q(config.table)}${where.sql ? ` WHERE ${where.sql}` : ""} GROUP BY ${fields.map((f) => q(toColumn(config, f))).join(", ")}`;
      const { results } = await getDb().prepare(sql).bind(...where.values).all<AnyRecord>();
      return (results ?? []).map((row) => ({
        ...fromRow(model, row),
        _sum: Object.fromEntries(Object.keys(args._sum ?? {}).map((f) => [f, Number(row[`sum_${f}`] ?? 0)])),
        _count: Object.fromEntries(Object.keys(args._count ?? {}).map((f) => [f, Number(row[`count_${f}`] ?? 0)])),
      }));
    },
    async create(args: AnyRecord) {
      const data = await normalizeCreate(model, args.data ?? {});
      const fields = Object.keys(data);
      await getDb().prepare(`INSERT INTO ${q(config.table)} (${fields.map((f) => q(toColumn(config, f))).join(", ")}) VALUES (${fields.map(() => "?").join(", ")})`).bind(...fields.map((f) => toDbValue(data[f]))).run();
      const created = await this.findUnique({ where: model === "siteSetting" ? { key: data.key } : { id: data.id }, include: args.include });
      if (!created) return null;
      await afterCreate(model, created, args.data ?? {});
      return args.include ? this.findUnique({ where: model === "siteSetting" ? { key: data.key } : { id: data.id }, include: args.include }) : created;
    },
    async createMany(args: AnyRecord) {
      for (const data of args.data ?? []) await this.create({ data });
      return { count: args.data?.length ?? 0 };
    },
    async update(args: AnyRecord) {
      if (args.data?.specifications?.deleteMany) await db.specification.deleteMany({ where: { productId: args.where.id } });
      if (model === "product" && args.data?.stock?.decrement != null) {
        const where = whereSql(model, args.where);
        await getDb()
          .prepare(`UPDATE ${q(config.table)} SET ${q(toColumn(config, "stock"))} = MAX(0, ${q(toColumn(config, "stock"))} - ?), ${q(toColumn(config, "updatedAt"))} = ?${where.sql ? ` WHERE ${where.sql}` : ""}`)
          .bind(Number(args.data.stock.decrement), new Date().toISOString(), ...where.values)
          .run();
        return this.findUnique({ where: args.where, include: args.include });
      }
      if (model === "product" && args.data?.stock?.increment != null) {
        const where = whereSql(model, args.where);
        await getDb()
          .prepare(`UPDATE ${q(config.table)} SET ${q(toColumn(config, "stock"))} = ${q(toColumn(config, "stock"))} + ?, ${q(toColumn(config, "updatedAt"))} = ?${where.sql ? ` WHERE ${where.sql}` : ""}`)
          .bind(Number(args.data.stock.increment), new Date().toISOString(), ...where.values)
          .run();
        return this.findUnique({ where: args.where, include: args.include });
      }
      const data = await normalizeUpdate(model, args.data ?? {});
      const fields = Object.keys(data);
      if (fields.length) {
        const where = whereSql(model, args.where);
        await getDb().prepare(`UPDATE ${q(config.table)} SET ${fields.map((f) => `${q(toColumn(config, f))} = ?`).join(", ")}${where.sql ? ` WHERE ${where.sql}` : ""}`).bind(...fields.map((f) => toDbValue(data[f])), ...where.values).run();
      }
      const updated = await this.findUnique({ where: args.where, include: args.include });
      if (model === "product" && args.data?.specifications?.create) {
        await db.specification.createMany({ data: args.data.specifications.create.map((s: AnyRecord) => ({ ...s, productId: args.where.id })) });
        return this.findUnique({ where: args.where, include: args.include });
      }
      return updated;
    },
    async upsert(args: AnyRecord) {
      const found = await this.findUnique({ where: args.where });
      return found ? this.update({ where: args.where, data: args.update }) : this.create({ data: { ...args.create, ...args.where } });
    },
    async delete(args: AnyRecord) {
      const existing = await this.findUnique({ where: args.where });
      const where = whereSql(model, args.where);
      await getDb().prepare(`DELETE FROM ${q(config.table)}${where.sql ? ` WHERE ${where.sql}` : ""}`).bind(...where.values).run();
      return existing;
    },
    async deleteMany(args: AnyRecord = {}) {
      const where = whereSql(model, args.where);
      await getDb().prepare(`DELETE FROM ${q(config.table)}${where.sql ? ` WHERE ${where.sql}` : ""}`).bind(...where.values).run();
      return { count: 0 };
    },
  };
}

async function normalizeCreate(model: keyof typeof models, data: AnyRecord) {
  const now = new Date();
  const out: AnyRecord = { ...data };
  if (model !== "siteSetting") out.id ??= cuid();
  if ("createdAt" in models[model].fields) out.createdAt ??= now;
  if ("updatedAt" in models[model].fields) out.updatedAt ??= now;
  if (model === "product") {
    const categoryValue = data.category?.connect?.value;
    if (categoryValue) {
      const category = await db.category.findUnique({ where: { value: categoryValue } });
      out.categoryId = category?.id;
    }
    delete out.category;
    delete out.specifications;
  }
  if (model === "order") {
    delete out.items;
    delete out.payment;
    if (out.userId === undefined) out.userId = null;
  }
  return stripUnknown(model, out);
}

async function afterCreate(model: keyof typeof models, created: AnyRecord, data: AnyRecord) {
  if (model === "product" && data.specifications?.create) {
    await db.specification.createMany({ data: data.specifications.create.map((s: AnyRecord) => ({ ...s, productId: created.id })) });
  }
  if (model === "order") {
    if (data.items?.create) await db.orderItem.createMany({ data: data.items.create.map((i: AnyRecord) => ({ ...i, orderId: created.id })) });
    if (data.payment?.create) await db.payment.create({ data: { ...data.payment.create, orderId: created.id } });
  }
}

async function normalizeUpdate(model: keyof typeof models, data: AnyRecord) {
  const out: AnyRecord = { ...data };
  if ("updatedAt" in models[model].fields) out.updatedAt = new Date();
  if (model === "product") {
    const categoryValue = data.category?.connect?.value;
    if (categoryValue) {
      const category = await db.category.findUnique({ where: { value: categoryValue } });
      out.categoryId = category?.id;
    }
    delete out.category;
    delete out.specifications;
  }
  return stripUnknown(model, out);
}

function stripUnknown(model: keyof typeof models, data: AnyRecord) {
  return Object.fromEntries(Object.entries(data).filter(([key]) => key in models[model].fields));
}

async function templateQuery(strings: TemplateStringsArray, values: any[], write = false) {
  const sql = strings.reduce((acc, part, index) => acc + part + (index < values.length ? "?" : ""), "");
  const stmt = getDb().prepare(sql).bind(...values.map(toDbValue));
  if (write) return stmt.run();
  const { results } = await stmt.all();
  return results ?? [];
}

const db = {
  user: modelClient("user"),
  product: modelClient("product"),
  inventoryBatch: modelClient("inventoryBatch"),
  inventoryMovement: modelClient("inventoryMovement"),
  campaign: modelClient("campaign"),
  review: modelClient("review"),
  specification: modelClient("specification"),
  category: modelClient("category"),
  orderTimelineEvent: modelClient("orderTimelineEvent"),
  order: modelClient("order"),
  orderItem: modelClient("orderItem"),
  payment: modelClient("payment"),
  shippingMethod: modelClient("shippingMethod"),
  cart: modelClient("cart"),
  cartItem: modelClient("cartItem"),
  testimonial: modelClient("testimonial"),
  wishlist: modelClient("wishlist"),
  wishlistItem: modelClient("wishlistItem"),
  oTPVerification: modelClient("oTPVerification"),
  siteSetting: modelClient("siteSetting"),
  $transaction(actions: Array<Promise<any>>): Promise<any[]> {
    return Promise.all(actions);
  },
  $queryRaw<T = AnyRecord[]>(strings: TemplateStringsArray, ...values: any[]): Promise<T> {
    return templateQuery(strings, values) as Promise<T>;
  },
  $executeRaw(strings: TemplateStringsArray, ...values: any[]) {
    return templateQuery(strings, values, true);
  },
  $disconnect() {
    return Promise.resolve();
  },
};

export default db;
