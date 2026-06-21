import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../db";
import {
  Role,
  CampaignStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  TestimonialUserRole,
  categories,
  products,
  users,
  shippingMethods as dbShippingMethods,
  siteSettings,
  reviews,
  carts,
  cartItems,
  wishlists,
  wishlistItems,
  orders,
  orderItems,
  payments,
  orderTimelineEvents,
  campaigns,
  testimonials,
  specifications,
} from "../db/schema";
import { eq, inArray, count, sql } from "drizzle-orm";

const adminEmail = process.env.DEMO_ADMIN_EMAIL || "admin@demo.com";
const adminPassword = process.env.DEMO_ADMIN_PASSWORD || "Admin123!";

const categoriesData = [
  { id: "demo-category-electronics", value: "electronics", label: "Electronics" },
  { id: "demo-category-clothing", value: "clothing", label: "Clothing" },
  { id: "demo-category-home", value: "home-appliances", label: "Home Appliances" },
  { id: "demo-category-books", value: "books", label: "Books" },
  { id: "demo-category-footwear", value: "footwear", label: "Footwear" },
];

type DemoProduct = {
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
  isFeatured: boolean;
  specifications: { key: string; value: string }[];
};

const productsData: DemoProduct[] = [
  {
    sku: "DEMO-HEADPHONE-001",
    name: "Wireless Noise-Cancelling Headphones",
    description: "Comfortable over-ear headphones with rich sound and 40-hour battery life.",
    price: 8490,
    stock: 42,
    variants: ["Matte Black", "Silver"],
    tags: ["audio", "wireless", "featured"],
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200"],
    sizes: [],
    features: ["Active noise cancellation", "40-hour battery", "Bluetooth 5.3"],
    categoryValue: "electronics",
    isFeatured: true,
    specifications: [
      { key: "Driver", value: "40mm" },
      { key: "Charging", value: "USB-C" },
    ],
  },
  {
    sku: "DEMO-WATCH-001",
    name: "Active Smart Watch",
    description: "A lightweight smart watch for fitness, calls, and everyday notifications.",
    price: 5990,
    stock: 36,
    variants: ["Midnight", "Sand"],
    tags: ["wearable", "fitness", "smart-watch"],
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200"],
    sizes: ["40mm", "44mm"],
    features: ["AMOLED display", "Heart-rate tracking", "5-day battery"],
    categoryValue: "electronics",
    isFeatured: true,
    specifications: [
      { key: "Water resistance", value: "5 ATM" },
      { key: "Connectivity", value: "Bluetooth 5.2" },
    ],
  },
  {
    sku: "DEMO-TEE-001",
    name: "Premium Cotton T-Shirt",
    description: "Soft, breathable cotton t-shirt with a relaxed everyday fit.",
    price: 1290,
    stock: 120,
    variants: ["Black", "White", "Navy"],
    tags: ["cotton", "casual", "unisex"],
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200"],
    sizes: ["S", "M", "L", "XL"],
    features: ["100% cotton", "Pre-shrunk", "Regular fit"],
    careInstruction: "Machine wash cold with similar colors.",
    categoryValue: "clothing",
    isFeatured: true,
    specifications: [{ key: "Material", value: "100% Cotton" }],
  },
  {
    sku: "DEMO-HOODIE-001",
    name: "Essential Zip Hoodie",
    description: "Midweight fleece hoodie with a clean silhouette and durable metal zip.",
    price: 2790,
    stock: 64,
    variants: ["Charcoal", "Olive"],
    tags: ["hoodie", "fleece", "casual"],
    images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1200"],
    sizes: ["S", "M", "L", "XL"],
    features: ["Brushed fleece", "Metal zip", "Kangaroo pockets"],
    careInstruction: "Wash inside out. Do not bleach.",
    categoryValue: "clothing",
    isFeatured: false,
    specifications: [{ key: "Fabric", value: "Cotton blend" }],
  },
  {
    sku: "DEMO-SHOE-001",
    name: "Performance Running Shoes",
    description: "Responsive running shoes with a breathable upper and cushioned midsole.",
    price: 4490,
    stock: 75,
    variants: ["Black/White", "Blue/Lime"],
    tags: ["running", "sports", "shoes"],
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200"],
    sizes: ["39", "40", "41", "42", "43"],
    features: ["Breathable knit", "Foam cushioning", "Rubber outsole"],
    careInstruction: "Spot clean and air dry.",
    categoryValue: "footwear",
    isFeatured: true,
    specifications: [
      { key: "Weight", value: "265g" },
      { key: "Drop", value: "8mm" },
    ],
  },
  {
    sku: "DEMO-BLENDER-001",
    name: "High-Speed Kitchen Blender",
    description: "Powerful countertop blender for smoothies, sauces, and crushed ice.",
    price: 6990,
    stock: 24,
    variants: ["Black", "Silver"],
    tags: ["kitchen", "appliance", "blender"],
    images: ["https://images.unsplash.com/photo-1570222094114-d054a817e56b?q=80&w=1200"],
    sizes: [],
    features: ["1500W motor", "10 speeds", "BPA-free pitcher"],
    careInstruction: "Pitcher is dishwasher safe. Wipe the base clean.",
    categoryValue: "home-appliances",
    isFeatured: true,
    specifications: [
      { key: "Power", value: "1500W" },
      { key: "Capacity", value: "1.8L" },
    ],
  },
  {
    sku: "DEMO-LAMP-001",
    name: "Minimal Desk Lamp",
    description: "Adjustable LED desk lamp with warm and cool light modes.",
    price: 2190,
    stock: 51,
    variants: ["Black", "White"],
    tags: ["lighting", "desk", "home"],
    images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1200"],
    sizes: [],
    features: ["Dimmable LED", "Three color modes", "USB-C powered"],
    categoryValue: "home-appliances",
    isFeatured: false,
    specifications: [{ key: "Power", value: "12W" }],
  },
  {
    sku: "DEMO-BOOK-001",
    name: "The Design of Everyday Things",
    description: "A practical introduction to human-centered product and interaction design.",
    price: 990,
    stock: 90,
    variants: ["Paperback"],
    tags: ["design", "ux", "book"],
    images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1200"],
    sizes: [],
    features: ["Revised edition", "Paperback", "Illustrated"],
    categoryValue: "books",
    isFeatured: false,
    specifications: [
      { key: "Author", value: "Don Norman" },
      { key: "Language", value: "English" },
    ],
  },
];

