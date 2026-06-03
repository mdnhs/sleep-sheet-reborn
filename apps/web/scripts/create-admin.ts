import "dotenv/config";
import db from "../lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const hash = await bcrypt.hash("So1421997@@", 10);
  const u = await db.user.upsert({
    where: { email: "mdnhs.cse@gmail.com" },
    update: { role: "ADMIN", password: hash },
    create: {
      name: "Admin",
      email: "mdnhs.cse@gmail.com",
      password: hash,
      role: "ADMIN",
    },
  });
  if (!u) throw new Error("Failed to create admin user");
  console.log("Done:", u.email, u.role);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
