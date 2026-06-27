import { neon } from "@neondatabase/serverless";

const connectionString = "postgresql://neondb_owner:npg_Cztp1roeT7VR@ep-lively-salad-ao03qn3f-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(connectionString);

// Create enum type (ignore if already exists)
try {
  await sql`CREATE TYPE "SaleType" AS ENUM ('POS', 'WEBSITE')`;
} catch (e) {
  if (!e.message?.includes('already exists')) throw e;
}

// Add column
await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "saleType" "SaleType" DEFAULT 'WEBSITE' NOT NULL`;
console.log("Done");