const shippingMethods = [
  { id: "demo-shipping-dhaka", name: "Inside Dhaka", cost: 80, duration: "1-2 business days" },
  { id: "demo-shipping-outside", name: "Outside Dhaka", cost: 150, duration: "2-4 business days" },
  { id: "demo-shipping-express", name: "Express Delivery", cost: 250, duration: "Same or next day" },
];

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

async function seedCategories() {
  for (const cat of categoriesData) {
    const existing = await db.query.categories.findFirst({
      where: eq(categories.value, cat.value)
    });
    if (existing) {
      await db.update(categories)
        .set({ label: cat.label })
        .where(eq(categories.id, cat.id));
    } else {
      await db.insert(categories).values(cat);
    }
  }
}

async function seedProducts() {
  const categoryRows = await db.query.categories.findMany({
    where: inArray(categories.value, categoriesData.map((c) => c.value)),
  });
  const categoryByValue = new Map(categoryRows.map((c) => [c.value, c]));

  for (const product of productsData) {
    const category = categoryByValue.get(product.categoryValue);
    if (!category) throw new Error(`Missing category: ${product.categoryValue}`);

    const existingProduct = await db.query.products.findFirst({
      where: eq(products.sku, product.sku)
    });

    const productValues = {
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      variants: product.variants,
      tags: product.tags,
      images: product.images,
      sizes: product.sizes,
      features: product.features,
      careInstruction: product.careInstruction || null,
      categoryId: category.id,
      isFeatured: product.isFeatured,
      updatedAt: new Date(),
    };

    if (existingProduct) {
      await db.update(products).set(productValues).where(eq(products.id, existingProduct.id));
      await db.delete(specifications).where(eq(specifications.productId, existingProduct.id));
      if (product.specifications.length > 0) {
        await db.insert(specifications).values(
          product.specifications.map(s => ({
            key: s.key,
            value: s.value,
            productId: existingProduct.id
          }))
        );
      }
    } else {
      const [newProduct] = await db.insert(products).values(productValues).returning();
      if (product.specifications.length > 0) {
        await db.insert(specifications).values(
          product.specifications.map(s => ({
            key: s.key,
            value: s.value,
            productId: newProduct.id
          }))
        );
      }
    }
  }
}

async function seedUsers() {
  const password = await bcrypt.hash(adminPassword, 10);
  const usersData = [
    { name: "Demo Administrator", email: adminEmail, role: Role.ADMIN, phone: "01700000001", address: "Dhanmondi, Dhaka" },
    { name: "Demo Moderator", email: "moderator@demo.com", role: Role.MODERATOR, phone: "01700000002", address: "Banani, Dhaka" },
    { name: "Demo Customer", email: "customer@demo.com", role: Role.USER, phone: "01700000003", address: "Uttara, Dhaka" },
  ];

  for (const u of usersData) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, u.email)
    });
    if (existing) {
      await db.update(users).set({ ...u, password }).where(eq(users.id, existing.id));
    } else {
      await db.insert(users).values({ ...u, password });
    }
  }
}

