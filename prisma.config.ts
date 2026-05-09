import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";
import { PrismaNeon } from "@prisma/adapter-neon";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  // @ts-expect-error adapter not in PrismaConfig types yet
  adapter: async () =>
    new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});
