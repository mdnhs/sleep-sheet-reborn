import "dotenv/config";
import db from "../lib/db";

async function main() {
  await db.siteSetting.upsert({
    where: { key: "shipping_inside_dhaka" },
    update: {},
    create: { key: "shipping_inside_dhaka", value: "60" },
  });
  await db.siteSetting.upsert({
    where: { key: "shipping_outside_dhaka" },
    update: {},
    create: { key: "shipping_outside_dhaka", value: "120" },
  });
  console.log("Settings seeded.");
}

main().catch(console.error).finally(() => db.$disconnect());