async function seedStoreData() {
  for (const method of shippingMethods) {
    const existing = await db.query.shippingMethods.findFirst({
      where: eq(dbShippingMethods.id, method.id)
    });
    if (existing) {
      await db.update(dbShippingMethods).set({ ...method, active: true }).where(eq(dbShippingMethods.id, method.id));
    } else {
      await db.insert(dbShippingMethods).values({ ...method, active: true });
    }
  }

  const settings = {
    shipping_inside_dhaka: "80",
    shipping_outside_dhaka: "150",
    currency: "BDT",
    payment_method_card: "true",
    payment_method_cod: "true",
  };

  for (const [key, value] of Object.entries(settings)) {
    await db.insert(siteSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: new Date() }
      });
  }
}

async function seedCustomerData() {
  const customer = await db.query.users.findFirst({ where: eq(users.email, "customer@demo.com") });
  if (!customer) throw new Error("Customer user not found");

  const productRows = await db.query.products.findMany({
    where: sql`${products.sku} LIKE 'DEMO-%'`,
  });
  const productBySku = new Map(productRows.map((product) => [product.sku, product]));

  for (const [index, product] of productRows.slice(0, 4).entries()) {
    const reviewId = `demo-review-${index + 1}`;
    const existing = await db.query.reviews.findFirst({ where: eq(reviews.id, reviewId) });
    const reviewValues = {
      rating: index % 3 === 0 ? 4 : 5,
      comment: index % 2 === 0 ? "Excellent quality and fast delivery." : "Good value and exactly as described.",
      userId: customer.id,
      productId: product.id,
      updatedAt: new Date(),
    };

    if (existing) {
      await db.update(reviews).set(reviewValues).where(eq(reviews.id, reviewId));
    } else {
      await db.insert(reviews).values({ id: reviewId, ...reviewValues });
    }
  }

  const cartProducts = ["DEMO-TEE-001", "DEMO-BOOK-001"].map((sku) => productBySku.get(sku)!);
  let cartObj = await db.query.carts.findFirst({ where: eq(carts.userId, customer.id) });
  if (!cartObj) {
    const [newCart] = await db.insert(carts).values({ userId: customer.id }).returning();
    cartObj = newCart;
  }
  await db.delete(cartItems).where(eq(cartItems.cartId, cartObj.id));
  await db.insert(cartItems).values([
    { cartId: cartObj.id, productId: cartProducts[0].id, quantity: 2, size: "M", color: "Black" },
    { cartId: cartObj.id, productId: cartProducts[1].id, quantity: 1 },
  ]);

  const wishlistProducts = ["DEMO-HEADPHONE-001", "DEMO-SHOE-001"].map((sku) => productBySku.get(sku)!);
  let wishlistObj = await db.query.wishlists.findFirst({ where: eq(wishlists.userId, customer.id) });
  if (!wishlistObj) {
    const [newWishlist] = await db.insert(wishlists).values({ userId: customer.id }).returning();
    wishlistObj = newWishlist;
  }
  await db.delete(wishlistItems).where(eq(wishlistItems.wishlistId, wishlistObj.id));
  await db.insert(wishlistItems).values(
    wishlistProducts.map((p) => ({ wishlistId: wishlistObj.id, productId: p.id }))
  );
}

type DemoOrder = {
  orderNumber: string;
  daysOld: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingMethodId: string;
  guest?: { name: string; phone: string; email: string };
  items: { sku: string; quantity: number; size?: string; color?: string }[];
  timeline: OrderStatus[];
  trackingNumber?: string;
  cancellationReason?: string;
};

