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
  { id: "demo-category-comforters", value: "comforters", label: "Comforters" },
  { id: "demo-category-bedsheets", value: "bedsheets", label: "Bedsheets" },
  { id: "demo-category-blankets", value: "blankets", label: "Blankets" },
  { id: "demo-category-pillow-covers", value: "pillow-covers", label: "Pillow Covers" },
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
    sku: "DEMO-COMF-001",
    name: "Premium All-Season Comforter",
    description: "Ultra-soft microfibre comforter designed to keep you cozy in winter and cool in summer.",
    price: 3490,
    stock: 120,
    variants: ["White", "Grey", "Navy"],
    tags: ["comforter", "all-season", "featured"],
    images: ["https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=1200"],
    sizes: ["Queen", "King"],
    features: ["Hypoallergenic filling", "Box-stitch construction", "Machine washable"],
    categoryValue: "comforters",
    isFeatured: true,
    specifications: [
      { key: "Material", value: "100% Microfibre" },
      { key: "Weight", value: "300 GSM" },
    ],
  },
  {
    sku: "DEMO-BED-001",
    name: "Luxury Egyptian Cotton Bedsheet",
    description: "Experience hotel-like luxury with our 400 thread count Egyptian cotton bedsheet set.",
    price: 2290,
    stock: 85,
    variants: ["Ivory", "Sage", "Slate"],
    tags: ["bedsheet", "cotton", "luxury"],
    images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1200"],
    sizes: ["Twin", "Queen", "King"],
    features: ["400 Thread Count", "Deep pockets up to 16\"", "Fade resistant"],
    careInstruction: "Machine wash cold. Tumble dry low.",
    categoryValue: "bedsheets",
    isFeatured: true,
    specifications: [{ key: "Material", value: "100% Egyptian Cotton" }],
  },
  {
    sku: "DEMO-BLANKET-001",
    name: "Plush Winter Blanket",
    description: "Thick and incredibly warm fleece blanket for those chilly winter nights.",
    price: 1890,
    stock: 200,
    variants: ["Charcoal", "Maroon"],
    tags: ["blanket", "winter", "fleece"],
    images: ["https://images.unsplash.com/photo-1505693314120-0d443867891c?q=80&w=1200"],
    sizes: ["Single", "Double"],
    features: ["Double-sided fleece", "Anti-pilling", "Heavyweight warmth"],
    careInstruction: "Wash on delicate cycle. Do not iron.",
    categoryValue: "blankets",
    isFeatured: false,
    specifications: [{ key: "Fabric", value: "Polyester Fleece" }],
  },
  {
    sku: "DEMO-PILLOW-001",
    name: "Mulberry Silk Pillow Cover",
    description: "Protect your hair and skin with our 100% pure mulberry silk pillow covers.",
    price: 1490,
    stock: 45,
    variants: ["Pearl", "Champagne"],
    tags: ["pillow", "silk", "beauty"],
    images: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200"],
    sizes: ["Standard", "King"],
    features: ["22 Momme Silk", "Hidden zipper closure", "Hypoallergenic"],
    careInstruction: "Hand wash cold with silk detergent. Air dry.",
    categoryValue: "pillow-covers",
    isFeatured: true,
    specifications: [
      { key: "Material", value: "100% Mulberry Silk" },
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

  const cartProducts = ["DEMO-BED-001", "DEMO-PILLOW-001"].map((sku) => productBySku.get(sku)!);
  let cartObj = await db.query.carts.findFirst({ where: eq(carts.userId, customer.id) });
  if (!cartObj) {
    const [newCart] = await db.insert(carts).values({ userId: customer.id }).returning();
    cartObj = newCart;
  }
  await db.delete(cartItems).where(eq(cartItems.cartId, cartObj.id));
  await db.insert(cartItems).values([
    { cartId: cartObj.id, productId: cartProducts[0].id, quantity: 2, size: "King", color: "Sage" },
    { cartId: cartObj.id, productId: cartProducts[1].id, quantity: 1, size: "Standard", color: "Pearl" },
  ]);

  const wishlistProducts = ["DEMO-COMF-001", "DEMO-BLANKET-001"].map((sku) => productBySku.get(sku)!);
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
  { orderNumber: "DEMO-1001", daysOld: 0, status: OrderStatus.PENDING, paymentMethod: PaymentMethod.COD, paymentStatus: PaymentStatus.PENDING, shippingMethodId: "demo-shipping-dhaka", items: [{ sku: "DEMO-BED-001", quantity: 2, size: "King", color: "Ivory" }], timeline: [OrderStatus.PENDING] },
  { orderNumber: "DEMO-1002", daysOld: 1, status: OrderStatus.PROCESSING, paymentMethod: PaymentMethod.CARD, paymentStatus: PaymentStatus.COMPLETED, shippingMethodId: "demo-shipping-express", items: [{ sku: "DEMO-COMF-001", quantity: 1, size: "Queen", color: "Navy" }], timeline: [OrderStatus.PENDING, OrderStatus.PROCESSING] },
  { orderNumber: "DEMO-1003", daysOld: 3, status: OrderStatus.SHIPPED, paymentMethod: PaymentMethod.COD, paymentStatus: PaymentStatus.PENDING, shippingMethodId: "demo-shipping-outside", guest: { name: "Nadia Rahman", phone: "01800000001", email: "nadia@example.com" }, items: [{ sku: "DEMO-BLANKET-001", quantity: 1, size: "Single", color: "Maroon" }], timeline: [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED], trackingNumber: "DEMO-TRK-1003" },
  { orderNumber: "DEMO-1004", daysOld: 7, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.CARD, paymentStatus: PaymentStatus.COMPLETED, shippingMethodId: "demo-shipping-dhaka", items: [{ sku: "DEMO-PILLOW-001", quantity: 2, size: "Standard", color: "Pearl" }, { sku: "DEMO-BED-001", quantity: 1, size: "King", color: "Sage" }], timeline: [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED], trackingNumber: "DEMO-TRK-1004" },
  { orderNumber: "DEMO-1005", daysOld: 12, status: OrderStatus.CANCELLED, paymentMethod: PaymentMethod.COD, paymentStatus: PaymentStatus.FAILED, shippingMethodId: "demo-shipping-outside", guest: { name: "Tanvir Hasan", phone: "01800000002", email: "tanvir@example.com" }, items: [{ sku: "DEMO-COMF-001", quantity: 1, size: "Queen", color: "Grey" }], timeline: [OrderStatus.PENDING, OrderStatus.CANCELLED], cancellationReason: "Customer changed their mind." },
  { orderNumber: "DEMO-1006", daysOld: 20, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.COD, paymentStatus: PaymentStatus.COMPLETED, shippingMethodId: "demo-shipping-outside", guest: { name: "Samira Khan", phone: "01800000003", email: "samira@example.com" }, items: [{ sku: "DEMO-PILLOW-001", quantity: 4, size: "Standard", color: "Champagne" }], timeline: [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED], trackingNumber: "DEMO-TRK-1006" },
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
  const comforter = await db.query.products.findFirst({ where: eq(products.sku, "DEMO-COMF-001") });
  const bedsheet = await db.query.products.findFirst({ where: eq(products.sku, "DEMO-BED-001") });
  if (!comforter || !bedsheet) throw new Error("Demo comforter or bedsheet not found");

  const existingCamp1 = await db.query.campaigns.findFirst({ where: eq(campaigns.slug, "demo-comforter-launch") });
  const camp1Values = {
    title: "Sleep Like Royalty",
    slug: "demo-comforter-launch",
    headline: "Experience premium comfort",
    subheadline: "Luxury all-season comforters for perfect sleep.",
    badgeLabel: "Winter Sale",
    status: CampaignStatus.ACTIVE,
    productId: comforter.id,
    updatedAt: new Date(),
  };
  if (existingCamp1) {
    await db.update(campaigns).set(camp1Values).where(eq(campaigns.id, existingCamp1.id));
  } else {
    await db.insert(campaigns).values(camp1Values);
  }

  const existingCamp2 = await db.query.campaigns.findFirst({ where: eq(campaigns.slug, "demo-cotton-season") });
  const camp2Values = {
    title: "Breathe Easy",
    slug: "demo-cotton-season",
    headline: "100% Egyptian Cotton",
    status: CampaignStatus.DRAFT,
    productId: bedsheet.id,
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
