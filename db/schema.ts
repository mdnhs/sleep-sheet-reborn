import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  json,
  pgEnum,
  unique,
  AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import cuid from "cuid";

// Enums
export const Role = {
  USER: "USER",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
} as const;
export type Role = typeof Role[keyof typeof Role];

export const CampaignStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  ENDED: "ENDED",
} as const;
export type CampaignStatus = typeof CampaignStatus[keyof typeof CampaignStatus];

export const OrderStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export const PaymentMethod = {
  COD: "COD",
  CARD: "CARD",
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const TestimonialUserRole = {
  FASHION_ENTHUSIAST: "FASHION_ENTHUSIAST",
  CUSTOMER: "CUSTOMER",
  INFLUENCER: "INFLUENCER",
  OTHER: "OTHER",
} as const;
export type TestimonialUserRole = typeof TestimonialUserRole[keyof typeof TestimonialUserRole];

export const OTPType = {
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PASSWORD_RESET: "PASSWORD_RESET",
  LOGIN_OTP: "LOGIN_OTP",
} as const;
export type OTPType = typeof OTPType[keyof typeof OTPType];

export const roleEnum = pgEnum("Role", ["USER", "ADMIN", "MODERATOR"]);
export const campaignStatusEnum = pgEnum("CampaignStatus", [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "ENDED",
]);
export const orderStatusEnum = pgEnum("OrderStatus", [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);
export const paymentMethodEnum = pgEnum("PaymentMethod", ["COD", "CARD", "DUE"]);
export const saleTypeEnum = pgEnum("SaleType", ["POS", "WEBSITE"]);
export const paymentStatusEnum = pgEnum("PaymentStatus", [
  "PENDING",
  "COMPLETED",
  "FAILED",
]);
export const testimonialUserRoleEnum = pgEnum("TestimonialUserRole", [
  "FASHION_ENTHUSIAST",
  "CUSTOMER",
  "INFLUENCER",
  "OTHER",
]);
export const otpTypeEnum = pgEnum("OTPType", [
  "EMAIL_VERIFICATION",
  "PASSWORD_RESET",
  "LOGIN_OTP",
]);

// Tables
export const roles = pgTable("roles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  name: text("name").unique().notNull(),
  permissions: text("permissions").array().notNull().default([]),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
});

export const users = pgTable("User", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  phone: text("phone"),
  address: text("address"),
  role: roleEnum("role").default("USER").notNull(),
  roleId: text("roleId").references(() => roles.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  summary: text("summary"),
  content: text("content").notNull(),
  coverImage: text("coverImage"),
  authorId: text("authorId")
    .notNull()
    .references(() => users.id),
  isPublished: boolean("isPublished").default(false).notNull(),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  name: text("productName").notNull(),
  description: text("productDescription").notNull(),
  price: doublePrecision("productPrice").notNull(),
  stock: integer("productStock").notNull(),
  sku: text("productSKU").unique().notNull(),
  variants: json("productVariants").$type<Array<{ name: string; price: number | null }>>().default([]).notNull(),
  tags: text("productTags").array().notNull(),
  images: text("productImages").array().notNull(),
  sizes: text("productSize").array().notNull(),
  features: text("productFeatures").array().notNull(),
  careInstruction: text("careInstruction"),
  categoryId: text("productCategory")
    .notNull()
    .references(() => categories.id),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
  isFeatured: boolean("productIsFeatured").default(false).notNull(),
  discount: doublePrecision("discount").default(0).notNull(),
  showLowestPriceAsDefault: boolean("showLowestPriceAsDefault").default(true).notNull(),
  defaultVariantName: text("defaultVariantName"),
});

export const campaigns = pgTable("campaigns", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  headline: text("headline"),
  subheadline: text("subheadline"),
  badgeLabel: text("badgeLabel"),
  ctaLabel: text("ctaLabel").default("Buy Now").notNull(),
  layout: json("layout"),
  pageLayout: json("pageLayout"),
  startsAt: timestamp("startsAt", { precision: 3 }),
  endsAt: timestamp("endsAt", { precision: 3 }),
  status: campaignStatusEnum("status").default("DRAFT").notNull(),
  productId: text("productId")
    .notNull()
    .references(() => products.id),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
});

export const reviews = pgTable("product_reviews", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  comment: text("comment").notNull(),
  rating: integer("rating").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  productId: text("productId")
    .notNull()
    .references(() => products.id),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
});

export const specifications = pgTable("product_specifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  key: text("key").notNull(),
  value: text("value").notNull(),
  productId: text("productId")
    .notNull()
    .references(() => products.id),
});

export const categories = pgTable("Category", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  value: text("value").unique().notNull(),
  parentId: text("parentId").references((): AnyPgColumn => categories.id),
  image: text("image"),
  seoTitle: text("seoTitle"),
  seoDescription: text("seoDescription"),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
});

