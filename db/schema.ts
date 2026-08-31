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
  index,
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
  "REFUNDED",
]);
export const paymentMethodEnum = pgEnum("PaymentMethod", ["COD", "CARD", "DUE"]);
export const saleTypeEnum = pgEnum("SaleType", ["POS", "WEBSITE"]);
export const paymentStatusEnum = pgEnum("PaymentStatus", [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);
export const testimonialUserRoleEnum = pgEnum("TestimonialUserRole", [
  "FASHION_ENTHUSIAST",
  "CUSTOMER",
  "INFLUENCER",
  "OTHER",
]);
// Tables
export const roles = pgTable("roles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  name: text("name").unique().notNull(),
  permissions: text("permissions").array().notNull().default([]),
  // Optional custom landing route for this role, e.g. "/dashboard/orders".
  // When null, the first accessible module decides where the user lands.
  landingUrl: text("landingUrl"),
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
  // Brute-force login lockout. Incremented on each wrong password; once it
  // hits the threshold (see MAX_FAILED_ATTEMPTS in the auth route),
  // lockedUntil is set and login is refused until that time passes. Both
  // reset to 0/null on the next successful login.
  failedLoginAttempts: integer("failedLoginAttempts").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil", { precision: 3 }),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
}, (table) => [
  index("User_roleId_idx").on(table.roleId),
]);

// Server-to-server credentials (MCP server, scripts, integrations) — an
// alternative to the cookie/JWT session for callers that aren't a browser.
// The raw key is shown to the user exactly once at creation time; only its
// SHA-256 hash is ever stored. Authenticating with a key acts AS the user
// who created it (same role/permissions), so revoking a staff account or
// this row both cut off access identically.
export const apiKeys = pgTable("api_keys", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  name: text("name").notNull(),
  keyHash: text("keyHash").unique().notNull(),
  // First few characters of the raw key, kept only for display in the UI
  // ("sk_live_a1b2...") so an admin can recognize which key is which.
  keyPrefix: text("keyPrefix").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  lastUsedAt: timestamp("lastUsedAt", { precision: 3 }),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  revokedAt: timestamp("revokedAt", { precision: 3 }),
});

// --- OAuth 2.1 (for the claude.ai Custom Connector) ---
// A remote MCP client (claude.ai) can't be handed a pre-shared API key the
// way the local mcp-server is — it registers itself on the fly (Dynamic
// Client Registration), then runs a normal OAuth authorization-code + PKCE
// flow against these tables. Distinct from `apiKeys` above on purpose: OAuth
// tokens expire and refresh, API keys don't.

// Registered via POST /oauth/register (RFC 7591). `clientSecret` is issued
// but PKCE is required regardless, since a browser-based client like
// claude.ai can't keep a secret confidential.
export const oauthClients = pgTable("oauth_clients", {
  id: text("id").primaryKey(), // the client_id itself, not a surrogate key
  clientSecretHash: text("clientSecretHash"),
  clientName: text("clientName").notNull(),
  redirectUris: json("redirectUris").$type<string[]>().notNull(),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
});

// Short-lived, single-use — minted when the user clicks "Allow" on the
// consent screen, redeemed once at POST /oauth/token, then dead either way.
export const oauthAuthorizationCodes = pgTable("oauth_authorization_codes", {
  code: text("code").primaryKey(),
  clientId: text("clientId")
    .notNull()
    .references(() => oauthClients.id),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  redirectUri: text("redirectUri").notNull(),
  // PKCE (RFC 7636) — the token endpoint hashes the caller's code_verifier
  // and checks it matches this, proving it's the same party that started
  // the flow (mitigates authorization-code interception).
  codeChallenge: text("codeChallenge").notNull(),
  codeChallengeMethod: text("codeChallengeMethod").notNull(),
  expiresAt: timestamp("expiresAt", { precision: 3 }).notNull(),
  usedAt: timestamp("usedAt", { precision: 3 }),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
});

export const oauthAccessTokens = pgTable("oauth_access_tokens", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  tokenHash: text("tokenHash").unique().notNull(),
  clientId: text("clientId")
    .notNull()
    .references(() => oauthClients.id),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expiresAt", { precision: 3 }).notNull(),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  revokedAt: timestamp("revokedAt", { precision: 3 }),
});

export const oauthRefreshTokens = pgTable("oauth_refresh_tokens", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  tokenHash: text("tokenHash").unique().notNull(),
  clientId: text("clientId")
    .notNull()
    .references(() => oauthClients.id),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  // Rotated on every use (a fresh refresh token is issued each refresh, this
  // one is revoked) — a replayed old refresh token is then a clear signal
  // of theft, not just an expired credential.
  revokedAt: timestamp("revokedAt", { precision: 3 }),
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
  addOns: json("productAddOns").$type<Array<{ name: string; price: number }>>().default([]).notNull(),
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
}, (table) => [
  index("products_categoryId_idx").on(table.categoryId),
  index("products_createdAt_idx").on(table.createdAt),
]);

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
}, (table) => [
  index("campaigns_productId_idx").on(table.productId),
]);

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
}, (table) => [
  index("product_reviews_productId_idx").on(table.productId),
  index("product_reviews_userId_idx").on(table.userId),
]);

