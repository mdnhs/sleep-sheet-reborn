-- Phase 2 extension: Purchase Returns
-- Migration: 0007_purchase_returns

CREATE TABLE IF NOT EXISTS purchase_return (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  purchaseOrderId TEXT NOT NULL REFERENCES purchase_order(id) ON DELETE RESTRICT,
  returnNumber TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  locationId TEXT NOT NULL REFERENCES location(id) ON DELETE RESTRICT,
  notes TEXT,
  approvedBy TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  UNIQUE(organizationId, returnNumber)
);

CREATE INDEX IF NOT EXISTS purchase_return_org_idx ON purchase_return(organizationId);
CREATE INDEX IF NOT EXISTS purchase_return_po_idx ON purchase_return(purchaseOrderId);

CREATE TABLE IF NOT EXISTS purchase_return_item (
  id TEXT PRIMARY KEY,
  purchaseReturnId TEXT NOT NULL REFERENCES purchase_return(id) ON DELETE CASCADE,
  purchaseItemId TEXT NOT NULL REFERENCES purchase_item(id) ON DELETE RESTRICT,
  variantId TEXT NOT NULL REFERENCES product_variant(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unitCost INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS purchase_return_item_return_idx ON purchase_return_item(purchaseReturnId);
CREATE INDEX IF NOT EXISTS purchase_return_item_purchase_item_idx ON purchase_return_item(purchaseItemId);
