-- Phase 3: Orders, Order Items, Order Addresses, Order Timeline,
--           Inventory Reservations, Order Refunds, Order Returns
-- Migration: 0008_phase3_orders

CREATE TABLE IF NOT EXISTS "order" (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  customerId TEXT,
  fulfillmentLocationId TEXT NOT NULL REFERENCES location(id) ON DELETE RESTRICT,
  orderNumber TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'MANUAL',
  status TEXT NOT NULL DEFAULT 'PENDING',
  paymentStatus TEXT NOT NULL DEFAULT 'PENDING',
  paymentMethod TEXT,
  subtotal INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  tax INTEGER NOT NULL DEFAULT 0,
  shippingCost INTEGER NOT NULL DEFAULT 0,
  grandTotal INTEGER NOT NULL,
  notes TEXT,
  customerNotes TEXT,
  campaignId TEXT,
  funnelId TEXT,
  utmSource TEXT,
  utmMedium TEXT,
  utmCampaign TEXT,
  deliveredAt INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  UNIQUE(organizationId, orderNumber)
);

CREATE INDEX IF NOT EXISTS order_org_idx ON "order"(organizationId);
CREATE INDEX IF NOT EXISTS order_org_status_idx ON "order"(organizationId, status);

CREATE TABLE IF NOT EXISTS order_item (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  variantId TEXT NOT NULL REFERENCES product_variant(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unitPrice INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  lineTotal INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS order_item_order_idx ON order_item(orderId);

CREATE TABLE IF NOT EXISTS order_address (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  area TEXT,
  city TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS order_timeline (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  orderId TEXT NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  note TEXT,
  actorId TEXT,
  createdAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS order_timeline_org_order_idx ON order_timeline(organizationId, orderId);

CREATE TABLE IF NOT EXISTS inventory_reservation (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  variantId TEXT NOT NULL REFERENCES product_variant(id) ON DELETE RESTRICT,
  orderId TEXT NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  locationId TEXT NOT NULL REFERENCES location(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'RESERVED',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS inventory_reservation_org_order_idx ON inventory_reservation(organizationId, orderId);
CREATE INDEX IF NOT EXISTS inventory_reservation_org_variant_loc_idx ON inventory_reservation(organizationId, variantId, locationId);

CREATE TABLE IF NOT EXISTS order_refund (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  orderId TEXT NOT NULL REFERENCES "order"(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  method TEXT NOT NULL DEFAULT 'MANUAL',
  approvedBy TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS order_refund_org_order_idx ON order_refund(organizationId, orderId);

CREATE TABLE IF NOT EXISTS order_return (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  orderId TEXT NOT NULL REFERENCES "order"(id) ON DELETE RESTRICT,
  returnNumber TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  approvedBy TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  UNIQUE(organizationId, returnNumber)
);

CREATE INDEX IF NOT EXISTS order_return_org_order_idx ON order_return(organizationId, orderId);

CREATE TABLE IF NOT EXISTS order_return_item (
  id TEXT PRIMARY KEY,
  orderReturnId TEXT NOT NULL REFERENCES order_return(id) ON DELETE CASCADE,
  orderItemId TEXT NOT NULL REFERENCES order_item(id) ON DELETE RESTRICT,
  variantId TEXT NOT NULL REFERENCES product_variant(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS order_return_item_return_idx ON order_return_item(orderReturnId);