export const specifications = pgTable("product_specifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  key: text("key").notNull(),
  value: text("value").notNull(),
  productId: text("productId")
    .notNull()
    .references(() => products.id),
}, (table) => [
  index("product_specifications_productId_idx").on(table.productId),
]);

export const categories = pgTable("Category", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  value: text("value").unique().notNull(),
  parentId: text("parentId").references((): AnyPgColumn => categories.id),
  image: text("image"),
  order: integer("order"),
  seoTitle: text("seoTitle"),
  seoDescription: text("seoDescription"),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
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
}, (table) => [
  index("order_timeline_events_orderId_idx").on(table.orderId),
]);

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
  // Idempotency guard for the Meta Conversions API Purchase event. Set the
  // first (and only) time a server-side Purchase is successfully sent for
  // this order, so re-running the creation path (retries, re-processing, or
  // any future status-change hook) can never double-count the conversion.
  metaPurchaseEventSentAt: timestamp("metaPurchaseEventSentAt", { precision: 3 }),
  // Idempotency guard at ORDER CREATION time. A client generates one UUID per
  // checkout attempt (stored in sessionStorage) and sends it with the
  // order-creation request. The unique index means two rapid/duplicate submits
  // carrying the same key can never create two order rows: the first insert
  // wins and the server returns the already-created order for the rest. NULL
  // for orders created before this existed and for paths that don't supply a
  // key (POS, etc.). Postgres allows many NULLs under a unique index.
  idempotencyKey: text("idempotencyKey").unique(),
  // Refunds. `refundedAmount` accumulates across partial refunds (0 = none).
  // When it reaches `totalAmount` the order is fully refunded. `refundReason`
  // holds the most recent reason; per-refund history lives in the timeline.
  refundedAmount: doublePrecision("refundedAmount").default(0).notNull(),
  refundReason: text("refundReason"),
  refundedAt: timestamp("refundedAt", { precision: 3 }),
  // Customer Device & Location metadata captured at checkout
  ipAddress: text("ipAddress"),
  deviceOs: text("deviceOs"),
  browserName: text("browserName"),
  userAgent: text("userAgent"),
  // Set the first time this order is exported as a row to the Google Sheets
  // order log (see features/google-sheets). Gates the "Book to Sheet" action
  // the same way `trackingNumber` gates Steadfast booking, so re-clicking
  // doesn't append duplicate rows.
  sheetBookedAt: timestamp("sheetBookedAt", { precision: 3 }),
}, (table) => [
  // Dashboard lists orders newest-first and filters by date range; the
  // customer-facing pages look them up by user. Without these every such
  // query was a full table scan.
  index("orders_createdAt_idx").on(table.createdAt),
  index("orders_userId_idx").on(table.userId),
  index("orders_status_idx").on(table.status),
  index("orders_guestPhone_idx").on(table.guestPhone),
]);

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
}, (table) => [
  index("order_items_orderId_idx").on(table.orderId),
  index("order_items_productId_idx").on(table.productId),
]);

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
}, (table) => [
  index("payments_orderId_idx").on(table.orderId),
]);

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
}, (table) => [
  index("carts_userId_idx").on(table.userId),
]);

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
  posts: many(posts),
  apiKeys: many(apiKeys),
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
}, (table) => [
  index("expenses_categoryId_idx").on(table.categoryId),
  index("expenses_date_idx").on(table.date),
]);

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

export const activityLogs = pgTable("activity_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  userId: text("userId"),
  userName: text("userName").notNull(),
  userEmail: text("userEmail").notNull(),
  // Human-readable label derived from the request, e.g. "Created product".
  action: text("action").notNull(),
  method: text("method").notNull(),
  path: text("path").notNull(),
  status: integer("status").notNull(),
  ip: text("ip").notNull(),
  // The specific thing that was acted on, e.g. a product name, an order
  // number, or a customer's name — so a non-technical admin can tell WHAT
  // was created/edited/deleted without reading the URL. Null when a route
  // hasn't been taught to report one (falls back to the generic `action`).
  targetName: text("targetName"),
  // For edits: the fields that actually changed, as a small human-readable
  // list of { label, from, to }. Null for creates/deletes/reads.
  changes: json("changes").$type<{ label: string; from?: string | null; to?: string | null }[]>(),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
}, (table) => [
  index("activity_logs_createdAt_idx").on(table.createdAt),
  index("activity_logs_userId_idx").on(table.userId),
]);

// Fraud control: IPs barred from placing orders. Populated from the order
// action menu ("Block Customer IP") and checked at checkout before any order
// row is written. One row per IP; `orderId` records the order that triggered
// the block so the dashboard can show the context.
export const blockedIps = pgTable("blocked_ips", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  ipAddress: text("ipAddress").notNull().unique(),
  reason: text("reason"),
  orderId: text("orderId").references(() => orders.id),
  blockedById: text("blockedById").references(() => users.id),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
});
