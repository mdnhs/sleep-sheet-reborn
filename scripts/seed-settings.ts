import "dotenv/config";
import prisma from "../lib/prisma";

async function main() {
  await prisma.siteSetting.upsert({
    where: { key: "shipping_inside_dhaka" },
    update: {},
    create: { key: "shipping_inside_dhaka", value: "60" },
  });
  await prisma.siteSetting.upsert({
    where: { key: "shipping_outside_dhaka" },
    update: {},
    create: { key: "shipping_outside_dhaka", value: "120" },
  });
  console.log("Settings seeded.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