const demoOrders: DemoOrder[] = [
  { orderNumber: "DEMO-1001", daysOld: 0, status: OrderStatus.PENDING, paymentMethod: PaymentMethod.COD, paymentStatus: PaymentStatus.PENDING, shippingMethodId: "demo-shipping-dhaka", items: [{ sku: "DEMO-TEE-001", quantity: 2, size: "M", color: "Black" }], timeline: [OrderStatus.PENDING] },
  { orderNumber: "DEMO-1002", daysOld: 1, status: OrderStatus.PROCESSING, paymentMethod: PaymentMethod.CARD, paymentStatus: PaymentStatus.COMPLETED, shippingMethodId: "demo-shipping-express", items: [{ sku: "DEMO-WATCH-001", quantity: 1, size: "44mm", color: "Midnight" }], timeline: [OrderStatus.PENDING, OrderStatus.PROCESSING] },
  { orderNumber: "DEMO-1003", daysOld: 3, status: OrderStatus.SHIPPED, paymentMethod: PaymentMethod.COD, paymentStatus: PaymentStatus.PENDING, shippingMethodId: "demo-shipping-outside", guest: { name: "Nadia Rahman", phone: "01800000001", email: "nadia@example.com" }, items: [{ sku: "DEMO-SHOE-001", quantity: 1, size: "41", color: "Black/White" }], timeline: [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED], trackingNumber: "DEMO-TRK-1003" },
  { orderNumber: "DEMO-1004", daysOld: 7, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.CARD, paymentStatus: PaymentStatus.COMPLETED, shippingMethodId: "demo-shipping-dhaka", items: [{ sku: "DEMO-HEADPHONE-001", quantity: 1, color: "Matte Black" }, { sku: "DEMO-BOOK-001", quantity: 1 }], timeline: [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED], trackingNumber: "DEMO-TRK-1004" },
  { orderNumber: "DEMO-1005", daysOld: 12, status: OrderStatus.CANCELLED, paymentMethod: PaymentMethod.COD, paymentStatus: PaymentStatus.FAILED, shippingMethodId: "demo-shipping-outside", guest: { name: "Tanvir Hasan", phone: "01800000002", email: "tanvir@example.com" }, items: [{ sku: "DEMO-BLENDER-001", quantity: 1 }], timeline: [OrderStatus.PENDING, OrderStatus.CANCELLED], cancellationReason: "Customer changed their mind." },
  { orderNumber: "DEMO-1006", daysOld: 20, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.COD, paymentStatus: PaymentStatus.COMPLETED, shippingMethodId: "demo-shipping-outside", guest: { name: "Samira Khan", phone: "01800000003", email: "samira@example.com" }, items: [{ sku: "DEMO-LAMP-001", quantity: 2, color: "White" }], timeline: [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED], trackingNumber: "DEMO-TRK-1006" },
];

async function seedOrders() {
  const customer = await db.query.users.findFirst({ where: eq(users.email, "customer@demo.com") });
  if (!customer) throw new Error("Customer user not found");

  const productRows = await db.query.products.findMany({ where: sql`${products.sku} LIKE 'DEMO-%'` });
  const productBySku = new Map(productRows.map((product) => [product.sku, product]));
  const orderNumbers = demoOrders.map((order) => order.orderNumber);

  const oldOrders = await db.query.orders.findMany({
    where: inArray(orders.orderNumber, orderNumbers),
    columns: { id: true },
  });
  const oldOrderIds = oldOrders.map((order) => order.id);

  if (oldOrderIds.length) {
    await db.delete(orderTimelineEvents).where(inArray(orderTimelineEvents.orderId, oldOrderIds));
    await db.delete(payments).where(inArray(payments.orderId, oldOrderIds));
    await db.delete(orderItems).where(inArray(orderItems.orderId, oldOrderIds));
    await db.delete(orders).where(inArray(orders.id, oldOrderIds));
  }

  for (const order of demoOrders) {
    const createdAt = daysAgo(order.daysOld);
    const items = order.items.map((item) => {
      const product = productBySku.get(item.sku);
      if (!product) throw new Error(`Missing product: ${item.sku}`);
      return { productId: product.id, quantity: item.quantity, price: product.price, size: item.size || null, color: item.color || null };
    });
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = shippingMethods.find((method) => method.id === order.shippingMethodId)!;
    const totalAmount = subtotal + shipping.cost;

    const [newOrder] = await db.insert(orders).values({
      orderNumber: order.orderNumber,
      userId: order.guest ? null : customer.id,
      guestName: order.guest?.name || null,
      guestPhone: order.guest?.phone || null,
      guestEmail: order.guest?.email || null,
      subtotal,
      shippingCost: shipping.cost,
      tax: 0,
      totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      shippingAddress: order.guest ? "12 Demo Road" : customer.address || "Uttara, Dhaka",
      shippingCity: order.shippingMethodId === "demo-shipping-dhaka" ? "Dhaka" : "Chattogram",
      shippingCountry: "Bangladesh",
      shippingMethodId: order.shippingMethodId,
      status: order.status,
      trackingNumber: order.trackingNumber || null,
      cancellationReason: order.cancellationReason || null,
      createdAt,
      updatedAt: createdAt,
    }).returning();

    await db.insert(orderItems).values(
      items.map(item => ({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
        createdAt,
      }))
    );

    await db.insert(payments).values({
      orderId: newOrder.id,
      amount: totalAmount,
      method: order.paymentMethod,
      status: order.paymentStatus,
      transactionId: order.paymentMethod === PaymentMethod.CARD ? `DEMO-TXN-${order.orderNumber}` : null,
    });

    await db.insert(orderTimelineEvents).values(
      order.timeline.map((status, index) => ({
        orderId: newOrder.id,
        status,
        message: `Demo order status: ${status.toLowerCase()}.`,
        createdAt: new Date(createdAt.getTime() + index * 3 * 60 * 60 * 1000),
      }))
    );
  }
}