export const orderTimelineEvents = pgTable("order_timeline_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  orderId: text("orderId")
    .notNull()
    .references(() => orders.id),
  status: orderStatusEnum("status").notNull(),
  message: text("message"),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  orderNumber: text("orderNumber").unique().notNull(),
  userId: text("userId").references(() => users.id),
  guestName: text("guestName"),
  guestPhone: text("guestPhone"),
  guestEmail: text("guestEmail"),
  totalAmount: doublePrecision("totalAmount").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
  shippingCost: doublePrecision("shippingCost").notNull(),
  tax: doublePrecision("tax").notNull(),
  paymentMethod: text("paymentMethod").notNull(),
  paymentStatus: paymentStatusEnum("paymentStatus").default("PENDING").notNull(),
  shippingAddress: text("shippingAddress").notNull(),
  shippingCity: text("shippingCity"),
  shippingState: text("shippingState"),
  shippingPostalCode: text("shippingPostalCode"),
  shippingCountry: text("shippingCountry"),
  shippingMethodId: text("shippingMethodId").references(() => shippingMethods.id),
  status: orderStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
  trackingNumber: text("trackingNumber"),
  cancellationReason: text("cancellationReason"),
  reference: text("reference"),
  note: text("note"),
  saleType: saleTypeEnum("saleType").default("WEBSITE").notNull(),
});

export const orderItems = pgTable("order_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  orderId: text("orderId")
    .notNull()
    .references(() => orders.id),
  productId: text("productId").references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(),
  costPrice: doublePrecision("costPrice"),
  size: text("size"),
  color: text("color"),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  orderId: text("orderId")
    .unique()
    .notNull()
    .references(() => orders.id),
  amount: doublePrecision("amount").notNull(),
  method: paymentMethodEnum("method").notNull(),
  transactionId: text("transactionId"),
  last4Digits: text("last4Digits"),
  expirationDate: text("expirationDate"),
  status: paymentStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
});

export const shippingMethods = pgTable("shipping_methods", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  name: text("name").notNull(),
  cost: doublePrecision("cost").notNull(),
  duration: text("duration").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const carts = pgTable("carts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  userId: text("userId")
    .unique()
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    cartId: text("cartId")
      .notNull()
      .references(() => carts.id),
    productId: text("productId")
      .notNull()
      .references(() => products.id),
    quantity: integer("quantity").notNull(),
    size: text("size"),
    color: text("color"),
    createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  },
  (table) => [
    unique("cart_items_cartId_productId_size_color_key").on(
      table.cartId,
      table.productId,
      table.size,
      table.color
    ),
  ]
);

export const testimonials = pgTable("Testimonial", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  name: text("name").notNull(),
  message: text("message").notNull(),
  rating: integer("rating").notNull(),
  image: text("image"),
  screenshot: text("screenshot"),
  role: testimonialUserRoleEnum("role").default("CUSTOMER").notNull(),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
});

export const wishlists = pgTable("wishlists", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  userId: text("userId")
    .unique()
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
});

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    wishlistId: text("wishlistId")
      .notNull()
      .references(() => wishlists.id),
    productId: text("productId")
      .notNull()
      .references(() => products.id),
    createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  },
  (table) => [
    unique("wishlist_items_wishlistId_productId_key").on(
      table.wishlistId,
      table.productId
    ),
  ]
);

export const otpVerifications = pgTable("OTPVerification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  userId: text("userId").references(() => users.id),
  email: text("email").notNull(),
  code: text("code").notNull(),
  type: otpTypeEnum("type").default("EMAIL_VERIFICATION").notNull(),
  expiresAt: timestamp("expiresAt", { precision: 3 }).notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  reviews: many(reviews),
  orders: many(orders),
  carts: many(carts),
  wishlists: many(wishlists),
  otpVerifications: many(otpVerifications),
  posts: many(posts),
  assignedRole: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  specifications: many(specifications),
  reviews: many(reviews),
  orderItems: many(orderItems),
  cartItems: many(cartItems),
  wishlistItems: many(wishlistItems),
  campaigns: many(campaigns),
}));

export const campaignsRelations = relations(campaigns, ({ one }) => ({
  product: one(products, {
    fields: [campaigns.productId],
    references: [products.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
}));

export const specificationsRelations = relations(specifications, ({ one }) => ({
  product: one(products, {
    fields: [specifications.productId],
    references: [products.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "CategoryChildren",
  }),
  children: many(categories, {
    relationName: "CategoryChildren",
  }),
  products: many(products),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  payment: one(payments, {
    fields: [orders.id],
    references: [payments.orderId],
  }),
  OrderTimelineEvent: many(orderTimelineEvents),
  shippingMethod: one(shippingMethods, {
    fields: [orders.shippingMethodId],
    references: [shippingMethods.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const wishlistsRelations = relations(wishlists, ({ one, many }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  items: many(wishlistItems),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  wishlist: one(wishlists, {
    fields: [wishlistItems.wishlistId],
    references: [wishlists.id],
  }),
  product: one(products, {
    fields: [wishlistItems.productId],
    references: [products.id],
  }),
}));

export const orderTimelineEventsRelations = relations(orderTimelineEvents, ({ one }) => ({
  order: one(orders, {
    fields: [orderTimelineEvents.orderId],
    references: [orders.id],
  }),
}));

export const expenseCategories = pgTable("expense_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: text("id").primaryKey(),
  amount: doublePrecision("amount").notNull(),
  categoryId: text("categoryId").references(() => expenseCategories.id).notNull(),
  date: timestamp("date", { precision: 3 }).defaultNow().notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
});

export const expenseCategoriesRelations = relations(expenseCategories, ({ many }) => ({
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const trafficEvents = pgTable("traffic_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  path: text("path").notNull(),
  label: text("label"),
  meta: json("meta").$type<Record<string, string | number | boolean>>(),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
});

