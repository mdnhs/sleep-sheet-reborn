import "dotenv/config";
import { db } from "../db";
import { users } from "../db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
  const email = "mdnhs.cse@gmail.com";
  const rawPassword = "admin"; // Let's use 'admin' for simplicity, or we can use 'So1421997@@'
  const hash = await bcrypt.hash("So1421997@@", 10);
  
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    await db.update(users).set({ password: hash, role: "ADMIN" }).where(eq(users.email, email));
    console.log("Updated existing admin user.");
  } else {
    await db.insert(users).values({
      name: "Admin",
      email: email,
      password: hash,
      role: "ADMIN"
    });
    console.log("Created new admin user.");
  }
}

main().catch(console.error).finally(() => process.exit(0));