async function seedMarketingData() {
  const headphone = await db.query.products.findFirst({ where: eq(products.sku, "DEMO-HEADPHONE-001") });
  const shoe = await db.query.products.findFirst({ where: eq(products.sku, "DEMO-SHOE-001") });
  if (!headphone || !shoe) throw new Error("Demo headphone or shoe not found");

  const existingCamp1 = await db.query.campaigns.findFirst({ where: eq(campaigns.slug, "demo-headphone-launch") });
  const camp1Values = {
    title: "Sound Without Distractions",
    slug: "demo-headphone-launch",
    headline: "Focus on every detail",
    subheadline: "Premium wireless audio for work and travel.",
    badgeLabel: "Demo Campaign",
    status: CampaignStatus.ACTIVE,
    productId: headphone.id,
    updatedAt: new Date(),
  };
  if (existingCamp1) {
    await db.update(campaigns).set(camp1Values).where(eq(campaigns.id, existingCamp1.id));
  } else {
    await db.insert(campaigns).values(camp1Values);
  }

  const existingCamp2 = await db.query.campaigns.findFirst({ where: eq(campaigns.slug, "demo-running-season") });
  const camp2Values = {
    title: "Run Your Best",
    slug: "demo-running-season",
    headline: "Built for the next kilometer",
    status: CampaignStatus.DRAFT,
    productId: shoe.id,
    updatedAt: new Date(),
  };
  if (existingCamp2) {
    await db.update(campaigns).set(camp2Values).where(eq(campaigns.id, existingCamp2.id));
  } else {
    await db.insert(campaigns).values(camp2Values);
  }

  const testimonialsData = [
    { id: "demo-testimonial-1", name: "Farhana Ahmed", message: "Ordering was simple and delivery was faster than expected.", rating: 5, role: TestimonialUserRole.CUSTOMER },
    { id: "demo-testimonial-2", name: "Rafi Chowdhury", message: "The product quality matched the photos and description.", rating: 5, role: TestimonialUserRole.FASHION_ENTHUSIAST },
    { id: "demo-testimonial-3", name: "Maliha Noor", message: "Helpful support and a smooth checkout experience.", rating: 4, role: TestimonialUserRole.INFLUENCER },
  ];

  for (const testimonial of testimonialsData) {
    const existing = await db.query.testimonials.findFirst({ where: eq(testimonials.id, testimonial.id) });
    if (existing) {
      await db.update(testimonials).set({ ...testimonial, updatedAt: new Date() }).where(eq(testimonials.id, testimonial.id));
    } else {
      await db.insert(testimonials).values(testimonial);
    }
  }
}

async function main() {
  await seedCategories();
  await seedProducts();
  await seedUsers();
  await seedStoreData();
  await seedCustomerData();
  await seedOrders();
  await seedMarketingData();

  const userCountRes = await db.select({ count: count() }).from(users).where(inArray(users.email, [adminEmail, "moderator@demo.com", "customer@demo.com"]));
  const categoryCountRes = await db.select({ count: count() }).from(categories).where(inArray(categories.value, categoriesData.map(c => c.value)));
  const productCountRes = await db.select({ count: count() }).from(products).where(sql`${products.sku} LIKE 'DEMO-%'`);
  const orderCountRes = await db.select({ count: count() }).from(orders).where(sql`${orders.orderNumber} LIKE 'DEMO-%'`);
  const reviewCountRes = await db.select({ count: count() }).from(reviews).where(sql`${reviews.id} LIKE 'demo-review-%'`);

  console.log("Demo seed complete.");
  console.log({
    users: Number(userCountRes[0]?.count || 0),
    categories: Number(categoryCountRes[0]?.count || 0),
    products: Number(productCountRes[0]?.count || 0),
    orders: Number(orderCountRes[0]?.count || 0),
    reviews: Number(reviewCountRes[0]?.count || 0)
  });
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  });
