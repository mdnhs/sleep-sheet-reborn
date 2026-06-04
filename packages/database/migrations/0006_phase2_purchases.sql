-- Phase 2: Suppliers + Purchases
-- Migration: 0006_phase2_purchases

CREATE TABLE IF NOT EXISTS supplier (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  UNIQUE(organizationId, phone)
);

CREATE INDEX IF NOT EXISTS supplier_org_idx ON supplier(organizationId);

CREATE TABLE IF NOT EXISTS supplier_payment (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  supplierId TEXT NOT NULL REFERENCES supplier(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL,
  paymentMethod TEXT NOT NULL DEFAULT 'CASH',
  referenceNo TEXT,
  notes TEXT,
  createdAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS supplier_payment_org_idx ON supplier_payment(organizationId);
CREATE INDEX IF NOT EXISTS supplier_payment_supplier_idx ON supplier_payment(supplierId);

CREATE TABLE IF NOT EXISTS purchase_order (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  supplierId TEXT NOT NULL REFERENCES supplier(id) ON DELETE RESTRICT,
  purchaseNumber TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  receivingLocationId TEXT NOT NULL REFERENCES location(id) ON DELETE RESTRICT,
  subtotal INTEGER NOT NULL DEFAULT 0,
  tax INTEGER NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL DEFAULT 0,
  grandTotal INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  approvedBy TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  UNIQUE(organizationId, purchaseNumber)
);

CREATE INDEX IF NOT EXISTS purchase_order_org_idx ON purchase_order(organizationId);
CREATE INDEX IF NOT EXISTS purchase_order_supplier_idx ON purchase_order(supplierId);

CREATE TABLE IF NOT EXISTS purchase_item (
  id TEXT PRIMARY KEY,
  purchaseOrderId TEXT NOT NULL REFERENCES purchase_order(id) ON DELETE CASCADE,
  variantId TEXT NOT NULL REFERENCES product_variant(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  receivedQuantity INTEGER NOT NULL DEFAULT 0,
  unitCost INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS purchase_item_order_idx ON purchase_item(purchaseOrderId);
