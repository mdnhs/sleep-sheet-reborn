import "dotenv/config";
import { db } from "../db";
import { products, categories, specifications } from "../db/schema";
import { eq } from "drizzle-orm";

type ProductSeed = {
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  variants: string[];
  tags: string[];
  images: string[];
  sizes: string[];
  features: string[];
  careInstruction?: string;
  categoryValue: string;
  isFeatured?: boolean;
  specifications: { key: string; value: string }[];
};

const productsData: ProductSeed[] = [
  {
    sku: "WATCH-CLASSIC-001",
    name: "Classic Leather Watch",
    description:
      "Timeless analog watch with genuine leather strap and stainless steel case.",
    price: 189.99,
    stock: 45,
    variants: ["Black/Silver", "Brown/Gold"],
    tags: ["watch", "accessory", "leather"],
    images: [
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=800",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800",
    ],
    sizes: ["38mm", "42mm"],
    features: [
      "Sapphire crystal",
      "Water resistant 50m",
      "Swiss quartz movement",
    ],
    careInstruction: "Wipe with soft cloth. Avoid prolonged water exposure.",
    categoryValue: "clothing",
    isFeatured: true,
    specifications: [
      { key: "Material", value: "Stainless Steel" },
      { key: "Movement", value: "Quartz" },
      { key: "Warranty", value: "2 years" },
    ],
  },
  {
    sku: "TEE-COTTON-WHT",
    name: "Premium Cotton Tee",
    description:
      "Soft 100% organic cotton t-shirt with a relaxed fit and reinforced collar.",
    price: 32.0,
    stock: 200,
    variants: ["White", "Black", "Navy"],
    tags: ["clothing", "tshirt", "cotton"],
    images: [
      "https://images.unsplash.com/photo-1618354691438-25bc04584c23?q=80&w=800",
    ],
    sizes: ["S", "M", "L", "XL"],
    features: ["Organic cotton", "Pre-shrunk", "Reinforced seams"],
    careInstruction: "Machine wash cold. Tumble dry low.",
    categoryValue: "clothing",
    isFeatured: true,
    specifications: [
      { key: "Material", value: "100% Organic Cotton" },
      { key: "Fit", value: "Regular" },
    ],
  },
  {
    sku: "HEADPHONE-OVR-001",
    name: "Wireless Over-Ear Headphones",
    description:
      "Active noise-cancelling headphones with 40-hour battery and plush memory-foam ear cups.",
    price: 249.0,
    stock: 75,
    variants: ["Matte Black", "Silver"],
    tags: ["audio", "headphones", "wireless"],
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800",
    ],
    sizes: [],
    features: [
      "Active noise cancelling",
      "40h battery",
      "Bluetooth 5.3",
      "USB-C fast charge",
    ],
    categoryValue: "electronics",
    isFeatured: true,
    specifications: [
      { key: "Driver", value: "40mm dynamic" },
      { key: "Battery", value: "40 hours" },
      { key: "Weight", value: "260g" },
    ],
  },
  {
    sku: "PHONE-FLAG-256",
    name: "Flagship Smartphone 256GB",
    description:
      "6.7-inch OLED display, triple camera, and all-day battery in a glass-and-titanium frame.",
    price: 1099.0,
    stock: 30,
    variants: ["Graphite", "Pearl"],
    tags: ["phone", "smartphone", "5g"],
    images: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800",
    ],
    sizes: [],
    features: ["6.7\" OLED 120Hz", "5G", "IP68", "Triple 50MP camera"],
    categoryValue: "electronics",
    specifications: [
      { key: "Storage", value: "256GB" },
      { key: "RAM", value: "12GB" },
      { key: "Battery", value: "4500mAh" },
    ],
  },
  {
    sku: "SNEAKER-RUN-001",
    name: "Performance Running Sneakers",
    description:
      "Lightweight running shoes with responsive foam midsole and breathable knit upper.",
    price: 129.99,
    stock: 120,
    variants: ["Black/White", "Blue/Volt"],
    tags: ["shoes", "running", "sneakers"],
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800",
    ],
    sizes: ["8", "9", "10", "11", "12"],
    features: ["Responsive foam", "Breathable knit upper", "Rubber outsole"],
    careInstruction: "Spot clean. Air dry only.",
    categoryValue: "footwear",
    isFeatured: true,
    specifications: [
      { key: "Drop", value: "8mm" },
      { key: "Weight", value: "265g" },
    ],
  },
  {
    sku: "BOOT-LEATHER-001",
    name: "Heritage Leather Boots",
    description:
      "Hand-crafted full-grain leather boots with Goodyear-welt construction.",
    price: 289.0,
    stock: 60,
    variants: ["Tan", "Dark Brown"],
    tags: ["shoes", "boots", "leather"],
    images: [
      "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=800",
    ],
    sizes: ["8", "9", "10", "11", "12"],
    features: ["Full-grain leather", "Goodyear welt", "Resoleable"],
    careInstruction: "Condition with leather cream every 3 months.",
    categoryValue: "footwear",
    specifications: [
      { key: "Construction", value: "Goodyear welt" },
      { key: "Sole", value: "Vibram rubber" },
    ],
  },
  {
    sku: "BOOK-DESIGN-001",
    name: "The Design of Everyday Things",
    description:
      "Don Norman's classic on user-centered design — revised and expanded edition.",
    price: 18.95,
    stock: 150,
    variants: [],
    tags: ["book", "design", "ux"],
    images: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800",
    ],
    sizes: [],
    features: ["Paperback", "368 pages", "Revised edition"],
    categoryValue: "books",
    specifications: [
      { key: "Author", value: "Don Norman" },
      { key: "Pages", value: "368" },
      { key: "ISBN", value: "978-0465050659" },
    ],
  },
  {
    sku: "BOOK-FICTION-001",
    name: "Project Hail Mary",
    description:
      "Andy Weir's gripping sci-fi adventure about a lone astronaut and a desperate mission.",
    price: 16.5,
    stock: 90,
    variants: [],
    tags: ["book", "fiction", "scifi"],
    images: [
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800",
    ],
    sizes: [],
    features: ["Hardcover", "496 pages"],
    categoryValue: "books",
    specifications: [
      { key: "Author", value: "Andy Weir" },
      { key: "Pages", value: "496" },
    ],
  },
  {
    sku: "BLENDER-PRO-001",
    name: "Pro Series Blender",
    description:
      "1500W high-performance blender with stainless-steel blades and 64oz pitcher.",
    price: 299.0,
    stock: 40,
    variants: ["Black", "Silver"],
    tags: ["kitchen", "blender", "appliance"],
    images: [
      "https://images.unsplash.com/photo-1570222094114-d054a817e56b?q=80&w=800",
    ],
    sizes: [],
    features: ["1500W motor", "10 speeds", "Pulse mode", "BPA-free pitcher"],
    careInstruction: "Pitcher dishwasher safe. Wipe base with damp cloth.",
    categoryValue: "home-appliances",
    specifications: [
      { key: "Power", value: "1500W" },
      { key: "Capacity", value: "64oz" },
      { key: "Warranty", value: "5 years" },
    ],
  },
  {
    sku: "VACUUM-ROBOT-001",
    name: "Smart Robot Vacuum",
    description:
      "App-controlled robot vacuum with LIDAR mapping and self-emptying base.",
    price: 449.0,
    stock: 25,
    variants: ["White"],
    tags: ["home", "vacuum", "smart"],
    images: [
      "https://images.unsplash.com/photo-1589006953912-1b6f3f8c40e6?q=80&w=800",
    ],
    sizes: [],
    features: [
      "LIDAR mapping",
      "Self-emptying base",
      "App + voice control",
      "150min runtime",
    ],
    categoryValue: "home-appliances",
    isFeatured: true,
    specifications: [
      { key: "Suction", value: "5000Pa" },
      { key: "Battery", value: "5200mAh" },
      { key: "Bin", value: "Self-empty 60 days" },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding products...");
  for (const p of productsData) {
    const category = await db.query.categories.findFirst({
      where: eq(categories.value, p.categoryValue),
    });
    if (!category) {
      console.warn(`Skipping ${p.sku} — category "${p.categoryValue}" missing`);
      continue;
    }

    const existingProduct = await db.query.products.findFirst({
      where: eq(products.sku, p.sku)
    });

    if (existingProduct) {
      await db.update(products)
        .set({
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          variants: p.variants,
          tags: p.tags,
          images: p.images,
          sizes: p.sizes,
          features: p.features,
          careInstruction: p.careInstruction || null,
          isFeatured: p.isFeatured ?? false,
          categoryId: category.id,
          updatedAt: new Date(),
        })
        .where(eq(products.id, existingProduct.id));

      await db.delete(specifications).where(eq(specifications.productId, existingProduct.id));
      if (p.specifications.length > 0) {
        await db.insert(specifications).values(
          p.specifications.map(s => ({
            key: s.key,
            value: s.value,
            productId: existingProduct.id
          }))
        );
      }
      console.log(`Updated product: ${p.name}`);
    } else {
      const [newProduct] = await db.insert(products).values({
        sku: p.sku,
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        variants: p.variants,
        tags: p.tags,
        images: p.images,
        sizes: p.sizes,
        features: p.features,
        careInstruction: p.careInstruction || null,
        isFeatured: p.isFeatured ?? false,
        categoryId: category.id,
      }).returning();

      if (p.specifications.length > 0) {
        await db.insert(specifications).values(
          p.specifications.map(s => ({
            key: s.key,
            value: s.value,
            productId: newProduct.id
          }))
        );
      }
      console.log(`Inserted product: ${p.name}`);
    }
  }

  console.log(`✅ Seeded ${productsData.length} products.`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding products:", e);
    process.exit(1);
  });
