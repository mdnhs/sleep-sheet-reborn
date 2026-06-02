import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Cloudflare D1 (SQLite). Migrations are generated as SQL with
// `prisma migrate diff` and applied to D1 via `wrangler d1 migrations apply`.
// A local SQLite file is used only for CLI operations / local prototyping.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./prisma/local.db",
  },
});
