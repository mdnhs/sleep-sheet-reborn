-- Phase 4: POS — Cash Registers, Register Sessions, POS Sales, Payments, Returns
-- Migration: 0009_phase4_pos

CREATE TABLE IF NOT EXISTS cash_register (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  locationId TEXT NOT NULL REFERENCES location(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS cash_register_org_idx ON cash_register(organizationId);
CREATE INDEX IF NOT EXISTS cash_register_org_location_idx ON cash_register(organizationId, locationId);

CREATE TABLE IF NOT EXISTS register_session (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  cashRegisterId TEXT NOT NULL REFERENCES cash_register(id) ON DELETE RESTRICT,
  openedBy TEXT NOT NULL,
  closedBy TEXT,
  openingCash INTEGER NOT NULL,
  closingCash INTEGER,
  status TEXT NOT NULL DEFAULT 'OPEN',
  openedAt INTEGER NOT NULL,
  closedAt INTEGER
);

CREATE INDEX IF NOT EXISTS register_session_org_idx ON register_session(organizationId);
CREATE INDEX IF NOT EXISTS register_session_org_register_idx ON register_session(organizationId, cashRegisterId);

CREATE TABLE IF NOT EXISTS pos_sale (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  sessionId TEXT NOT NULL REFERENCES register_session(id) ON DELETE RESTRICT,
  locationId TEXT NOT NULL REFERENCES location(id) ON DELETE RESTRICT,
  customerId TEXT,
  saleNumber TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  subtotal INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  tax INTEGER NOT NULL DEFAULT 0,
  grandTotal INTEGER NOT NULL,
  notes TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS pos_sale_org_idx ON pos_sale(organizationId);
CREATE INDEX IF NOT EXISTS pos_sale_org_status_idx ON pos_sale(organizationId, status);
CREATE INDEX IF NOT EXISTS pos_sale_org_session_idx ON pos_sale(organizationId, sessionId);

CREATE TABLE IF NOT EXISTS pos_sale_item (
  id TEXT PRIMARY KEY,
  saleId TEXT NOT NULL REFERENCES pos_sale(id) ON DELETE CASCADE,
  variantId TEXT NOT NULL REFERENCES product_variant(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unitPrice INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  lineTotal INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS pos_sale_item_sale_idx ON pos_sale_item(saleId);

CREATE TABLE IF NOT EXISTS pos_sale_payment (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  saleId TEXT NOT NULL REFERENCES pos_sale(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  amount INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS pos_sale_payment_org_sale_idx ON pos_sale_payment(organizationId, saleId);

CREATE TABLE IF NOT EXISTS pos_sale_return (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  saleId TEXT NOT NULL REFERENCES pos_sale(id) ON DELETE RESTRICT,
  returnNumber TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  approvedBy TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS pos_sale_return_org_idx ON pos_sale_return(organizationId);
CREATE INDEX IF NOT EXISTS pos_sale_return_org_sale_idx ON pos_sale_return(organizationId, saleId);

CREATE TABLE IF NOT EXISTS pos_sale_return_item (
  id TEXT PRIMARY KEY,
  returnId TEXT NOT NULL REFERENCES pos_sale_return(id) ON DELETE CASCADE,
  saleItemId TEXT NOT NULL REFERENCES pos_sale_item(id) ON DELETE RESTRICT,
  variantId TEXT NOT NULL REFERENCES product_variant(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS pos_sale_return_item_return_idx ON pos_sale_return_item(returnId);
