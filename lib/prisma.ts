import { PrismaClient } from "../generated/prisma";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";

// D1 bindings only exist per-request inside the Worker, so we cannot create a
// single module-level PrismaClient like with Neon. Instead we build one client
// per D1 binding and cache it on a WeakMap keyed by the binding object (the
// binding is stable for the lifetime of an isolate).

const clientCache = new WeakMap<object, PrismaClient>();

function buildClient(db: D1Database): PrismaClient {
  const cached = clientCache.get(db as unknown as object);
  if (cached) return cached;
  const adapter = new PrismaD1(db);
  const client = new PrismaClient({ adapter });
  clientCache.set(db as unknown as object, client);
  return client;
}

function getClient(): PrismaClient {
  const { env } = getCloudflareContext();
  const db = (env as { DB?: D1Database }).DB;
  if (!db) {
    throw new Error(
      "D1 binding `DB` not found. Check wrangler.jsonc d1_databases and that getCloudflareContext() runs in request scope."
    );
  }
  return buildClient(db);
}

// Proxy so existing `import prisma from "@/lib/prisma"; prisma.product.findMany()`
// call sites keep working unchanged — the real client is resolved lazily, at
// request time, when a property is first accessed.
const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as PrismaClient;

export default prisma;
