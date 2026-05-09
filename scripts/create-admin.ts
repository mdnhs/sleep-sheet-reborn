import "dotenv/config";
import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const hash = await bcrypt.hash("So1421997@@", 10);
  const u = await prisma.user.upsert({
    where: { email: "mdnhs.cse@gmail.com" },
    update: { role: "ADMIN", password: hash },
    create: {
      name: "Admin",
      email: "mdnhs.cse@gmail.com",
      password: hash,
      role: "ADMIN",
    },
  });
  console.log("Done:", u.email, u.role);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
