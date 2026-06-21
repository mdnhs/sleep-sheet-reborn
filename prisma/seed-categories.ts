import 'dotenv/config';
import { db } from '../db';
import { categories } from '../db/schema';
import { eq } from 'drizzle-orm';
import cuid from 'cuid';

const categoriesData = [
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "home-appliances", label: "Home Appliances" },
  { value: "books", label: "Books" },
  { value: "footwear", label: "Footwear" },
];

async function main() {
  console.log("🌱 Seeding categories...");
  for (const cat of categoriesData) {
    const existing = await db.query.categories.findFirst({
      where: eq(categories.value, cat.value)
    });
    if (!existing) {
      await db.insert(categories).values({
        id: cuid(),
        label: cat.label,
        value: cat.value,
      });
      console.log(`Inserted category: ${cat.label}`);
    } else {
      console.log(`Category already exists: ${cat.label}`);
    }
  }
  console.log("✅ Categories seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Error inserting categories:", e);
    process.exit(1);
  });
